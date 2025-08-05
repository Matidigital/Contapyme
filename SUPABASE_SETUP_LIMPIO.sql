-- =====================================================
-- SETUP COMPLETO BASE DE DATOS CONTAPYME - VERSIÓN LIMPIA
-- =====================================================
-- Ejecutar TODO este script en Supabase SQL Editor

-- 1. CREAR TABLA EMPLOYEES DESDE CERO
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    
    -- Información Personal
    rut VARCHAR(12) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    birth_date DATE NOT NULL,
    gender VARCHAR(20),
    marital_status VARCHAR(30),
    nationality VARCHAR(50) DEFAULT 'Chilena',
    
    -- Información de Contacto
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(50),
    postal_code VARCHAR(10),
    
    -- Contacto de emergencia
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    
    -- Estado del empleado
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    termination_date DATE,
    termination_reason VARCHAR(50),
    termination_article VARCHAR(10),
    termination_detail TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    -- Constraints
    UNIQUE(company_id, rut)
);

-- 2. CREAR TABLA EMPLOYMENT_CONTRACTS
CREATE TABLE IF NOT EXISTS employment_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL,
    
    -- Información del contrato
    position VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    contract_type VARCHAR(20) NOT NULL DEFAULT 'indefinido' CHECK (contract_type IN ('indefinido', 'plazo_fijo', 'por_obra', 'part_time')),
    start_date DATE NOT NULL,
    end_date DATE,
    termination_date DATE,
    
    -- Salario y jornada
    base_salary DECIMAL(12,2) NOT NULL,
    salary_type VARCHAR(20) DEFAULT 'monthly' CHECK (salary_type IN ('monthly', 'hourly', 'daily')),
    weekly_hours DECIMAL(5,2) DEFAULT 45,
    
    -- Estado del contrato
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'terminated', 'suspended')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 3. CONFIGURACIÓN PREVISIONAL
CREATE TABLE IF NOT EXISTS payroll_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- AFP
    afp_name VARCHAR(50) NOT NULL,
    afp_commission DECIMAL(5,2) NOT NULL,
    
    -- Salud
    health_system VARCHAR(10) NOT NULL CHECK (health_system IN ('fonasa', 'isapre')),
    health_provider VARCHAR(50),
    health_plan VARCHAR(100),
    health_plan_uf DECIMAL(10,4),
    health_additional_uf DECIMAL(10,4) DEFAULT 0,
    
    -- Seguro cesantía
    afc_contract_type VARCHAR(20) NOT NULL DEFAULT 'indefinido' CHECK (afc_contract_type IN ('indefinido', 'plazo_fijo')),
    
    -- Otros
    has_agreed_deposit BOOLEAN DEFAULT false,
    agreed_deposit_amount DECIMAL(12,2) DEFAULT 0,
    family_charges INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id)
);

-- 4. DOCUMENTOS DE REMUNERACIONES
CREATE TABLE IF NOT EXISTS payroll_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id),
    company_id UUID NOT NULL,
    
    -- Período y tipo
    period VARCHAR(7) NOT NULL,
    document_type VARCHAR(20) NOT NULL CHECK (document_type IN ('liquidacion', 'finiquito', 'vacaciones')),
    document_number INTEGER NOT NULL,
    
    -- Días trabajados
    worked_days INTEGER NOT NULL DEFAULT 30,
    sunday_days INTEGER DEFAULT 0,
    
    -- Totales principales
    gross_income DECIMAL(12,2) NOT NULL,
    taxable_income DECIMAL(12,2) NOT NULL,
    non_taxable_income DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) NOT NULL,
    net_income DECIMAL(12,2) NOT NULL,
    
    -- Impuesto único (para F29 código 10)
    unique_tax DECIMAL(12,2) DEFAULT 0,
    unique_tax_factor DECIMAL(8,6),
    unique_tax_deduction DECIMAL(12,2),
    
    -- Préstamo solidario (para F29 código 161)
    solidarity_loan DECIMAL(12,2) DEFAULT 0,
    
    -- Detalle completo en JSON
    detail JSONB NOT NULL,
    
    -- Archivos
    pdf_url TEXT,
    xml_content TEXT,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid', 'cancelled')),
    paid_date DATE,
    payment_method VARCHAR(50),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(company_id, period, document_type, document_number)
);

