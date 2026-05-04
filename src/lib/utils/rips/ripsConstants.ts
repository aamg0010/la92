/**
 * RIPS Constants - Resolución 2275/2023
 * Ministerio de Salud Colombia
 */

// Tipos de documento de identificación
export const TIPO_DOCUMENTO = {
  CC: { code: '1', name: 'Cédula de ciudadanía', ripsCode: 'CC' },
  CE: { code: '2', name: 'Cédula de extranjería', ripsCode: 'CE' },
  PA: { code: '3', name: 'Pasaporte', ripsCode: 'PA' },
  RC: { code: '4', name: 'Registro civil', ripsCode: 'RC' },
  TI: { code: '5', name: 'Tarjeta de identidad', ripsCode: 'TI' },
  AS: { code: '6', name: 'Adulto sin identificación', ripsCode: 'AS' },
  MS: { code: '7', name: 'Menor sin identificación', ripsCode: 'MS' },
  NIT: { code: '31', name: 'NIT', ripsCode: 'NI' },
  NUIP: { code: '11', name: 'NUIP', ripsCode: 'NU' },
  PEP: { code: '41', name: 'PEP (Permiso Especial de Permanencia)', ripsCode: 'PE' },
  PPT: { code: '47', name: 'PPT (Permiso por Protección Temporal)', ripsCode: 'PT' },
} as const;

export const TIPO_DOCUMENTO_OPTIONS = Object.entries(TIPO_DOCUMENTO).map(([key, value]) => ({
  value: value.ripsCode,
  label: `${value.ripsCode} - ${value.name}`,
  code: value.code,
}));

// Tipo de usuario
export const TIPO_USUARIO = {
  '01': 'Contributivo cotizante',
  '02': 'Contributivo beneficiario',
  '03': 'Subsidiado',
  '04': 'No afiliado (particular)',
  '05': 'Especial o de excepción cotizante',
  '06': 'Especial o de excepción beneficiario',
  '07': 'Persona privada de la libertad',
  '08': 'Tomador / amparado ARL',
  '09': 'Tomador / amparado SOAT',
} as const;

export const TIPO_USUARIO_OPTIONS = Object.entries(TIPO_USUARIO).map(([value, label]) => ({
  value,
  label: `${value} - ${label}`,
}));

// Finalidad de consulta
export const FINALIDAD_CONSULTA = {
  '01': 'Atención del parto (puerperio)',
  '02': 'Atención del recién nacido',
  '03': 'Atención en planificación familiar',
  '04': 'Detección de alteraciones de crecimiento y desarrollo del menor de 10 años',
  '05': 'Detección de alteración del desarrollo del joven (10-29 años)',
  '06': 'Detección de alteraciones del embarazo',
  '07': 'Detección de alteraciones del adulto (mayor de 45 años)',
  '08': 'Detección de cáncer de cuello uterino',
  '09': 'Detección de cáncer de seno',
  '10': 'Detección de ETS',
  '15': 'Atención odontológica de promoción y prevención',
  '16': 'No aplica',
} as const;

export const FINALIDAD_CONSULTA_OPTIONS = Object.entries(FINALIDAD_CONSULTA).map(([value, label]) => ({
  value,
  label: `${value} - ${label}`,
}));

// Causa externa
export const CAUSA_EXTERNA = {
  '01': 'Accidente de trabajo',
  '02': 'Accidente de tránsito',
  '03': 'Accidente rábico',
  '04': 'Accidente ofídico',
  '05': 'Otro tipo de accidente',
  '06': 'Evento catastrófico',
  '07': 'Lesión por agresión',
  '08': 'Lesión auto infligida',
  '09': 'Sospecha de maltrato físico',
  '10': 'Sospecha de abuso sexual',
  '11': 'Sospecha de violencia sexual',
  '12': 'Sospecha de maltrato emocional',
  '13': 'Enfermedad general',
  '14': 'Enfermedad profesional',
  '15': 'Otra',
} as const;

export const CAUSA_EXTERNA_OPTIONS = Object.entries(CAUSA_EXTERNA).map(([value, label]) => ({
  value,
  label: `${value} - ${label}`,
}));

// Tipo de diagnóstico
export const TIPO_DIAGNOSTICO = {
  '1': 'Impresión diagnóstica',
  '2': 'Confirmado nuevo',
  '3': 'Confirmado repetido',
} as const;

export const TIPO_DIAGNOSTICO_OPTIONS = Object.entries(TIPO_DIAGNOSTICO).map(([value, label]) => ({
  value,
  label: `${value} - ${label}`,
}));

