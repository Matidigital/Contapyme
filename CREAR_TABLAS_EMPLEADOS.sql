-- =====================================================
-- MIGRACIÓN COMPLETA PARA MÓDULO DE EMPLEADOS
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. CREAR TABLA EMPLEADOS
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    rut VARCHAR(15) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    birth_date DATE,
    gender VARCHAR(20),
    marital_status VARCHAR(20),
    nationality VARCHAR(50) DEFAULT 'chilena',
    email VARCHAR(255) NOT NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(company_id, rut),
    CHECK (status IN ('active', 'inactive', 'terminated')),
    CHECK (gender IN ('masculino', 'femenino', 'otro')),
    CHECK (marital_status IN ('soltero', 'soltera', 'casado', 'casada', 'divorciado', 'divorciada', 'viudo', 'viuda'))
);

-- 2. CREAR TABLA CONTRATOS DE TRABAJO
CREATE TABLE IF NOT EXISTS employment_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    contract_type VARCHAR(20) DEFAULT 'indefinido',
    start_date DATE NOT NULL,
    end_date DATE,
    base_salary DECIMAL(12,2) NOT NULL,
    salary_type VARCHAR(20) DEFAULT 'monthly',
    weekly_hours INTEGER DEFAULT 45,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (contract_type IN ('indefinido', 'plazo_fijo', 'por_obra', 'temporal')),
    CHECK (salary_type IN ('monthly', 'hourly', 'daily')),
    CHECK (weekly_hours >= 1 AND weekly_hours <= 48),
    CHECK (status IN ('active', 'terminated', 'suspended')),
    CHECK (base_salary > 0)
);

-- 3. CREAR TABLA CONFIGURACIÓN PREVISIONAL
CREATE TABLE IF NOT EXISTS payroll_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- AFP (códigos estándar para compatibilidad)
    afp_code VARCHAR(20) NOT NULL DEFAULT 'HABITAT',
    
    -- Salud
    health_institution_code VARCHAR(20) NOT NULL DEFAULT 'FONASA',
    
    -- Cargas familiares
    family_allowances INTEGER DEFAULT 0,
    
    -- Gratificación legal
    legal_gratification_type VARCHAR(20) DEFAULT 'none',
    
    -- Seguro de cesantía
    has_unemployment_insurance BOOLEAN DEFAULT true,
    
    -- Campos adicionales para futuro
    apv_amount INTEGER DEFAULT 0,
    other_deductions_json JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(employee_id),
    CHECK (afp_code IN ('CAPITAL', 'CUPRUM', 'HABITAT', 'PLANVITAL', 'PROVIDA', 'MODELO', 'UNO')),
    CHECK (health_institution_code IN ('FONASA', 'BANMEDICA', 'CONSALUD', 'CRUZ_BLANCA', 'VIDA_TRES', 'COLMENA', 'ISAPRE_CONSALUD')),
    CHECK (family_allowances >= 0 AND family_allowances <= 10),
    CHECK (legal_gratification_type IN ('none', 'code_47', 'code_50'))
);

-- 4. CREAR ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_rut ON employees(rut);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

CREATE INDEX IF NOT EXISTS idx_employment_contracts_employee ON employment_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employment_contracts_company ON employment_contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_employment_contracts_status ON employment_contracts(status);

CREATE INDEX IF NOT EXISTS idx_payroll_config_employee ON payroll_config(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_config_afp ON payroll_config(afp_code);

-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_config ENABLE ROW LEVEL SECURITY;

-- 6. CREAR POLICIES DE SEGURIDAD
-- Policy para employees: solo la empresa puede ver sus empleados
CREATE POLICY "Companies can manage their employees" ON employees
    FOR ALL USING (true); -- Temporalmente permisivo para desarrollo

-- Policy para employment_contracts
CREATE POLICY "Companies can manage employee contracts" ON employment_contracts
    FOR ALL USING (true); -- Temporalmente permisivo para desarrollo

-- Policy para payroll_config
CREATE POLICY "Companies can manage employee payroll config" ON payroll_config
    FOR ALL USING (true); -- Temporalmente permisivo para desarrollo

-- 7. CREAR TRIGGERS PARA updated_at AUTOMÁTICO
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employment_contracts_updated_at
    BEFORE UPDATE ON employment_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_config_updated_at
    BEFORE UPDATE ON payroll_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. INSERTAR DATOS DE EJEMPLO (OPCIONAL)
INSERT INTO employees (
    company_id, 
    rut, 
    first_name, 
    last_name, 
    middle_name,
    birth_date,
    gender,
    marital_status,
    email,
    phone,
    address,
    city,
    region
) VALUES 
(
    '8033ee69-b420-4d91-ba0e-482f46cd6fce',
    '12.345.678-9',
    'Juan',
    'Pérez',
    'Carlos',
    '1985-05-15',
    'masculino',
    'casado',
    'juan.perez@empresa.cl',
    '+56912345678',
    'Av. Principal 123',
    'Santiago',
    'Metropolitana'
) ON CONFLICT (company_id, rut) DO NOTHING;

-- Obtener el ID del empleado insertado para crear contrato y config
DO $$
DECLARE
    employee_id_var UUID;
BEGIN
    SELECT id INTO employee_id_var 
    FROM employees 
    WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce' 
    AND rut = '12.345.678-9';
    
    IF employee_id_var IS NOT NULL THEN
        -- Insertar contrato
        INSERT INTO employment_contracts (
            employee_id,
            company_id,
            position,
            department,
            contract_type,
            start_date,
            base_salary,
            salary_type
        ) VALUES (
            employee_id_var,
            '8033ee69-b420-4d91-ba0e-482f46cd6fce',
            'Desarrollador Senior',
            'Tecnología',
            'indefinido',
            '2024-01-01',
            1500000.00,
            'monthly'
        ) ON CONFLICT DO NOTHING;
        
        -- Insertar configuración previsional
        INSERT INTO payroll_config (
            employee_id,
            afp_code,
            health_institution_code,
            family_allowances,
            legal_gratification_type,
            has_unemployment_insurance
        ) VALUES (
            employee_id_var,
            'HABITAT',
            'FONASA',
            2,
            'code_47',
            true
        ) ON CONFLICT (employee_id) DO NOTHING;
    END IF;
END $$;

-- 9. COMENTARIOS PARA DOCUMENTACIÓN
COMMENT ON TABLE employees IS 'Tabla principal de empleados del sistema';
COMMENT ON TABLE employment_contracts IS 'Contratos de trabajo por empleado';
COMMENT ON TABLE payroll_config IS 'Configuración previsional por empleado para cálculo automático de liquidaciones';

COMMENT ON COLUMN payroll_config.afp_code IS 'Código AFP: CAPITAL, CUPRUM, HABITAT, PLANVITAL, PROVIDA, MODELO, UNO';
COMMENT ON COLUMN payroll_config.health_institution_code IS 'Institución salud: FONASA o códigos ISAPRE';
COMMENT ON COLUMN payroll_config.family_allowances IS 'Número de cargas familiares (0-10)';
COMMENT ON COLUMN payroll_config.legal_gratification_type IS 'Tipo gratificación: none, code_47, code_50';

-- =====================================================
-- MIGRACIÓN COMPLETADA
-- Ahora puedes usar las APIs de empleados normalmente
-- =====================================================