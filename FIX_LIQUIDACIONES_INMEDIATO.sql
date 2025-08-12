-- ==========================================
-- FIX INMEDIATO: LIQUIDACIONES CONTAPYME
-- Ejecutar en Supabase Dashboard > SQL Editor
-- ==========================================

-- PASO 1: Crear empresa con ID correcto
INSERT INTO companies (
    id,
    name,
    rut,
    razon_social,
    nombre_fantasia,
    giro,
    address,
    phone,
    email,
    website,
    plan_tipo,
    estado,
    features,
    created_at
) VALUES (
    '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID,
    'ContaPyme Demo Enterprise',
    '76.123.456-7',
    'ContaPyme Demo Enterprise S.A.',
    'ContaPyme Demo',
    'Servicios de Contabilidad',
    'Av. Apoquindo 3000, Las Condes, Santiago',
    '+56 2 2987 5432',
    'demo@contapyme.cl',
    'https://contapyme.netlify.app',
    'empresarial',
    'activo',
    '{
        "payroll": true,
        "liquidations": true,
        "reports": true
    }'::JSONB,
    '2024-01-01T08:00:00Z'::TIMESTAMPTZ
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    estado = 'activo';

-- PASO 2: Crear empleado Juan Carlos
INSERT INTO employees (
    id,
    company_id,
    rut,
    first_name,
    last_name,
    birth_date,
    gender,
    email,
    phone,
    status,
    created_at
) VALUES (
    'e1111111-1111-1111-1111-111111111111'::UUID,
    '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID,
    '12.345.678-9',
    'Juan Carlos',
    'González',
    '1985-06-15'::DATE,
    'Masculino',
    'juan.gonzalez@contapyme.cl',
    '+56 9 8765 4321',
    'active',
    '2024-01-15T09:00:00Z'::TIMESTAMPTZ
) ON CONFLICT (id) DO UPDATE SET
    status = 'active';

-- PASO 3: Crear contrato para Juan Carlos
INSERT INTO employment_contracts (
    id,
    employee_id,
    company_id,
    contract_type,
    position,
    department,
    start_date,
    base_salary,
    salary_type,
    weekly_hours,
    status,
    created_at
) VALUES (
    'c1111111-1111-1111-1111-111111111111'::UUID,
    'e1111111-1111-1111-1111-111111111111'::UUID,
    '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID,
    'indefinido',
    'Contador Senior',
    'Contabilidad',
    '2024-01-15'::DATE,
    1200000.00,
    'monthly',
    45.00,
    'active',
    '2024-01-15T09:30:00Z'::TIMESTAMPTZ
) ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    base_salary = 1200000.00;

-- PASO 4: Crear empleado María Elena
INSERT INTO employees (
    id,
    company_id,
    rut,
    first_name,
    last_name,
    birth_date,
    gender,
    email,
    phone,
    status,
    created_at
) VALUES (
    'e2222222-2222-2222-2222-222222222222'::UUID,
    '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID,
    '11.111.111-1',
    'María Elena',
    'Rodríguez',
    '1990-03-22'::DATE,
    'Femenino',
    'maria.rodriguez@contapyme.cl',
    '+56 9 8765 4323',
    'active',
    '2024-02-01T09:00:00Z'::TIMESTAMPTZ
) ON CONFLICT (id) DO UPDATE SET
    status = 'active';

-- PASO 5: Crear contrato para María Elena
INSERT INTO employment_contracts (
    id,
    employee_id,
    company_id,
    contract_type,
    position,
    department,
    start_date,
    base_salary,
    salary_type,
    weekly_hours,
    status,
    created_at
) VALUES (
    'c2222222-2222-2222-2222-222222222222'::UUID,
    'e2222222-2222-2222-2222-222222222222'::UUID,
    '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID,
    'indefinido',
    'Asistente Administrativo',
    'Administración',
    '2024-02-01'::DATE,
    800000.00,
    'monthly',
    45.00,
    'active',
    '2024-02-01T09:30:00Z'::TIMESTAMPTZ
) ON CONFLICT (id) DO UPDATE SET
    status = 'active',
    base_salary = 800000.00;

-- PASO 6: Crear configuración previsional si la tabla existe
DO $$
BEGIN
    -- Juan Carlos
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payroll_config') THEN
        INSERT INTO payroll_config (
            employee_id,
            afp_code,
            health_institution_code,
            family_allowances,
            legal_gratification_type,
            created_at
        ) VALUES (
            'e1111111-1111-1111-1111-111111111111'::UUID,
            'HABITAT',
            'FONASA',
            2,
            'article_50', -- Habilitar gratificación legal
            '2024-01-15T10:00:00Z'::TIMESTAMPTZ
        ) ON CONFLICT (employee_id) DO UPDATE SET
            afp_code = 'HABITAT',
            health_institution_code = 'FONASA',
            family_allowances = 2,
            legal_gratification_type = 'article_50';
            
        -- María Elena
        INSERT INTO payroll_config (
            employee_id,
            afp_code,
            health_institution_code,
            family_allowances,
            legal_gratification_type,
            created_at
        ) VALUES (
            'e2222222-2222-2222-2222-222222222222'::UUID,
            'PROVIDA',
            'FONASA',
            0,
            'article_50', -- Habilitar gratificación legal
            '2024-02-01T10:00:00Z'::TIMESTAMPTZ
        ) ON CONFLICT (employee_id) DO UPDATE SET
            afp_code = 'PROVIDA',
            health_institution_code = 'FONASA',
            family_allowances = 0,
            legal_gratification_type = 'article_50';
    END IF;
END $$;

-- VERIFICACIÓN FINAL
SELECT 
    '✅ Fix aplicado exitosamente' as status,
    (SELECT COUNT(*) FROM companies WHERE id = '8033ee69-b420-4d91-ba0e-482f46cd6fce') as empresas_creadas,
    (SELECT COUNT(*) FROM employees WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce') as empleados_creados,
    (SELECT COUNT(*) FROM employment_contracts WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce') as contratos_creados;

-- MOSTRAR EMPLEADOS CREADOS
SELECT 
    e.first_name || ' ' || e.last_name as empleado,
    e.rut,
    ec.position,
    '$' || TO_CHAR(ec.base_salary, 'FM999,999,999') as salario_base,
    ec.contract_type,
    CASE WHEN ec.status = 'active' THEN '✅ Activo' ELSE '❌ Inactivo' END as estado
FROM employees e
LEFT JOIN employment_contracts ec ON e.id = ec.employee_id AND ec.status = 'active'
WHERE e.company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID
ORDER BY e.first_name;