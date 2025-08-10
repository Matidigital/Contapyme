-- 🔍 DIAGNÓSTICO DE TABLA COMPANIES EXISTENTE
-- Ejecuta esto primero en Supabase SQL Editor para ver la estructura actual

-- 1. Ver estructura de la tabla companies
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;

-- 2. Ver datos existentes
SELECT * FROM companies LIMIT 5;

-- 3. Ver si existe el ID que necesitamos
SELECT * FROM companies WHERE id = '8033ee69-b420-4d91-ba0e-482f46cd6fce';