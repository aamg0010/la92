const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

// Crear PDF
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

const pageWidth = 210;
const pageHeight = 297;
const margin = 20;
const contentWidth = pageWidth - (margin * 2);
let y = margin;

// Colores
const primaryColor = [16, 185, 129]; // Verde esmeralda (dental)
const darkColor = [30, 30, 30];
const grayColor = [100, 100, 100];
const lightGray = [200, 200, 200];

// Helpers
function checkPageBreak(height = 20) {
  if (y + height > pageHeight - margin) {
    doc.addPage();
    y = margin;
    return true;
  }
  return false;
}

function addTitle(text, size = 24) {
  checkPageBreak(20);
  doc.setFontSize(size);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(text, margin, y);
  y += size * 0.5 + 5;
}

function addSubtitle(text, size = 14) {
  checkPageBreak(15);
  doc.setFontSize(size);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text(text, margin, y);
  y += size * 0.4 + 4;
}

function addText(text, size = 10) {
  doc.setFontSize(size);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkColor);
  const lines = doc.splitTextToSize(text, contentWidth);
  for (const line of lines) {
    checkPageBreak(6);
    doc.text(line, margin, y);
    y += 5;
  }
  y += 2;
}

function addBullet(text, size = 10) {
  doc.setFontSize(size);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkColor);
  const lines = doc.splitTextToSize(text, contentWidth - 8);
  checkPageBreak(6);
  doc.text('•', margin, y);
  doc.text(lines[0], margin + 5, y);
  y += 5;
  for (let i = 1; i < lines.length; i++) {
    checkPageBreak(6);
    doc.text(lines[i], margin + 5, y);
    y += 5;
  }
}

function addTable(headers, rows, colWidths) {
  const rowHeight = 7;
  const headerHeight = 8;
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  checkPageBreak(headerHeight + rowHeight * Math.min(rows.length, 3));

  // Header
  doc.setFillColor(16, 185, 129);
  doc.rect(margin, y - 5, totalWidth, headerHeight, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);

  let x = margin + 2;
  headers.forEach((header, i) => {
    doc.text(header, x, y);
    x += colWidths[i];
  });
  y += headerHeight;

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkColor);
  rows.forEach((row, rowIndex) => {
    checkPageBreak(rowHeight);
    if (rowIndex % 2 === 0) {
      doc.setFillColor(240, 253, 244);
      doc.rect(margin, y - 5, totalWidth, rowHeight, 'F');
    }
    x = margin + 2;
    row.forEach((cell, i) => {
      const cellText = String(cell).substring(0, Math.floor(colWidths[i] / 2));
      doc.text(cellText, x, y);
      x += colWidths[i];
    });
    y += rowHeight;
  });
  y += 5;
}

function addLine() {
  checkPageBreak(5);
  doc.setDrawColor(...lightGray);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
}

function addSpace(space = 5) {
  y += space;
}

// ==================== CONTENIDO DEL INFORME ====================

// Portada
doc.setFillColor(16, 185, 129);
doc.rect(0, 0, pageWidth, 80, 'F');

doc.setFontSize(32);
doc.setFont('helvetica', 'bold');
doc.setTextColor(255, 255, 255);
doc.text('INFORME TECNICO', margin, 40);

doc.setFontSize(24);
doc.text('DENTRY', margin, 55);

doc.setFontSize(12);
doc.setFont('helvetica', 'normal');
doc.text('Software de Gestion para Clinicas Odontologicas', margin, 68);

y = 100;

doc.setTextColor(...darkColor);
doc.setFontSize(11);
doc.text('Fecha: 7 de Abril de 2026', margin, y); y += 7;
doc.text('Version: 2.7.1', margin, y); y += 7;
doc.text('URL: https://clinident.trycompany.es', margin, y); y += 7;
doc.text('Proyecto: Consultorio La 92', margin, y); y += 20;

addLine();
addSpace(5);

