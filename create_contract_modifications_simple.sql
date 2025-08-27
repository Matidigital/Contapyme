-- Crear tabla contract_modifications básica
CREATE TABLE IF NOT EXISTS contract_modifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    modification_type VARCHAR(50) NOT NULL,
    effective_date DATE NOT NULL,
    created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    old_values JSONB NOT NULL,
    new_values JSONB NOT NULL,
    reason TEXT,
    document_reference VARCHAR(100),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices básicos
CREATE INDEX IF NOT EXISTS idx_contract_modifications_employee_date ON contract_modifications (employee_id, effective_date);
CREATE INDEX IF NOT EXISTS idx_contract_modifications_company ON contract_modifications (company_id);
CREATE INDEX IF NOT EXISTS idx_contract_modifications_type ON contract_modifications (modification_type);

-- Verificar creación
SELECT 'Tabla contract_modifications creada exitosamente' AS status;