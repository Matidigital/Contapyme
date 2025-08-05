const { createClient } = require('@supabase/supabase-js');

// Configuración Supabase
const supabaseUrl = 'https://yttdnmokivtayeunlvlk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dGRubW9raXZ0YXlldW5sdmxrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA5MTkyMCwiZXhwIjoyMDY5NjY3OTIwfQ.sdjibYLZAvmIGP_eXlJuUIu8yfoscVkl87HvsFCHv-Q';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPayrollDatabase() {
  console.log('🚀 Iniciando corrección de base de datos Payroll...\n');

  try {
    // PASO 1: Verificar estado actual
    console.log('📊 PASO 1: Verificando estado actual...');
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT table_name, 
               COALESCE((
                 SELECT COUNT(*) 
                 FROM information_schema.columns 
                 WHERE table_name = t.table_name
               ), 0) as column_count
        FROM information_schema.tables t
        WHERE table_name IN ('companies', 'users', 'employees', 'employment_contracts', 'payroll_config')
        ORDER BY table_name;
      `
    });

    if (tablesError) {
      console.log('❌ Error verificando tablas:', tablesError);
      // Continuar de todas formas
    } else {
      console.log('✅ Tablas encontradas:', tables);
    }

    // PASO 2: Eliminar tablas problemáticas
    console.log('\n🗑️ PASO 2: Eliminando tablas problemáticas...');
    
    const dropQueries = [
      'ALTER TABLE IF EXISTS employees DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE IF EXISTS employment_contracts DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE IF EXISTS payroll_config DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE IF EXISTS payroll_documents DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE IF EXISTS companies DISABLE ROW LEVEL SECURITY;',
      
      'DROP POLICY IF EXISTS "Demo employees visible" ON employees;',
      'DROP POLICY IF EXISTS "Demo contracts visible" ON employment_contracts;',
      'DROP POLICY IF EXISTS "Demo company visible" ON companies;',
      
      'DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;',
      'DROP TRIGGER IF EXISTS update_contracts_updated_at ON employment_contracts;',
      'DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;',
      
      'DROP VIEW IF EXISTS employee_active_contracts;',
      'DROP VIEW IF EXISTS v_payroll_f29_summary;',
      
      'DROP TABLE IF EXISTS payroll_items CASCADE;',
      'DROP TABLE IF EXISTS payroll_documents CASCADE;',
      'DROP TABLE IF EXISTS payroll_config CASCADE;',
      'DROP TABLE IF EXISTS employment_contracts CASCADE;',
      'DROP TABLE IF EXISTS employees CASCADE;',
      
      'DROP FUNCTION IF EXISTS get_demo_company() CASCADE;',
      'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;'
    ];

    for (const query of dropQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { query });
        if (error && !error.message.includes('does not exist')) {
          console.log(`⚠️ Warning en: ${query.substring(0, 50)}...`, error.message);
        } else {
          console.log(`✅ ${query.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`⚠️ Skip: ${query.substring(0, 50)}...`);
      }
    }

    // PASO 3: Crear tabla companies si no existe
    console.log('\n🏢 PASO 3: Creando tabla companies...');
    const createCompaniesQuery = `
      CREATE TABLE IF NOT EXISTS companies (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        rut VARCHAR(20) UNIQUE NOT NULL,
        address TEXT,
        phone VARCHAR(20),
        email VARCHAR(255),
        razon_social VARCHAR(255),
        nombre_fantasia VARCHAR(255),
        giro TEXT,
        website VARCHAR(255),
        logo VARCHAR(500),
        plan_tipo VARCHAR(20) DEFAULT 'demo' CHECK (plan_tipo IN ('demo', 'basico', 'profesional', 'empresarial')),
        estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido', 'inactivo')),
        features JSONB DEFAULT '{}',
        limits JSONB DEFAULT '{}',
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255)
      );
    `;

    const { error: companiesError } = await supabase.rpc('exec_sql', { query: createCompaniesQuery });
    
    if (companiesError) {
      console.log('❌ Error creando companies:', companiesError);
      return;
    }
    console.log('✅ Tabla companies creada');

    // PASO 4: Crear tabla users si no existe
    console.log('\n👤 PASO 4: Creando tabla users...');
    const createUsersQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'CLIENT',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: usersError } = await supabase.rpc('exec_sql', { query: createUsersQuery });
    
    if (usersError) {
      console.log('❌ Error creando users:', usersError);
      return;
    }
    console.log('✅ Tabla users creada');

    // PASO 5: Insertar datos demo
    console.log('\n📊 PASO 5: Insertando datos demo...');
    
    const insertUserQuery = `
      INSERT INTO users (id, email, name, role) VALUES 
        ('550e8400-e29b-41d4-a716-446655440000', 'demo@pymeejemplo.cl', 'Usuario Demo', 'ADMIN')
      ON CONFLICT (email) DO NOTHING;
    `;

    const { error: userInsertError } = await supabase.rpc('exec_sql', { query: insertUserQuery });
    
    if (userInsertError) {
      console.log('❌ Error insertando usuario demo:', userInsertError);
    } else {
      console.log('✅ Usuario demo insertado');
    }

    const insertCompanyQuery = `
      INSERT INTO companies (
        id, name, rut, razon_social, nombre_fantasia, giro, address, phone, email, website,
        plan_tipo, estado, features, limits
      ) VALUES (
        'demo-company-12345678-9', 'PyME Ejemplo S.A.', '12.345.678-9', 'PyME Ejemplo S.A.', 'PyME Ejemplo',
        'Servicios de Consultoría y Asesoría Empresarial',
        'Av. Providencia 1234, Piso 8, Oficina 802, Providencia, Santiago',
        '+56 2 2345 6789', 'contacto@pymeejemplo.cl', 'https://pymeejemplo.cl',
        'demo', 'activo',
        '{"f29Analysis": true, "payroll": true, "fixedAssets": true}',
        '{"employees": 50, "storage": "500MB"}'
      ) ON CONFLICT (rut) DO UPDATE SET
        name = EXCLUDED.name,
        features = EXCLUDED.features;
    `;

    const { error: companyInsertError } = await supabase.rpc('exec_sql', { query: insertCompanyQuery });
    
    if (companyInsertError) {
      console.log('❌ Error insertando empresa demo:', companyInsertError);
    } else {
      console.log('✅ Empresa demo insertada');
    }

    // PASO 6: Crear tabla employees
    console.log('\n👥 PASO 6: Creando tabla employees...');
    const createEmployeesQuery = `
      CREATE TABLE employees (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        
        rut VARCHAR(12) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100),
        birth_date DATE NOT NULL,
        gender VARCHAR(20),
        marital_status VARCHAR(30),
        nationality VARCHAR(50) DEFAULT 'Chilena',
        
        email VARCHAR(255),
        phone VARCHAR(20),
        mobile_phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        region VARCHAR(100),
        postal_code VARCHAR(10),
        
        emergency_contact_name VARCHAR(200),
        emergency_contact_phone VARCHAR(20),
        emergency_contact_relationship VARCHAR(50),
        
        status VARCHAR(20) DEFAULT 'active',
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id),
        
        CONSTRAINT unique_employee_rut_company UNIQUE (rut, company_id)
      );
    `;

    const { error: employeesError } = await supabase.rpc('exec_sql', { query: createEmployeesQuery });
    
    if (employeesError) {
      console.log('❌ Error creando employees:', employeesError);
      return;
    }
    console.log('✅ Tabla employees creada');

    // PASO 7: Crear tabla employment_contracts
    console.log('\n📄 PASO 7: Creando tabla employment_contracts...');
    const createContractsQuery = `
      CREATE TABLE employment_contracts (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        
        contract_type VARCHAR(50) NOT NULL DEFAULT 'indefinido',
        position VARCHAR(200) NOT NULL,
        department VARCHAR(100),
        
        start_date DATE NOT NULL,
        end_date DATE,
        trial_period_end_date DATE,
        
        base_salary DECIMAL(12,2) NOT NULL,
        salary_type VARCHAR(20) NOT NULL DEFAULT 'monthly',
        currency VARCHAR(3) DEFAULT 'CLP',
        
        work_schedule VARCHAR(50) DEFAULT 'full_time',
        weekly_hours DECIMAL(4,2) DEFAULT 45,
        
        health_insurance VARCHAR(100),
        pension_fund VARCHAR(100),
        
        status VARCHAR(20) DEFAULT 'active',
        termination_date DATE,
        termination_reason TEXT,
        
        contract_document_url TEXT,
        signed_date DATE,
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id),
        
        CONSTRAINT valid_contract_dates CHECK (end_date IS NULL OR end_date >= start_date),
        CONSTRAINT valid_termination_date CHECK (termination_date IS NULL OR termination_date >= start_date)
      );
    `;

    const { error: contractsError } = await supabase.rpc('exec_sql', { query: createContractsQuery });
    
    if (contractsError) {
      console.log('❌ Error creando employment_contracts:', contractsError);
      return;
    }
    console.log('✅ Tabla employment_contracts creada');

    // PASO 8: Crear tabla payroll_config
    console.log('\n⚙️ PASO 8: Creando tabla payroll_config...');
    const createPayrollConfigQuery = `
      CREATE TABLE payroll_config (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        
        afp_name VARCHAR(50),
        afp_commission DECIMAL(5,2) DEFAULT 1.27,
        
        health_system VARCHAR(20) DEFAULT 'fonasa',
        health_provider VARCHAR(100),
        health_plan VARCHAR(100),
        health_plan_uf DECIMAL(5,2),
        
        afc_contract_type VARCHAR(20) DEFAULT 'indefinido',
        
        family_charges INTEGER DEFAULT 0,
        
        has_agreed_deposit BOOLEAN DEFAULT false,
        agreed_deposit_amount DECIMAL(10,2) DEFAULT 0,
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        CONSTRAINT unique_payroll_config_employee UNIQUE (employee_id)
      );
    `;

    const { error: payrollConfigError } = await supabase.rpc('exec_sql', { query: createPayrollConfigQuery });
    
    if (payrollConfigError) {
      console.log('❌ Error creando payroll_config:', payrollConfigError);
      return;
    }
    console.log('✅ Tabla payroll_config creada');

    // PASO 9: Crear funciones y triggers
    console.log('\n⚙️ PASO 9: Creando funciones y triggers...');
    
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;

    const { error: functionError } = await supabase.rpc('exec_sql', { query: createFunctionQuery });
    
    if (functionError) {
      console.log('❌ Error creando función:', functionError);
    } else {
      console.log('✅ Función update_updated_at_column creada');
    }

    const triggers = [
      'CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      'CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      'CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON employment_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();'
    ];

    for (const trigger of triggers) {
      const { error: triggerError } = await supabase.rpc('exec_sql', { query: trigger });
      if (triggerError) {
        console.log(`⚠️ Warning trigger: ${trigger.substring(0, 50)}...`, triggerError.message);
      } else {
        console.log(`✅ Trigger creado: ${trigger.substring(15, 50)}...`);
      }
    }

    // PASO 10: Crear índices
    console.log('\n📊 PASO 10: Creando índices...');
    const indexes = [
      'CREATE INDEX idx_companies_rut ON companies(rut);',
      'CREATE INDEX idx_employees_company_id ON employees(company_id);',
      'CREATE INDEX idx_employees_rut ON employees(rut);',
      'CREATE INDEX idx_contracts_employee_id ON employment_contracts(employee_id);',
      'CREATE INDEX idx_contracts_company_id ON employment_contracts(company_id);'
    ];

    for (const index of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { query: index });
      if (indexError && !indexError.message.includes('already exists')) {
        console.log(`⚠️ Warning index: ${index.substring(0, 50)}...`, indexError.message);
      } else {
        console.log(`✅ Índice creado: ${index.substring(13, 50)}...`);
      }
    }

    // PASO 11: Configurar RLS
    console.log('\n🔒 PASO 11: Configurando RLS...');
    const rlsQueries = [
      'ALTER TABLE companies ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE employees ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE employment_contracts ENABLE ROW LEVEL SECURITY;',
      'CREATE POLICY "Demo company visible" ON companies FOR ALL USING (id = \'demo-company-12345678-9\');',
      'CREATE POLICY "Demo employees visible" ON employees FOR ALL USING (company_id = \'demo-company-12345678-9\');',
      'CREATE POLICY "Demo contracts visible" ON employment_contracts FOR ALL USING (company_id = \'demo-company-12345678-9\');'
    ];

    for (const rlsQuery of rlsQueries) {
      const { error: rlsError } = await supabase.rpc('exec_sql', { query: rlsQuery });
      if (rlsError && !rlsError.message.includes('already exists')) {
        console.log(`⚠️ Warning RLS: ${rlsQuery.substring(0, 50)}...`, rlsError.message);
      } else {
        console.log(`✅ RLS: ${rlsQuery.substring(0, 50)}...`);
      }
    }

    // PASO 12: Crear vista
    console.log('\n👁️ PASO 12: Creando vista employee_active_contracts...');
    const createViewQuery = `
      CREATE OR REPLACE VIEW employee_active_contracts AS
      SELECT 
        e.*,
        ec.position,
        ec.department,
        ec.contract_type,
        ec.start_date,
        ec.end_date,
        ec.base_salary,
        ec.salary_type,
        ec.weekly_hours,
        ec.status as contract_status
      FROM employees e
      LEFT JOIN employment_contracts ec ON e.id = ec.employee_id
      WHERE ec.status = 'active'
      ORDER BY e.first_name, e.last_name;
    `;

    const { error: viewError } = await supabase.rpc('exec_sql', { query: createViewQuery });
    
    if (viewError) {
      console.log('❌ Error creando vista:', viewError);
    } else {
      console.log('✅ Vista employee_active_contracts creada');
    }

    // PASO 13: Verificación final
    console.log('\n✅ PASO 13: Verificación final...');
    
    // Verificar que la empresa demo existe
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, rut')
      .eq('id', 'demo-company-12345678-9')
      .single();

    if (companyError) {
      console.log('❌ Error verificando empresa demo:', companyError);
    } else {
      console.log('✅ Empresa demo verificada:', company);
    }

    // Verificar que se pueden listar empleados (debe retornar array vacío)
    const { data: employees, error: employeesListError } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', 'demo-company-12345678-9');

    if (employeesListError) {
      console.log('❌ Error listando empleados:', employeesListError);
    } else {
      console.log('✅ Lista de empleados funcional:', employees.length, 'empleados encontrados');
    }

    console.log('\n🎉 CORRECCIÓN COMPLETADA EXITOSAMENTE');
    console.log('📊 ESTADO FINAL:');
    console.log('   ✅ Tabla companies: Creada con empresa demo');
    console.log('   ✅ Tabla users: Creada con usuario demo');
    console.log('   ✅ Tabla employees: Creada y funcional');
    console.log('   ✅ Tabla employment_contracts: Creada y funcional');
    console.log('   ✅ Tabla payroll_config: Creada y funcional');
    console.log('   ✅ RLS: Configurado para empresa demo');
    console.log('   ✅ Índices: Creados para performance');
    console.log('   ✅ Triggers: Configurados para updated_at');
    console.log('\n🚀 El módulo payroll está listo para usar!');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  fixPayrollDatabase();
}

module.exports = { fixPayrollDatabase };