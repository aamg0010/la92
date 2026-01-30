export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_settings: {
        Row: {
          ai_enabled: boolean | null
          auto_suggestions: boolean | null
          created_at: string | null
          default_model: string | null
          diagnosis_assistance: boolean | null
          id: string
          max_tokens: number | null
          temperature: number | null
          treatment_recommendations: boolean | null
          updated_at: string | null
        }
        Insert: {
          ai_enabled?: boolean | null
          auto_suggestions?: boolean | null
          created_at?: string | null
          default_model?: string | null
          diagnosis_assistance?: boolean | null
          id?: string
          max_tokens?: number | null
          temperature?: number | null
          treatment_recommendations?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ai_enabled?: boolean | null
          auto_suggestions?: boolean | null
          created_at?: string | null
          default_model?: string | null
          diagnosis_assistance?: boolean | null
          id?: string
          max_tokens?: number | null
          temperature?: number | null
          treatment_recommendations?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          created_at: string
          doctor_id: string
          end_time: string
          id: string
          notes: string | null
          patient_id: string
          reminder_sent: boolean | null
          start_time: string
          status: string
          treatment_type: string | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          created_at?: string
          doctor_id: string
          end_time: string
          id?: string
          notes?: string | null
          patient_id: string
          reminder_sent?: boolean | null
          start_time: string
          status?: string
          treatment_type?: string | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          created_at?: string
          doctor_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          patient_id?: string
          reminder_sent?: boolean | null
          start_time?: string
          status?: string
          treatment_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          updated_at: string
          uploaded_by: string
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          updated_at?: string
          uploaded_by: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          updated_at?: string
          uploaded_by?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          address: string | null
          city: string | null
          clinic_name: string
          closing_time: string | null
          created_at: string | null
          currency: string | null
          date_format: string | null
          email: string | null
          id: string
          logo_url: string | null
          opening_time: string | null
          phone: string | null
          tax_id: string | null
          timezone: string | null
          updated_at: string | null
          website: string | null
          working_days: string[] | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          clinic_name?: string
          closing_time?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          opening_time?: string | null
          phone?: string | null
          tax_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          working_days?: string[] | null
        }
        Update: {
          address?: string | null
          city?: string | null
          clinic_name?: string
          closing_time?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          opening_time?: string | null
          phone?: string | null
          tax_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          website?: string | null
          working_days?: string[] | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          responded_at: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          responded_at?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          responded_at?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      dental_labs: {
        Row: {
          accepts_digital: boolean | null
          address: string | null
          average_turnaround_days: number | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          rating: number | null
          slug: string
          specialties: string[] | null
          supported_formats: string[] | null
          total_orders: number | null
          website: string | null
        }
        Insert: {
          accepts_digital?: boolean | null
          address?: string | null
          average_turnaround_days?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          rating?: number | null
          slug: string
          specialties?: string[] | null
          supported_formats?: string[] | null
          total_orders?: number | null
          website?: string | null
        }
        Update: {
          accepts_digital?: boolean | null
          address?: string | null
          average_turnaround_days?: number | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          rating?: number | null
          slug?: string
          specialties?: string[] | null
          supported_formats?: string[] | null
          total_orders?: number | null
          website?: string | null
        }
        Relationships: []
      }
      financing_plans: {
        Row: {
          created_at: string
          created_by: string | null
          down_payment: number | null
          id: string
          installment_amount: number
          installments: number
          interest_rate: number | null
          invoice_id: string | null
          notes: string | null
          patient_id: string
          remaining_amount: number
          start_date: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          down_payment?: number | null
          id?: string
          installment_amount: number
          installments?: number
          interest_rate?: number | null
          invoice_id?: string | null
          notes?: string | null
          patient_id: string
          remaining_amount: number
          start_date: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          down_payment?: number | null
          id?: string
          installment_amount?: number
          installments?: number
          interest_rate?: number | null
          invoice_id?: string | null
          notes?: string | null
          patient_id?: string
          remaining_amount?: number
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financing_plans_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financing_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          expiration_date: string | null
          id: string
          is_active: boolean | null
          location: string | null
          max_stock: number | null
          min_stock: number | null
          name: string
          quantity: number
          sku: string | null
          supplier: string | null
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_stock?: number | null
          min_stock?: number | null
          name: string
          quantity?: number
          sku?: string | null
          supplier?: string | null
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          max_stock?: number | null
          min_stock?: number | null
          name?: string
          quantity?: number
          sku?: string | null
          supplier?: string | null
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          movement_type: string
          new_quantity: number
          notes: string | null
          previous_quantity: number
          quantity: number
          reference_id: string | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          movement_type: string
          new_quantity: number
          notes?: string | null
          previous_quantity: number
          quantity: number
          reference_id?: string | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          movement_type?: string
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          quantity?: number
          reference_id?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          discount: number | null
          id: string
          invoice_id: string
          quantity: number
          tax_rate: number | null
          tooth_number: string | null
          total: number
          treatment_id: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          discount?: number | null
          id?: string
          invoice_id: string
          quantity?: number
          tax_rate?: number | null
          tooth_number?: string | null
          total: number
          treatment_id?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          discount?: number | null
          id?: string
          invoice_id?: string
          quantity?: number
          tax_rate?: number | null
          tooth_number?: string | null
          total?: number
          treatment_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          created_by: string | null
          cufe: string | null
          dian_response: Json | null
          dian_status: string | null
          discount: number
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          patient_id: string
          rips_data: Json | null
          status: string
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          cufe?: string | null
          dian_response?: Json | null
          dian_status?: string | null
          discount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          patient_id: string
          rips_data?: Json | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          cufe?: string | null
          dian_response?: Json | null
          dian_status?: string | null
          discount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          patient_id?: string
          rips_data?: Json | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_order_tracking: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_order_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_orders: {
        Row: {
          actual_delivery: string | null
          created_at: string
          design_file_format: string | null
          design_file_url: string | null
          doctor_id: string
          estimated_delivery: string | null
          id: string
          material: string | null
          notes: string | null
          order_number: string
          patient_id: string | null
          priority: string | null
          selected_lab_id: string | null
          shade: string | null
          status: string | null
          tooth_numbers: string[] | null
          updated_at: string
          work_type: string
        }
        Insert: {
          actual_delivery?: string | null
          created_at?: string
          design_file_format?: string | null
          design_file_url?: string | null
          doctor_id: string
          estimated_delivery?: string | null
          id?: string
          material?: string | null
          notes?: string | null
          order_number: string
          patient_id?: string | null
          priority?: string | null
          selected_lab_id?: string | null
          shade?: string | null
          status?: string | null
          tooth_numbers?: string[] | null
          updated_at?: string
          work_type: string
        }
        Update: {
          actual_delivery?: string | null
          created_at?: string
          design_file_format?: string | null
          design_file_url?: string | null
          doctor_id?: string
          estimated_delivery?: string | null
          id?: string
          material?: string | null
          notes?: string | null
          order_number?: string
          patient_id?: string | null
          priority?: string | null
          selected_lab_id?: string | null
          shade?: string | null
          status?: string | null
          tooth_numbers?: string[] | null
          updated_at?: string
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_orders_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_orders_selected_lab_id_fkey"
            columns: ["selected_lab_id"]
            isOneToOne: false
            referencedRelation: "dental_labs"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_quotes: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          lab_id: string
          notes: string | null
          order_id: string
          price: number
          status: string | null
          turnaround_days: number
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          lab_id: string
          notes?: string | null
          order_id: string
          price: number
          status?: string | null
          turnaround_days: number
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          lab_id?: string
          notes?: string | null
          order_id?: string
          price?: number
          status?: string | null
          turnaround_days?: number
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_quotes_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "dental_labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_quotes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "lab_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          channel: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string | null
          type: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          channel: string
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject?: string | null
          type: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string | null
          type?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      patient_health_history: {
        Row: {
          attachments: Json | null
          created_at: string
          created_by: string | null
          diagnosis: string
          id: string
          notes: string | null
          patient_id: string
          tooth_number: string | null
          treatment: string | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          created_by?: string | null
          diagnosis: string
          id?: string
          notes?: string | null
          patient_id: string
          tooth_number?: string | null
          treatment?: string | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          created_by?: string | null
          diagnosis?: string
          id?: string
          notes?: string | null
          patient_id?: string
          tooth_number?: string | null
          treatment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_health_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          birth_date: string | null
          city: string | null
          created_at: string
          created_by: string | null
          document_number: string
          document_type: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string | null
          health_insurance: string | null
          id: string
          last_name: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          document_number: string
          document_type?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender?: string | null
          health_insurance?: string | null
          id?: string
          last_name: string
          notes?: string | null
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          document_number?: string
          document_type?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string | null
          health_insurance?: string | null
          id?: string
          last_name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          financing_plan_id: string | null
          id: string
          invoice_id: string
          is_financing_payment: boolean | null
          notes: string | null
          patient_id: string
          payment_date: string
          payment_method: string
          processed_by: string | null
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          financing_plan_id?: string | null
          id?: string
          invoice_id: string
          is_financing_payment?: boolean | null
          notes?: string | null
          patient_id: string
          payment_date?: string
          payment_method?: string
          processed_by?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          financing_plan_id?: string | null
          id?: string
          invoice_id?: string
          is_financing_payment?: boolean | null
          notes?: string | null
          patient_id?: string
          payment_date?: string
          payment_method?: string
          processed_by?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      treatments: {
        Row: {
          base_price: number
          category: string | null
          code: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          base_price?: number
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          base_price?: number
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          compact_mode: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          language: string | null
          notifications_enabled: boolean | null
          sound_enabled: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          compact_mode?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          compact_mode?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          notifications_enabled?: boolean | null
          sound_enabled?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_clinic_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "doctor" | "assistant" | "accountant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "doctor", "assistant", "accountant"],
    },
  },
} as const