// Resumen Ejecutivo
addSubtitle('RESUMEN EJECUTIVO', 16);
addText('Dentry (anteriormente Clinident) es un software completo de gestion para clinicas odontologicas, desarrollado con arquitectura multi-tenant. El sistema incluye gestion de pacientes, agenda, facturacion, inventario, laboratorios dentales, y modulos de compliance para normativa colombiana (RIPS, RH1).');
addSpace(5);

addSubtitle('Metricas Clave del Proyecto');
addTable(
  ['Metrica', 'Valor'],
  [
    ['Archivos TypeScript (.tsx)', '256'],
    ['Archivos TypeScript (.ts)', '~27'],
    ['Archivos SQL', '35'],
    ['Lineas de codigo total', '~124,000'],
    ['Tablas de BD', '54'],
    ['Funciones RPC', '42'],
    ['Paginas/Vistas', '24'],
    ['Componentes UI', '166'],
    ['Custom Hooks', '28'],
    ['Commits', '69'],
    ['Periodo desarrollo', 'Ene 2025 - Feb 2026 (~13 meses)']
  ],
  [70, 70]
);

// Nueva página - Arquitectura
doc.addPage();
y = margin;

addTitle('1. ARQUITECTURA TECNICA', 18);
addSpace(3);

addSubtitle('1.1 Stack Tecnologico - Frontend');
addBullet('React 18.3.1 + TypeScript 5.8.3');
addBullet('Vite 5.4.19 (Build tool)');
addBullet('TailwindCSS 3.4.17 + Radix UI (shadcn/ui)');
addBullet('TanStack Query 5.83.0 (Estado servidor)');
addBullet('React Router 6.30.1');
addBullet('React Hook Form + Zod (Formularios y validacion)');
addSpace(5);

addSubtitle('1.2 Stack Tecnologico - Backend');
addBullet('PostgreSQL 13+ (Base de datos)');
addBullet('PostgREST (API REST automatica)');
addBullet('JWT Custom (Sesiones y autenticacion)');
addBullet('Arquitectura Multi-Tenant (Schemas PostgreSQL)');
addSpace(5);

addSubtitle('1.3 Arquitectura Multi-Tenant');
addText('El sistema implementa aislamiento completo de datos mediante schemas PostgreSQL independientes por clinica:');
addBullet('public schema: usuarios, licencias, clinicas (compartido)');
addBullet('clinic_xxx schema: datos especificos de cada clinica');
addBullet('Funciones RPC para cambio de tenant en tiempo real');
addSpace(10);

// Base de Datos
addTitle('2. BASE DE DATOS', 18);
addSpace(3);

addSubtitle('2.1 Estructura de Tablas (54 total)');
addTable(
  ['Modulo', 'Tablas', 'Proposito'],
  [
    ['Autenticacion', '7', 'users, profiles, sessions, roles'],
    ['Pacientes', '2', 'patients, patient_health_history'],
    ['Citas', '1', 'appointments'],
    ['Tratamientos', '2', 'treatments, treatment_materials'],
    ['Facturacion', '3', 'invoices, invoice_items, settings'],
    ['Pagos', '3', 'payments, financing_plans, installments'],
    ['Inventario', '7', 'items, movements, alerts, suppliers'],
    ['Laboratorios', '4', 'dental_labs, orders, tracking, quotes'],
    ['Liquidaciones', '3', 'settlements, items, expenses'],
    ['RIPS', '5', 'invoices, items, reports, catalogs'],
    ['Residuos RH1', '2', 'disposals, schedules'],
    ['Ambiental', '2', 'readings, config'],
    ['Chat', '4', 'conversations, messages, templates'],
    ['Admin', '3', 'clinics, licenses, clinic_users']
  ],
  [45, 25, 75]
);

addSubtitle('2.2 Funciones RPC (42 total)');
addBullet('Autenticacion: login, register, logout, get_current_user, select_clinic');
addBullet('Admin: create_clinic, get_all_clinics, update_license, toggle_clinic_active');
addBullet('Schema: create_clinic_schema, clone_schema_function, set_tenant');
addBullet('RIPS: get_rips_invoices, save_rips_report, get_rips_provider_settings');
addBullet('Residuos: get_waste_stats_monthly, get_upcoming_waste_pickups');
addBullet('Ambiental: get_environmental_today, get_environmental_monthly_report');