-- 5. ITEMS DE LIQUIDACIÓN
CREATE TABLE IF NOT EXISTS payroll_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payroll_document_id UUID NOT NULL REFERENCES payroll_documents(id) ON DELETE CASCADE,
    
    -- Clasificación
    item_type VARCHAR(10) NOT NULL CHECK (item_type IN ('haber', 'descuento')),
    category VARCHAR(50) NOT NULL,
    code VARCHAR(20),
    
    -- Descripción y montos
    description VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,4) DEFAULT 1,
    unit_value DECIMAL(12,2) DEFAULT 0,
    amount DECIMAL(12,2) NOT NULL,
    
    -- Propiedades tributarias
    is_taxable BOOLEAN DEFAULT true,
    is_imponible BOOLEAN DEFAULT true,
    is_gratifiable BOOLEAN DEFAULT true,
    
    -- Orden de presentación
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. PARÁMETROS PREVISIONALES
CREATE TABLE IF NOT EXISTS payroll_parameters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    valid_from DATE NOT NULL,
    valid_until DATE,
    
    -- Topes imponibles
    uf_value DECIMAL(10,2) NOT NULL,
    max_imponible_uf DECIMAL(10,2) NOT NULL DEFAULT 84.5,
    max_cesantia_uf DECIMAL(10,2) NOT NULL DEFAULT 128.9,
    
    -- Asignación familiar
    family_allowance_a DECIMAL(10,2) DEFAULT 20366,
    family_allowance_b DECIMAL(10,2) DEFAULT 12475,
    family_allowance_c DECIMAL(10,2) DEFAULT 3942,
    family_allowance_income_limit_a DECIMAL(12,2) DEFAULT 514516,
    family_allowance_income_limit_b DECIMAL(12,2) DEFAULT 755853,
    family_allowance_income_limit_c DECIMAL(12,2) DEFAULT 1178062,
    
    -- Mínimos
    minimum_wage DECIMAL(10,2) DEFAULT 500000,
    
    -- Seguro cesantía
    afc_employer_indefinido DECIMAL(5,2) DEFAULT 2.4,
    afc_employee DECIMAL(5,2) DEFAULT 0.6,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(valid_from)
);

-- 7. TABLA DE IMPUESTO ÚNICO
CREATE TABLE IF NOT EXISTS tax_brackets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    valid_from DATE NOT NULL,
    valid_until DATE,
    
    -- Tramos en UTM
    from_utm DECIMAL(10,4) NOT NULL,
    to_utm DECIMAL(10,4),
    
    -- Factor y cantidad a rebajar
    tax_factor DECIMAL(8,6) NOT NULL,
    deduction_utm DECIMAL(10,4) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(valid_from, from_utm)
);

-- 8. ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_rut ON employees(rut);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

CREATE INDEX IF NOT EXISTS idx_contracts_employee ON employment_contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON employment_contracts(status);

CREATE INDEX IF NOT EXISTS idx_payroll_config_employee ON payroll_config(employee_id);

CREATE INDEX IF NOT EXISTS idx_payroll_documents_employee ON payroll_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_documents_period ON payroll_documents(period);
CREATE INDEX IF NOT EXISTS idx_payroll_documents_status ON payroll_documents(status);

CREATE INDEX IF NOT EXISTS idx_payroll_items_document ON payroll_items(payroll_document_id);
CREATE INDEX IF NOT EXISTS idx_payroll_items_type ON payroll_items(item_type);

-- 9. FUNCIÓN PARA VALIDAR RUT CHILENO
CREATE OR REPLACE FUNCTION validate_chilean_rut(rut TEXT) RETURNS BOOLEAN AS $$
DECLARE
    clean_rut TEXT;
    rut_number TEXT;
    verifier CHAR(1);
    calculated_verifier CHAR(1);
    sum INTEGER := 0;
    multiplier INTEGER := 2;
    i INTEGER;
