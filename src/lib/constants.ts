// Constantes del sistema ContaPyme

// Usuario demo - simplificado para compatibilidad
export const DEMO_USER_ID = 'demo-user';  // TEXT simple en lugar de UUID
export const DEMO_USER_EMAIL = 'demo@pymeejemplo.cl';
export const DEMO_USER_NAME = 'Usuario Demo PyME';

// Empresa demo
export const DEMO_COMPANY_RUT = '12.345.678-9';
export const DEMO_COMPANY_NAME = 'PyME Ejemplo S.A.';
export const DEMO_COMPANY_UUID = 'demo-company-12345678-9';

// Configuración de sistema
export const DEMO_MODE = true;
export const SYSTEM_VERSION = '1.0.0';

// URLs y endpoints
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://funny-elf-4be477.netlify.app'
  : 'http://localhost:3000';