// Nueva página - Módulos
doc.addPage();
y = margin;

addTitle('3. MODULOS FUNCIONALES', 18);
addSpace(3);

addSubtitle('3.1 Modulos Completados (100%)');
addBullet('Gestion de Pacientes - CRUD completo, historial clinico, odontograma digital');
addBullet('Agenda y Citas - Calendario, programacion, recordatorios');
addBullet('Tratamientos - Catalogo, materiales, precios');
addBullet('Inventario - Stock, movimientos, alertas, proveedores');
addBullet('Laboratorios Dentales - Ordenes, seguimiento, cotizaciones');
addBullet('Facturacion - Facturas, items, personalizacion');
addBullet('Finanzas - Dashboard financiero, reportes');
addBullet('Cobros - Planes de pago, cuotas, recibos');
addBullet('Liquidaciones - Liquidacion de doctores automatizada');
addBullet('Dashboard - Widgets, estadisticas, acciones rapidas');
addBullet('Asistente IA - Integracion Google Gemini 2.5');
addBullet('Admin Multi-Tenant - Gestion de clinicas, usuarios, licencias');
addSpace(5);

addSubtitle('3.2 Modulos de Compliance (100%)');
addBullet('RIPS (Colombia) - Reportes IPS, catalogos CIE-10/CUPS, exportacion');
addBullet('RH1 Residuos - Gestion de residuos hospitalarios, clasificacion, reportes');
addBullet('Control Ambiental - Monitoreo temperatura/humedad, alertas, cumplimiento');
addSpace(5);

addSubtitle('3.3 Modulos en Desarrollo');
addTable(
  ['Modulo', 'Estado', 'Pendiente'],
  [
    ['Chat Interno', '80%', 'Upload de archivos'],
    ['Notificaciones', '70%', 'Integracion completa'],
    ['Egresos', '95%', 'Exportacion Excel/CSV']
  ],
  [50, 30, 65]
);

addSpace(5);
addSubtitle('Estado de Avance Global: 92%');

// Nueva página - Horas
doc.addPage();
y = margin;

addTitle('4. ESTIMACION DE HORAS', 18);
addSpace(3);

addSubtitle('4.1 Metodologia de Calculo');
addBullet('Lineas productivas/hora: 15-25 LOC/hora (promedio 20)');
addBullet('Factor de overhead: 1.5x (diseno, testing, debugging)');
addBullet('Complejidad sistema dental: 1.2x');
addSpace(5);

addSubtitle('4.2 Desglose por Componente');
addTable(
  ['Componente', 'LOC', 'Horas', 'Total'],
  [
    ['Frontend React/TS', '104,695', '7,852h', '9,423h'],
    ['Backend SQL', '16,885', '1,266h', '1,520h'],
    ['Configuracion', '-', '45h', '54h'],
    ['Diseno UI/UX', '-', '225h', '270h'],
    ['Testing manual', '-', '120h', '120h'],
    ['Documentacion', '-', '30h', '30h']
  ],
  [50, 35, 30, 30]
);

addSubtitle('4.3 Resumen de Horas');
addTable(
  ['Concepto', 'Horas'],
  [
    ['Desarrollo tecnico', '10,997h'],
    ['Diseno y UX', '270h'],
    ['Testing', '120h'],
    ['Documentacion', '30h'],
    ['TOTAL ESTIMADO', '~11,400h']
  ],
  [80, 50]
);

addSubtitle('4.4 Equivalencias');
addTable(
  ['Metrica', 'Valor'],
  [
    ['Horas totales', '~11,400h'],
    ['Meses (1 dev, 160h/mes)', '71 meses (~6 anos)'],
    ['Meses (equipo 3 devs)', '24 meses (~2 anos)'],
    ['Desarrollo real observado', '13 meses (1-2 devs)'],
    ['Factor de productividad', '4-5x (muy alta)']
  ],
  [70, 70]
);

