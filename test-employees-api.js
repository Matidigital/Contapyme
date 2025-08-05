const fetch = require('node-fetch');

async function testEmployeesAPI() {
  try {
    console.log('🧪 Probando API de empleados...');
    
    const COMPANY_ID = '8033ee69-b420-4d91-ba0e-482f46cd6fce';
    const url = `http://localhost:3000/api/payroll/employees?company_id=${COMPANY_ID}`;
    
    console.log(`📡 GET ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ API funcionando correctamente');
      console.log(`👥 Empleados encontrados: ${data.count}`);
      
      if (data.data && data.data.length > 0) {
        const employee = data.data[0];
        console.log('👤 Primer empleado:');
        console.log(`   - Nombre: ${employee.first_name} ${employee.last_name}`);
        console.log(`   - RUT: ${employee.rut}`);
        console.log(`   - Configuración previsional:`, employee.payroll_config || 'No disponible');
      }
    } else {
      console.log('❌ Error en API:', data.error);
    }
    
  } catch (error) {
    console.error('💥 Error de conexión:', error.message);
  }
}

testEmployeesAPI();