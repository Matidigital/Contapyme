-- ==========================================
-- VERIFICAR TABLA PAYROLL_LIQUIDATIONS
-- Ejecutar en SQL Editor de Supabase
-- ==========================================

-- 1. VERIFICAR SI LA TABLA EXISTE
SELECT 'VERIFICANDO TABLA PAYROLL_LIQUIDATIONS:' as info;
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'payroll_liquidations'
) as table_exists;

-- 2. SI EXISTE, MOSTRAR ESTRUCTURA
SELECT 'ESTRUCTURA DE LA TABLA (SI EXISTE):' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'payroll_liquidations'
ORDER BY ordinal_position;

-- 3. VERIFICAR EMPLEADOS DISPONIBLES PARA TEST
SELECT 'EMPLEADOS DISPONIBLES PARA TESTING:' as info;
SELECT id, first_name, last_name, rut
FROM employees 
WHERE company_id = '8033ee69-b420-4d91-ba0e-482f46cd6fce'::UUID
LIMIT 5;

-- 4. VERIFICAR POLICIES RLS
SELECT 'POLICIES RLS EN PAYROLL_LIQUIDATIONS:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'payroll_liquidations';

-- 5. VERIFICAR RLS ESTÁ ACTIVADO
SELECT 'RLS STATUS:' as info;
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'payroll_liquidations';

-- 6. SI LA TABLA NO EXISTE, CREARLA (EJECUTAR SOLO SI NECESARIO)
/*
-- DESCOMENTAR SOLO SI LA TABLA NO EXISTE
CREATE TABLE IF NOT EXISTS payroll_liquidations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL,
    days_worked INTEGER NOT NULL DEFAULT 30,
    base_salary INTEGER NOT NULL DEFAULT 0,
    total_gross_income INTEGER NOT NULL DEFAULT 0,
    total_deductions INTEGER NOT NULL DEFAULT 0,
    net_salary INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, employee_id, period_year, period_month)
);
*/

SELECT '✅ VERIFICACIÓN COMPLETA' as resultado;