-- =====================================================
-- SETUP PASO 2: TABLAS DE REMUNERACIONES
-- =====================================================

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