BEGIN
    -- Limpiar RUT
    clean_rut := REGEXP_REPLACE(UPPER(rut), '[^0-9K]', '', 'g');
    
    IF LENGTH(clean_rut) < 2 THEN
        RETURN FALSE;
    END IF;
    
    -- Separar número y dígito verificador
    verifier := RIGHT(clean_rut, 1);
    rut_number := LEFT(clean_rut, LENGTH(clean_rut) - 1);
    
    -- Calcular dígito verificador
    FOR i IN REVERSE LENGTH(rut_number)..1 LOOP
        sum := sum + (SUBSTRING(rut_number, i, 1)::INTEGER * multiplier);
        multiplier := multiplier + 1;
        IF multiplier > 7 THEN
            multiplier := 2;
        END IF;
    END LOOP;
    
    CASE 11 - (sum % 11)
        WHEN 11 THEN calculated_verifier := '0';
        WHEN 10 THEN calculated_verifier := 'K';
        ELSE calculated_verifier := (11 - (sum % 11))::TEXT;
    END CASE;
    
    RETURN verifier = calculated_verifier;
END;
$$ LANGUAGE plpgsql;

-- 10. FUNCIÓN PARA CALCULAR IMPUESTO ÚNICO
CREATE OR REPLACE FUNCTION calculate_unique_tax(
    p_taxable_income DECIMAL,
    p_utm_value DECIMAL,
    p_period VARCHAR(7) DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM')
) RETURNS TABLE(
    tax_amount DECIMAL,
    tax_factor DECIMAL,
    deduction DECIMAL
) AS $$
DECLARE
    v_income_utm DECIMAL;
    v_tax_bracket RECORD;
BEGIN
    -- Convertir ingreso a UTM
    v_income_utm := p_taxable_income / p_utm_value;
    
    -- Buscar tramo correspondiente
    SELECT * INTO v_tax_bracket
    FROM tax_brackets
    WHERE valid_from <= TO_DATE(p_period || '-01', 'YYYY-MM-DD')
      AND (valid_until IS NULL OR valid_until >= TO_DATE(p_period || '-01', 'YYYY-MM-DD'))
      AND from_utm <= v_income_utm
      AND (to_utm IS NULL OR to_utm > v_income_utm)
    ORDER BY from_utm DESC
    LIMIT 1;
    
    IF v_tax_bracket IS NULL THEN
        RETURN QUERY SELECT 0::DECIMAL, 0::DECIMAL, 0::DECIMAL;
    ELSE
        RETURN QUERY SELECT 
            ROUND((p_taxable_income * v_tax_bracket.tax_factor) - (v_tax_bracket.deduction_utm * p_utm_value), 0),
            v_tax_bracket.tax_factor,
            v_tax_bracket.deduction_utm * p_utm_value;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 11. VISTA PARA INTEGRACIÓN CON F29
CREATE OR REPLACE VIEW v_payroll_f29_summary AS
SELECT 
    period,
    company_id,
    -- Código 10: Impuesto único retenido (2da categoría)
    SUM(unique_tax) as codigo_10_impuesto_unico,
    -- Código 161: Préstamo solidario retenido
    SUM(solidarity_loan) as codigo_161_prestamo_solidario,
    -- Otros códigos relevantes
    COUNT(DISTINCT employee_id) as total_trabajadores,
    SUM(gross_income) as total_remuneraciones
FROM payroll_documents
WHERE status IN ('approved', 'paid')
  AND document_type = 'liquidacion'
GROUP BY period, company_id;

-- 12. TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employment_contracts_updated_at BEFORE UPDATE ON employment_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_config_updated_at BEFORE UPDATE ON payroll_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_documents_updated_at BEFORE UPDATE ON payroll_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. INSERTAR DATOS INICIALES

-- Parámetros previsionales 2025
INSERT INTO payroll_parameters (valid_from, uf_value, minimum_wage) 
VALUES ('2025-01-01', 38000, 500000)
ON CONFLICT (valid_from) DO NOTHING;

-- Tabla impuesto único 2025
INSERT INTO tax_brackets (valid_from, from_utm, to_utm, tax_factor, deduction_utm) VALUES
('2025-01-01', 0, 13.5, 0, 0),
('2025-01-01', 13.5, 30, 0.04, 0.54),
('2025-01-01', 30, 50, 0.08, 1.74),
('2025-01-01', 50, 70, 0.135, 4.49),
('2025-01-01', 70, 90, 0.23, 11.14),
('2025-01-01', 90, 120, 0.304, 17.80),
('2025-01-01', 120, 310, 0.35, 23.32),
('2025-01-01', 310, NULL, 0.4, 38.82)
ON CONFLICT (valid_from, from_utm) DO NOTHING;

-- =====================================================
-- SETUP COMPLETO - EJECUTAR TODO EL SCRIPT
-- =====================================================