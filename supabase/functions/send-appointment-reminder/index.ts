import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AppointmentReminder {
  appointmentId?: string;
  sendToAll?: boolean;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  treatment_type: string | null;
  notes: string | null;
  reminder_sent: boolean;
  patient_id: string;
  doctor_id: string;
  patients: Patient;
}

async function sendEmail(
  resendApiKey: string,
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Clínica La 92 <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.message || "Error sending email" };
    }

    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY no está configurado");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { appointmentId, sendToAll }: AppointmentReminder = await req.json();

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    let query = supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        treatment_type,
        notes,
        reminder_sent,
        patient_id,
        doctor_id,
        patients!inner (
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq("status", "scheduled")
      .eq("reminder_sent", false);

    if (sendToAll) {
      query = query.eq("appointment_date", tomorrowStr);
    } else if (appointmentId) {
      query = query.eq("id", appointmentId);
    } else {
      throw new Error("Debe proporcionar appointmentId o sendToAll");
    }

    const { data: appointments, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Error fetching appointments: ${fetchError.message}`);
    }

    if (!appointments || appointments.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No hay citas pendientes de recordatorio", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];
    const errors = [];

    for (const apt of appointments) {
      const appointment = apt as unknown as Appointment;
      const patient = appointment.patients;
      
      if (!patient.email) {
        errors.push({ appointmentId: appointment.id, error: "Paciente sin email" });
        continue;
      }

      // Format date and time
      const appointmentDate = new Date(appointment.appointment_date);
      const formattedDate = appointmentDate.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const startTime = appointment.start_time.substring(0, 5);

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #0891b2, #0e7490); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🦷 Clínica La 92</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Consultorio Odontológico</p>
            </div>
            
            <div style="padding: 32px;">
              <h2 style="color: #1e293b; margin: 0 0 16px;">Hola ${patient.first_name},</h2>
              
              <p style="color: #475569; line-height: 1.6; margin: 0 0 24px;">
                Te recordamos que tienes una cita programada para mañana.
              </p>
              
              <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px;"><strong style="color: #0891b2;">📅 Fecha:</strong> <span style="color: #1e293b;">${formattedDate}</span></p>
                <p style="margin: 0 0 12px;"><strong style="color: #0891b2;">🕐 Hora:</strong> <span style="color: #1e293b;">${startTime}</span></p>
                ${appointment.treatment_type ? `<p style="margin: 0;"><strong style="color: #0891b2;">🔧 Tratamiento:</strong> <span style="color: #1e293b;">${appointment.treatment_type}</span></p>` : ''}
              </div>
              
              <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>⚠️ Importante:</strong> Por favor llega 10 minutos antes de tu cita. 
                  Si necesitas cancelar o reprogramar, contáctanos con al menos 24 horas de anticipación.
                </p>
              </div>
              
              <p style="color: #475569; line-height: 1.6; margin: 0;">
                Si tienes alguna pregunta, no dudes en contactarnos.
              </p>
            </div>
            
            <div style="background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                Clínica La 92 - Consultorio Odontológico
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const emailResult = await sendEmail(
        RESEND_API_KEY,
        patient.email,
        `Recordatorio de Cita - ${formattedDate}`,
        emailHtml
      );

      if (emailResult.success) {
        // Mark as reminder sent
        await supabase
          .from("appointments")
          .update({ reminder_sent: true })
          .eq("id", appointment.id);

        // Create notification for the doctor
        await supabase
          .from("notifications")
          .insert([{
            user_id: appointment.doctor_id,
            title: "Recordatorio enviado",
            message: `Se envió recordatorio a ${patient.first_name} ${patient.last_name} para la cita de mañana a las ${startTime}`,
            type: "success",
            metadata: { appointment_id: appointment.id, patient_id: patient.id },
          }]);

        results.push({
          appointmentId: appointment.id,
          patientEmail: patient.email,
          status: "sent",
          emailId: emailResult.id,
        });
      } else {
        errors.push({ appointmentId: appointment.id, error: emailResult.error });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: results.length, 
        failed: errors.length,
        results,
        errors 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-appointment-reminder:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
