-- Crear modificación de prueba: Francisco Mancilla - Aumento salarial desde Septiembre 2025
INSERT INTO contract_modifications (
    company_id, 
    employee_id, 
    modification_type, 
    effective_date,
    old_values, 
    new_values, 
    reason,
    document_reference
) VALUES (
    '8033ee69-b420-4d91-ba0e-482f46cd6fce',
    (SELECT id FROM employees WHERE first_name ILIKE '%francisco%' AND last_name ILIKE '%mancilla%' LIMIT 1),
    'salary_change',
    '2025-09-01',
    '{"base_salary": 529000}',
    '{"base_salary": 650000}',
    'Aumento por evaluación de desempeño excepcional',
    'ANEXO-001-2025'
);

-- Verificar la modificación creada
SELECT 
    cm.*,
    e.first_name,
    e.last_name,
    e.rut
FROM contract_modifications cm
JOIN employees e ON cm.employee_id = e.id
WHERE cm.modification_type = 'salary_change'
ORDER BY cm.created_at DESC
LIMIT 1;