// Ámbito de procedimiento
export const AMBITO_PROCEDIMIENTO = {
  '1': 'Ambulatorio',
  '2': 'Hospitalario',
  '3': 'Urgencias',
  '4': 'Domiciliario',
} as const;

export const AMBITO_PROCEDIMIENTO_OPTIONS = Object.entries(AMBITO_PROCEDIMIENTO).map(([value, label]) => ({
  value,
  label: `${value} - ${label}`,
}));

// Finalidad del procedimiento
export const FINALIDAD_PROCEDIMIENTO = {
  '1': 'Diagnóstico',
  '2': 'Terapéutico',
  '3': 'Protección específica',
  '4': 'Detección temprana de enfermedad general',
  '5': 'Detección temprana de enfermedad profesional',
} as const;

export const FINALIDAD_PROCEDIMIENTO_OPTIONS = Object.entries(FINALIDAD_PROCEDIMIENTO).map(([value, label]) => ({
  value,
  label: `${value} - ${label}`,
}));

// Forma de realización
export const FORMA_REALIZACION = {
  '1': 'Única',
  '2': 'Primera vez',
  '3': 'Segunda vez o más',
} as const;

// Sexo
export const SEXO = {
  M: 'Masculino',
  F: 'Femenino',
  I: 'Indeterminado',
} as const;

export const SEXO_OPTIONS = Object.entries(SEXO).map(([value, label]) => ({
  value,
  label,
}));

// Zona de residencia
export const ZONA_RESIDENCIA = {
  U: 'Urbana',
  R: 'Rural',
} as const;

export const ZONA_RESIDENCIA_OPTIONS = Object.entries(ZONA_RESIDENCIA).map(([value, label]) => ({
  value,
  label,
}));

// Tipo de servicio RIPS
export const TIPO_SERVICIO = {
  AC: 'Consulta',
  AP: 'Procedimiento',
  AM: 'Medicamento',
  AT: 'Otro servicio',
} as const;

export const TIPO_SERVICIO_OPTIONS = Object.entries(TIPO_SERVICIO).map(([value, label]) => ({
  value,
  label,
}));

// Vía de administración (para medicamentos)
export const VIA_ADMINISTRACION = {
  '1': 'Oral',
  '2': 'Sublingual',
  '3': 'Tópica',
  '4': 'Transdérmica',
  '5': 'Oftálmica',
  '6': 'Ótica',
  '7': 'Inhalatoria',
  '8': 'Rectal',
  '9': 'Vaginal',
  '10': 'Intramuscular',
  '11': 'Subcutánea',
  '12': 'Intravenosa',
  '13': 'Intradérmica',
  '14': 'Otra',
} as const;

// Unidad de medida de la edad
export const UNIDAD_EDAD = {
  '1': 'Años',
  '2': 'Meses',
  '3': 'Días',
} as const;

// Códigos de departamentos Colombia (principales)
export const DEPARTAMENTOS = {
  '05': 'Antioquia',
  '08': 'Atlántico',
  '11': 'Bogotá D.C.',
  '13': 'Bolívar',
  '15': 'Boyacá',
  '17': 'Caldas',
  '18': 'Caquetá',
  '19': 'Cauca',
  '20': 'Cesar',
  '23': 'Córdoba',
  '25': 'Cundinamarca',
  '27': 'Chocó',
  '41': 'Huila',
  '44': 'La Guajira',
  '47': 'Magdalena',
  '50': 'Meta',
  '52': 'Nariño',
  '54': 'Norte de Santander',
  '63': 'Quindío',
  '66': 'Risaralda',
  '68': 'Santander',
  '70': 'Sucre',
  '73': 'Tolima',
  '76': 'Valle del Cauca',
  '81': 'Arauca',
  '85': 'Casanare',
  '86': 'Putumayo',
  '88': 'San Andrés',
  '91': 'Amazonas',
  '94': 'Guainía',
  '95': 'Guaviare',
  '97': 'Vaupés',
  '99': 'Vichada',
} as const;

export const DEPARTAMENTOS_OPTIONS = Object.entries(DEPARTAMENTOS).map(([value, label]) => ({
  value,
  label: `${value} - ${label}`,
}));

