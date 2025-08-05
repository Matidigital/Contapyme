// Script temporal para verificar el plan de cuentas
const fetch = require('node-fetch');

async function testChartAccounts() {
  try {
    console.log('🔍 Verificando API de Plan de Cuentas...');
    
    const response = await fetch('http://localhost:3000/api/chart-of-accounts?level=Imputable');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    if (data.accounts && data.accounts.length > 0) {
      console.log('✅ Plan de cuentas funcional:', data.accounts.length, 'cuentas');
    } else {
      console.log('❌ Plan de cuentas vacío o con errores');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testChartAccounts();