-- ==========================================
-- MIGRACIÓN RCV SEGURA - VERSIÓN CORREGIDA
-- Esta versión elimina tablas existentes y las recrea
-- ==========================================

-- ✅ ELIMINAR TABLAS EXISTENTES (si existen)
DROP TABLE IF EXISTS purchase_document CASCADE;
DROP TABLE IF EXISTS sale_document CASCADE;
DROP TABLE IF EXISTS purchase_ledger CASCADE;
DROP TABLE IF EXISTS sales_ledger CASCADE;

-- ✅ ELIMINAR FUNCIONES EXISTENTES (si existen)
DROP FUNCTION IF EXISTS get_purchase_summary(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_sales_summary(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ==========================================
-- RECREAR TABLAS DESDE CERO
-- ==========================================

-- ✅ TABLA PURCHASE_LEDGER - Libro de compras maestro por período
CREATE TABLE purchase_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_identifier VARCHAR(7) NOT NULL, -- YYYY-MM
    
    -- Totales calculados
    total_transactions INTEGER NOT NULL DEFAULT 0,
    sum_transactions INTEGER NOT NULL DEFAULT 0, -- Tipo 33, 34
    subtract_transactions INTEGER NOT NULL DEFAULT 0, -- Tipo 61
    total_exempt_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_net_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_calculated_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- Estadísticas del período
    unique_suppliers INTEGER NOT NULL DEFAULT 0,
    confidence_score INTEGER NOT NULL DEFAULT 0,
    processing_method VARCHAR(50) DEFAULT 'csv-direct-parsing',
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_by UUID, -- Usuario que procesó
    file_name VARCHAR(255),
    file_size INTEGER,
    
    -- Constraints
    UNIQUE(company_id, period_identifier)
);

-- ✅ TABLA SALES_LEDGER - Libro de ventas maestro por período  
CREATE TABLE sales_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_identifier VARCHAR(7) NOT NULL, -- YYYY-MM
    
    -- Totales calculados
    total_transactions INTEGER NOT NULL DEFAULT 0,
    sum_transactions INTEGER NOT NULL DEFAULT 0, -- Ventas
    subtract_transactions INTEGER NOT NULL DEFAULT 0, -- Devoluciones
    total_exempt_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_net_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_calculated_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- Estadísticas del período
    unique_customers INTEGER NOT NULL DEFAULT 0,
    confidence_score INTEGER NOT NULL DEFAULT 0,
    processing_method VARCHAR(50) DEFAULT 'csv-direct-parsing',
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_by UUID,
    file_name VARCHAR(255),
    file_size INTEGER,
    
    -- Constraints
    UNIQUE(company_id, period_identifier)
);

-- ✅ TABLA PURCHASE_DOCUMENT - Documentos individuales de compra
CREATE TABLE purchase_document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_ledger_id UUID NOT NULL REFERENCES purchase_ledger(id) ON DELETE CASCADE,
    company_id UUID NOT NULL,
    
    -- Información del documento
    document_number VARCHAR(50) NOT NULL,
    document_type VARCHAR(10) NOT NULL, -- 33, 34, 61, etc.
    purchase_type VARCHAR(10),
    folio VARCHAR(50),
    
    -- Fechas
    document_date DATE NOT NULL,
    reception_date DATE,
    acknowledgment_date DATE,
    
    -- Información del proveedor
    supplier_rut VARCHAR(20) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    
    -- Montos (columnas J, K, etc del RCV)
    exempt_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    iva_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    iva_non_recoverable DECIMAL(15,2) NOT NULL DEFAULT 0,
    iva_non_recoverable_code VARCHAR(10),
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- Activos fijos
    net_amount_fixed_assets DECIMAL(15,2) DEFAULT 0,
    iva_fixed_assets DECIMAL(15,2) DEFAULT 0,
    iva_common_use DECIMAL(15,2) DEFAULT 0,
    tax_no_credit_right DECIMAL(15,2) DEFAULT 0,
    iva_not_withheld DECIMAL(15,2) DEFAULT 0,
    
    -- Impuestos especiales
    tobacco_cigars DECIMAL(15,2) DEFAULT 0,
    tobacco_cigarettes DECIMAL(15,2) DEFAULT 0,
    tobacco_processed DECIMAL(15,2) DEFAULT 0,
    nce_nde_invoice DECIMAL(15,2) DEFAULT 0,
    
    -- Otros impuestos
    other_tax_code VARCHAR(10),
    other_tax_value DECIMAL(15,2) DEFAULT 0,
    other_tax_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ✅ TABLA SALE_DOCUMENT - Documentos individuales de venta
