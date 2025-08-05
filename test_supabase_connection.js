const { createClient } = require('@supabase/supabase-js');

// Configuración Supabase
const supabaseUrl = 'https://yttdnmokivtayeunlvlk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dGRubW9raXZ0YXlldW5sdmxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA5MTkyMCwiZXhwIjoyMDY5NjY3OTIwfQ.sdjibYLZAvmIGP_eXlJuUIu8yfoscVkl87HvsFCHv-Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('🔗 Probando conexión a Supabase...\n');

  try {
    // Test 1: Verificar conexión básica
    console.log('📊 Test 1: Verificando tablas existentes...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, rut')
      .limit(5);

    if (companiesError) {
      console.log('❌ Error accediendo a companies:', companiesError.message);
      
      // Verificar si la tabla existe pero está vacía
      if (companiesError.code === 'PGRST116') {
        console.log('⚠️ Tabla companies no existe');
      }
    } else {
      console.log('✅ Tabla companies accesible:', companies?.length || 0, 'registros');
      if (companies && companies.length > 0) {
        console.log('   Empresas:', companies.map(c => `${c.name} (${c.rut})`));
      }
    }

    // Test 2: Verificar tabla employees
    console.log('\n👥 Test 2: Verificando tabla employees...');
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
      .limit(5);

    if (employeesError) {
      console.log('❌ Error accediendo a employees:', employeesError.message);
    } else {
      console.log('✅ Tabla employees accesible:', employees?.length || 0, 'registros');
    }

    // Test 3: Verificar tabla users
    console.log('\n👤 Test 3: Verificando tabla users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .limit(5);

    if (usersError) {
      console.log('❌ Error accediendo a users:', usersError.message);
      if (usersError.code === 'PGRST116') {
        console.log('⚠️ Tabla users no existe');
      }
    } else {
      console.log('✅ Tabla users accesible:', users?.length || 0, 'registros');
    }

    // Test 4: Intentar crear empresa demo si companies existe
    if (!companiesError) {
      console.log('\n🏢 Test 4: Intentando crear empresa demo...');
      const { data: newCompany, error: insertError } = await supabase
        .from('companies')
        .upsert({
          id: 'demo-company-12345678-9',
          name: 'PyME Ejemplo S.A.',
          rut: '12.345.678-9',
          razon_social: 'PyME Ejemplo S.A.',
          plan_tipo: 'demo',
          estado: 'activo'
        })
        .select();

      if (insertError) {
        console.log('❌ Error insertando empresa demo:', insertError.message);
      } else {
        console.log('✅ Empresa demo creada/actualizada:', newCompany);
      }
    }

    // Test 5: Probar API similar a la del frontend
    console.log('\n🧪 Test 5: Simulando API call de empleados...');
    const { data: employeesList, error: listError } = await supabase
      .from('employees')
      .select(`
        *,
        employment_contracts (
          id,
          position,
          department,
          contract_type,
          start_date,
          end_date,
          base_salary,
          salary_type,
          status
        )
      `)
      .eq('company_id', 'demo-company-12345678-9')
      .order('first_name', { ascending: true });

    if (listError) {
      console.log('❌ Error en simulación API empleados:', listError.message);
    } else {
      console.log('✅ API empleados simulada exitosamente:', employeesList?.length || 0, 'resultados');
    }

    console.log('\n📋 RESUMEN DE CONEXIÓN:');
    console.log('   🔗 URL:', supabaseUrl);
    console.log('   🔑 Service Role Key: Configurada');
    console.log('   📊 Acceso a companies:', companiesError ? '❌' : '✅');
    console.log('   👥 Acceso a employees:', employeesError ? '❌' : '✅');
    console.log('   👤 Acceso a users:', usersError ? '❌' : '✅');

  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

// Ejecutar test
testConnection();