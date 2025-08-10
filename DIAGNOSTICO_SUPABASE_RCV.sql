-- ==========================================
-- DIAGNÓSTICO TABLAS RCV EN SUPABASE
-- Ejecuta estas consultas para entender el estado actual
-- ==========================================

-- 1. Verificar qué tablas RCV ya existen
SELECT table_name, table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%ledger%' OR table_name LIKE '%document%'
ORDER BY table_name;

-- 2. Si purchase_ledger existe, ver su estructura
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'purchase_ledger'
ORDER BY ordinal_position;

-- 3. Si sales_ledger existe, ver su estructura  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sales_ledger'
ORDER BY ordinal_position;

-- 4. Ver todas las tablas que existen actualmente
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 5. Buscar cualquier tabla que tenga columna company_id
SELECT DISTINCT table_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'company_id';

-- ==========================================
-- INSTRUCCIONES:
-- 1. Ejecuta estas consultas una por una en SQL Editor
-- 2. Copia los resultados 
-- 3. Compartelos para crear migración correcta
-- ==========================================