CREATE TABLE sale_document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_ledger_id UUID NOT NULL REFERENCES sales_ledger(id) ON DELETE CASCADE,
    company_id UUID NOT NULL,
    
    -- Información del documento
    document_number VARCHAR(50) NOT NULL,
    document_type VARCHAR(10) NOT NULL,
    sale_type VARCHAR(10),
    folio VARCHAR(50),
    
    -- Fechas
    document_date DATE NOT NULL,
    reception_date DATE,
    acknowledgment_date DATE,
    
    -- Información del cliente
    customer_rut VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    
    -- Montos
    exempt_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    iva_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    iva_non_recoverable DECIMAL(15,2) NOT NULL DEFAULT 0,
    iva_non_recoverable_code VARCHAR(10),
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- Activos fijos
    net_amount_fixed_assets DECIMAL(15,2) DEFAULT 0,
    iva_fixed_assets DECIMAL(15,2) DEFAULT 0,
    iva_common_use DECIMAL(15,2) DEFAULT 0,
    tax_no_credit_right DECIMAL(15,2) DEFAULT 0,
    iva_not_withheld DECIMAL(15,2) DEFAULT 0,
    
    -- Impuestos especiales
    tobacco_cigars DECIMAL(15,2) DEFAULT 0,
    tobacco_cigarettes DECIMAL(15,2) DEFAULT 0,
    tobacco_processed DECIMAL(15,2) DEFAULT 0,
    nce_nde_invoice DECIMAL(15,2) DEFAULT 0,
    
    -- Otros impuestos
    other_tax_code VARCHAR(10),
    other_tax_value DECIMAL(15,2) DEFAULT 0,
    other_tax_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ÍNDICES PARA PERFORMANCE OPTIMIZADA
-- ==========================================

-- Índices para purchase_ledger
CREATE INDEX idx_purchase_ledger_company_period 
    ON purchase_ledger(company_id, period_identifier);
CREATE INDEX idx_purchase_ledger_dates 
    ON purchase_ledger(period_start, period_end);

-- Índices para sales_ledger  
CREATE INDEX idx_sales_ledger_company_period 
    ON sales_ledger(company_id, period_identifier);
CREATE INDEX idx_sales_ledger_dates 
    ON sales_ledger(period_start, period_end);

-- Índices para purchase_document
CREATE INDEX idx_purchase_document_ledger 
    ON purchase_document(purchase_ledger_id);
CREATE INDEX idx_purchase_document_company 
    ON purchase_document(company_id);
CREATE INDEX idx_purchase_document_supplier 
    ON purchase_document(supplier_rut);
CREATE INDEX idx_purchase_document_date 
    ON purchase_document(document_date);
CREATE INDEX idx_purchase_document_type 
    ON purchase_document(document_type);

-- Índices para sale_document
CREATE INDEX idx_sale_document_ledger 
    ON sale_document(sales_ledger_id);
CREATE INDEX idx_sale_document_company 
    ON sale_document(company_id);
CREATE INDEX idx_sale_document_customer 
    ON sale_document(customer_rut);
CREATE INDEX idx_sale_document_date 
    ON sale_document(document_date);
CREATE INDEX idx_sale_document_type 
    ON sale_document(document_type);

-- ==========================================
-- FUNCIONES AUXILIARES POSTGRESQL
-- ==========================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_purchase_ledger_updated_at 
    BEFORE UPDATE ON purchase_ledger 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_ledger_updated_at 
    BEFORE UPDATE ON sales_ledger 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_document_updated_at 
    BEFORE UPDATE ON purchase_document 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sale_document_updated_at 
    BEFORE UPDATE ON sale_document 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Habilitar RLS en las tablas
ALTER TABLE purchase_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_document ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_document ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acceso (temporalmente permisivas)
CREATE POLICY "purchase_ledger_policy" ON purchase_ledger FOR ALL USING (true);
CREATE POLICY "sales_ledger_policy" ON sales_ledger FOR ALL USING (true);
CREATE POLICY "purchase_document_policy" ON purchase_document FOR ALL USING (true);
CREATE POLICY "sale_document_policy" ON sale_document FOR ALL USING (true);

-- ==========================================
-- VERIFICACIÓN FINAL
-- ==========================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('purchase_ledger', 'sales_ledger', 'purchase_document', 'sale_document')
ORDER BY table_name;

-- Mostrar mensaje de éxito
SELECT 'RCV Tables created successfully! ✅' as status;