addSpace(5);
addText('Nota: El desarrollo real en 13 meses indica uso extensivo de componentes pre-construidos (shadcn/ui), codigo generado por IA, y desarrollador(es) senior muy eficiente(s).');

// Nueva página - Precios
doc.addPage();
y = margin;

addTitle('5. ANALISIS DE PRECIOS', 18);
addSpace(3);

addSubtitle('5.1 Precio de Produccion (Costo de Desarrollo)');
addSpace(3);

addText('Escenario A: Desarrollo Interno Espana');
addTable(
  ['Perfil', 'Tarifa/h', 'Horas', 'Costo'],
  [
    ['Senior Full-Stack', '45-60 EUR', '8,500h', '382,500-510,000 EUR'],
    ['Mid Full-Stack', '35-45 EUR', '2,000h', '70,000-90,000 EUR'],
    ['DevOps/Infra', '50-65 EUR', '500h', '25,000-32,500 EUR'],
    ['UI/UX Designer', '40-55 EUR', '400h', '16,000-22,000 EUR'],
    ['TOTAL', '', '11,400h', '493,500-654,500 EUR']
  ],
  [45, 30, 30, 60]
);

addText('Escenario B: Desarrollo Nearshore (LATAM)');
addTable(
  ['Perfil', 'Tarifa/h', 'Horas', 'Costo'],
  [
    ['Senior Full-Stack', '25-40 EUR', '8,500h', '212,500-340,000 EUR'],
    ['Mid Full-Stack', '18-28 EUR', '2,000h', '36,000-56,000 EUR'],
    ['DevOps/Infra', '28-40 EUR', '500h', '14,000-20,000 EUR'],
    ['UI/UX Designer', '22-35 EUR', '400h', '8,800-14,000 EUR'],
    ['TOTAL', '', '11,400h', '271,300-430,000 EUR']
  ],
  [45, 30, 30, 60]
);

addSubtitle('5.2 Rango de Costo de Produccion');
addTable(
  ['Escenario', 'Rango'],
  [
    ['Minimo (offshore + IA)', '220,000 EUR'],
    ['Medio (nearshore)', '350,000 EUR'],
    ['Alto (interno Espana)', '575,000 EUR'],
    ['Premium (agencia top)', '700,000 EUR']
  ],
  [70, 70]
);

// Nueva página - Precios de venta
doc.addPage();
y = margin;

addSubtitle('5.3 Comparativa Software Dental');
addSpace(3);

addTable(
  ['Software', 'Licencia', 'SaaS Mensual'],
  [
    ['Dentrix (USA)', '20,000-40,000 EUR', '-'],
    ['Eaglesoft (USA)', '15,000-30,000 EUR', '-'],
    ['Open Dental', '4,000-8,000 EUR', '200-500 EUR/mes'],
    ['Curve Dental', '-', '300-600 EUR/mes'],
    ['Dentry', '?', '?']
  ],
  [55, 55, 50]
);

addSubtitle('5.4 Modelos de Precio Recomendados para Dentry');
addSpace(3);

addText('Opcion 1: Venta de Licencia Perpetua');
addTable(
  ['Tamano Clinica', 'Precio Licencia', 'Mant. Anual (18%)'],
  [
    ['Consultorio (1-3 sillas)', '8,000-15,000 EUR', '1,440-2,700 EUR/ano'],
    ['Clinica mediana (4-8)', '15,000-30,000 EUR', '2,700-5,400 EUR/ano'],
    ['Cadena/Franquicia', '30,000-60,000 EUR', '5,400-10,800 EUR/ano']
  ],
  [55, 50, 55]
);

addText('Opcion 2: SaaS (Suscripcion Mensual)');
addTable(
  ['Plan', 'Usuarios', 'Precio/mes', 'Anual'],
  [
    ['Basico', '1-2', '150-250 EUR', '1,800-3,000 EUR'],
    ['Professional', '3-5', '300-500 EUR', '3,600-6,000 EUR'],
    ['Enterprise', 'Ilimitado', '700-1,200 EUR', '8,400-14,400 EUR']
  ],
  [40, 35, 40, 50]
);