// Municipios principales (Teruel, Huila como ejemplo base)
export const MUNICIPIOS_HUILA = {
  '41001': 'Neiva',
  '41006': 'Acevedo',
  '41013': 'Agrado',
  '41016': 'Aipe',
  '41020': 'Algeciras',
  '41026': 'Altamira',
  '41078': 'Baraya',
  '41132': 'Campoalegre',
  '41206': 'Colombia',
  '41244': 'Elías',
  '41298': 'Garzón',
  '41306': 'Gigante',
  '41319': 'Guadalupe',
  '41349': 'Hobo',
  '41357': 'Iquira',
  '41359': 'Isnos',
  '41378': 'La Argentina',
  '41396': 'La Plata',
  '41483': 'Nátaga',
  '41503': 'Oporapa',
  '41518': 'Paicol',
  '41524': 'Palermo',
  '41530': 'Palestina',
  '41548': 'Pital',
  '41551': 'Pitalito',
  '41615': 'Rivera',
  '41660': 'Saladoblanco',
  '41668': 'San Agustín',
  '41676': 'Santa María',
  '41770': 'Suaza',
  '41791': 'Tarqui',
  '41797': 'Tesalia',
  '41799': 'Tello',
  '41801': 'Teruel',
  '41807': 'Timaná',
  '41872': 'Villavieja',
  '41885': 'Yaguará',
} as const;

// Municipio por defecto para La 92 (Teruel, Huila)
export const DEFAULT_MUNICIPIO = '41801';
export const DEFAULT_DEPARTAMENTO = '41';

// Formato de archivos RIPS plano
export const RIPS_FILE_EXTENSIONS = {
  US: '.txt', // Usuarios
  AC: '.txt', // Consultas
  AP: '.txt', // Procedimientos
  AM: '.txt', // Medicamentos
  AT: '.txt', // Otros servicios
  AF: '.txt', // Facturación
  CT: '.txt', // Control
} as const;

// Separador de campos en archivos planos
export const FIELD_SEPARATOR = ',';

// Formato de fechas para RIPS
export const DATE_FORMAT_RIPS = 'dd/MM/yyyy';
export const DATE_FORMAT_RIPS_JSON = 'yyyy-MM-dd';

// Versión RIPS JSON
export const RIPS_JSON_VERSION = '2';

// Helper function to map document type
export function mapDocumentType(docType: string | null | undefined): string {
  if (!docType) return 'CC';

  const normalized = docType.toUpperCase().trim();

  // Direct mapping
  const directMap: Record<string, string> = {
    'CEDULA': 'CC',
    'CEDULA DE CIUDADANIA': 'CC',
    'CC': 'CC',
    'CEDULA DE EXTRANJERIA': 'CE',
    'CE': 'CE',
    'PASAPORTE': 'PA',
    'PA': 'PA',
    'REGISTRO CIVIL': 'RC',
    'RC': 'RC',
    'TARJETA DE IDENTIDAD': 'TI',
    'TI': 'TI',
    'NIT': 'NI',
    'NI': 'NI',
  };

  return directMap[normalized] || 'CC';
}

// Helper function to map gender
export function mapGender(gender: string | null | undefined): string {
  if (!gender) return 'M';

  const normalized = gender.toUpperCase().trim();

  if (normalized.startsWith('F') || normalized === 'FEMENINO' || normalized === 'MUJER') {
    return 'F';
  }
  if (normalized.startsWith('M') || normalized === 'MASCULINO' || normalized === 'HOMBRE') {
    return 'M';
  }

  return 'M';
}

// Helper to calculate age from birth date
export function calculateAge(birthDate: Date | string | null): { value: number; unit: string } {
  if (!birthDate) return { value: 30, unit: '1' }; // Default 30 años

  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    years--;
  }

  if (years >= 1) {
    return { value: years, unit: '1' }; // Años
  }

  // Calculate months
  let months = (today.getFullYear() - birth.getFullYear()) * 12;
  months += today.getMonth() - birth.getMonth();

  if (months >= 1) {
    return { value: months, unit: '2' }; // Meses
  }

  // Calculate days
  const diffTime = Math.abs(today.getTime() - birth.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return { value: days, unit: '3' }; // Días
}

// Format number with leading zeros
export function padNumber(num: number, length: number): string {
  return String(num).padStart(length, '0');
}

// Format currency for RIPS (no decimals for plano, 2 decimals for JSON)
export function formatCurrency(value: number, forJson: boolean = false): string {
  if (forJson) {
    return value.toFixed(2);
  }
  return Math.round(value).toString();
}

// Clean string for RIPS (remove special characters)
export function cleanRipsString(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .trim();
}
