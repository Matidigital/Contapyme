-- Sistema Completo de Finiquitos Laborales Chile
-- Aplicar este SQL directamente en Supabase Dashboard -> SQL Editor

-- ============================================
-- TABLA PRINCIPAL DE TÉRMINOS DE CONTRATO
-- ============================================

CREATE TABLE IF NOT EXISTS employee_terminations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    
    -- Información del término
    termination_date DATE NOT NULL,
    termination_cause_code VARCHAR(10) NOT NULL,
    termination_cause_description TEXT NOT NULL,
    notice_given BOOLEAN NOT NULL DEFAULT false,
    notice_date DATE,
    notice_days INTEGER DEFAULT 0,
    
    -- Cálculos de finiquito
    worked_days_last_month INTEGER DEFAULT 0,
    pending_salary_days INTEGER DEFAULT 0,
    pending_salary_amount INTEGER DEFAULT 0,
    
    -- Vacaciones
    total_vacation_days_earned DECIMAL(6,2) DEFAULT 0,
    vacation_days_taken DECIMAL(6,2) DEFAULT 0,
    pending_vacation_days DECIMAL(6,2) DEFAULT 0,
    vacation_daily_rate INTEGER DEFAULT 0,
    pending_vacation_amount INTEGER DEFAULT 0,
    
    -- Feriado proporcional  
    proportional_vacation_days DECIMAL(6,2) DEFAULT 0,
    proportional_vacation_amount INTEGER DEFAULT 0,
    
    -- Indemnizaciones
    severance_years_service DECIMAL(4,2) DEFAULT 0,
    severance_monthly_salary INTEGER DEFAULT 0,
    severance_amount INTEGER DEFAULT 0,
    notice_indemnification_amount INTEGER DEFAULT 0,
    
    -- Otras compensaciones
    christmas_bonus_amount INTEGER DEFAULT 0,
    other_bonuses_amount INTEGER DEFAULT 0,
    pending_overtime_amount INTEGER DEFAULT 0,
    
    -- Totales
    total_to_pay INTEGER NOT NULL DEFAULT 0,
    total_deductions INTEGER DEFAULT 0,
    final_net_amount INTEGER NOT NULL DEFAULT 0,
    
    -- Estados del proceso
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    settlement_generated BOOLEAN DEFAULT false,
    notice_letter_generated BOOLEAN DEFAULT false,
    
    -- Información adicional
    termination_reason_details TEXT,
    employee_signature_date DATE,
    company_signature_date DATE,
    witness_name VARCHAR(100),
    witness_rut VARCHAR(20),
    
    -- Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA DE CAUSALES DE TÉRMINO
-- ============================================

CREATE TABLE IF NOT EXISTS termination_causes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_code VARCHAR(10) NOT NULL UNIQUE,
    article_name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    requires_notice BOOLEAN NOT NULL DEFAULT false,
    notice_days INTEGER DEFAULT 0,
    requires_severance BOOLEAN NOT NULL DEFAULT false,
    severance_calculation_type VARCHAR(50),
    is_with_just_cause BOOLEAN NOT NULL DEFAULT false,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INSERTAR CAUSALES ESTÁNDAR
-- ============================================

INSERT INTO termination_causes (article_code, article_name, description, requires_notice, notice_days, requires_severance, severance_calculation_type, is_with_just_cause, category) VALUES 
('161-1', 'Art. 161 N°1 - Necesidades de la empresa', 'Terminación del contrato por necesidades de la empresa, establecimiento o servicio', true, 30, true, 'years_service', false, 'employer_initiative'),
('159-1', 'Art. 159 N°1 - Mutuo acuerdo de las partes', 'Terminación del contrato de común acuerdo entre las partes', false, 0, false, null, false, 'mutual_agreement'),
('159-3', 'Art. 159 N°3 - Renuncia del trabajador', 'Renuncia voluntaria del trabajador con aviso previo', false, 0, false, null, false, 'employee_initiative'),
('160-1-a', 'Art. 160 N°1 letra a - Falta de probidad', 'Falta de probidad del trabajador en el desempeño de sus funciones', false, 0, false, null, true, 'employer_initiative'),
('160-1-b', 'Art. 160 N°1 letra b - Conductas de acoso', 'Conductas de acoso sexual o acoso laboral', false, 0, false, null, true, 'employer_initiative'),
('160-3', 'Art. 160 N°3 - Abandono del trabajo', 'Abandono del trabajo por parte del trabajador', false, 0, false, null, true, 'employer_initiative'),
('160-7', 'Art. 160 N°7 - Incumplimiento grave', 'Incumplimiento grave de las obligaciones que impone el contrato', false, 0, false, null, true, 'employer_initiative'),
('163bis', 'Art. 163 bis - Despido colectivo', 'Terminación por reducción de personal (más de 10 trabajadores)', true, 30, true, 'years_service', false, 'employer_initiative'),
('plazo-fijo', 'Vencimiento contrato plazo fijo', 'Término natural del contrato por cumplimiento del plazo convenido', false, 0, false, null, false, 'natural_expiration')
ON CONFLICT (article_code) DO NOTHING;

-- ============================================
-- FUNCIONES POSTGRESQL
-- ============================================

-- Función para calcular días hábiles
CREATE OR REPLACE FUNCTION calculate_business_days(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
DECLARE
    total_days INTEGER;
    check_date DATE := start_date;
    business_days INTEGER := 0;
BEGIN
    IF start_date >= end_date THEN
        RETURN 0;
    END IF;
    
    WHILE check_date < end_date LOOP
        -- Contar solo días de lunes a viernes (1-5 en EXTRACT(DOW))
        IF EXTRACT(DOW FROM check_date) BETWEEN 1 AND 5 THEN
            business_days := business_days + 1;
        END IF;
        check_date := check_date + 1;
    END LOOP;
    
    RETURN business_days;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employee_terminations_company ON employee_terminations(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_terminations_employee ON employee_terminations(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_terminations_date ON employee_terminations(termination_date);
CREATE INDEX IF NOT EXISTS idx_employee_terminations_status ON employee_terminations(status);

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE employee_terminations ENABLE ROW LEVEL SECURITY;
ALTER TABLE termination_causes ENABLE ROW LEVEL SECURITY;

-- Política básica para employee_terminations
CREATE POLICY "Enable all operations for authenticated users" ON employee_terminations
    FOR ALL USING (true);

-- Política para termination_causes (solo lectura para todos)
CREATE POLICY "Enable read access for all users" ON termination_causes
    FOR SELECT USING (true);

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE employee_terminations IS 'Registro completo de términos de contrato con cálculos automáticos de finiquito según normativa chilena';
COMMENT ON TABLE termination_causes IS 'Causales de término según Código del Trabajo chileno';