addText('Opcion 3: Venta Completa del Producto');
addTable(
  ['Concepto', 'Rango'],
  [
    ['Codigo fuente + documentacion', '150,000-250,000 EUR'],
    ['Con derechos de reventa', '300,000-450,000 EUR'],
    ['Transferencia total (exclusividad)', '450,000-650,000 EUR']
  ],
  [85, 70]
);

addSubtitle('5.5 Valoracion del Producto');
addTable(
  ['Metodo de Valoracion', 'Valor Estimado'],
  [
    ['Costo de reposicion', '350,000-500,000 EUR'],
    ['Multiplo de desarrollo (2-3x)', '700,000-1,000,000 EUR'],
    ['Valor de mercado (comparable)', '350,000-550,000 EUR']
  ],
  [85, 70]
);

addSpace(5);
doc.setFillColor(16, 185, 129);
doc.rect(margin, y, contentWidth, 12, 'F');
doc.setFontSize(11);
doc.setFont('helvetica', 'bold');
doc.setTextColor(255, 255, 255);
doc.text('VALORACION RECOMENDADA: 400,000 - 550,000 EUR', margin + 20, y + 8);
y += 20;

// Última página - Resumen y Diferenciadores
doc.addPage();
y = margin;

addTitle('6. DIFERENCIADORES', 18);
addSpace(3);

addSubtitle('6.1 Ventajas Competitivas');
addBullet('Multi-tenant real - Arquitectura de schemas PostgreSQL para aislamiento total');
addBullet('Compliance colombiano - RIPS y RH1 integrados nativamente');
addBullet('Control ambiental - Monitoreo de temperatura y humedad con alertas');
addBullet('Asistente IA - Integracion con Google Gemini 2.5 para consultas');
addBullet('Odontograma digital - Historial clinico visual interactivo');
addBullet('Sistema financiero completo - Cuotas, liquidaciones, egresos');
addBullet('Laboratorios dentales - Gestion de ordenes y seguimiento');
addBullet('Chat interno - Mensajeria en tiempo real entre usuarios');
addSpace(10);

addTitle('7. RESUMEN FINAL', 18);
addSpace(5);

addSubtitle('Producto');
addBullet('DENTRY v2.7.1 - Software de Gestion Odontologica');
addBullet('Tecnologia: React + TypeScript + PostgreSQL + PostgREST');
addBullet('Diferenciador: Multi-tenant + Compliance Colombia + IA integrada');
addSpace(5);

addSubtitle('Metricas Clave');
addTable(
  ['Concepto', 'Valor'],
  [
    ['Lineas de codigo', '~124,000'],
    ['Horas de desarrollo estimadas', '~11,400h'],
    ['Estado de completitud', '92%'],
    ['Horas para completar al 100%', '~200h adicionales']
  ],
  [80, 70]
);

addSubtitle('Precios');
addTable(
  ['Concepto', 'Rango'],
  [
    ['Costo de produccion', '220,000-650,000 EUR'],
    ['Precio licencia consultorio', '8,000-15,000 EUR'],
    ['Precio licencia clinica', '15,000-30,000 EUR'],
    ['Venta completa del producto', '400,000-550,000 EUR'],
    ['SaaS mensual', '150-1,200 EUR/mes']
  ],
  [80, 70]
);

addSpace(10);
addLine();
addSpace(5);

doc.setFontSize(10);
doc.setFont('helvetica', 'italic');
doc.setTextColor(...grayColor);
doc.text('Informe generado el 7 de Abril de 2026', margin, y);
y += 6;
doc.text('Dentry - Software de Gestion Odontologica - TryCompany', margin, y);

// Guardar PDF
const outputPath = path.join(__dirname, 'Informe_Tecnico_Dentry.pdf');
const pdfBuffer = doc.output('arraybuffer');
fs.writeFileSync(outputPath, Buffer.from(pdfBuffer));

console.log('PDF generado exitosamente en:', outputPath);
