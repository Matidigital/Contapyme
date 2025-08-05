-- =====================================================
-- SETUP PASO 3: ÍNDICES Y DATOS INICIALES
-- =====================================================

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

-- 9. TRIGGER PARA UPDATED_AT
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

-- 10. INSERTAR DATOS INICIALES

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