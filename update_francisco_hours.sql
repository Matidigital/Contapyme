-- Actualizar horas semanales de Francisco Mancilla a 30 horas (part-time)
-- Basado en su contrato: 4 días x 8 horas = 30 horas semanales

UPDATE employment_contracts 
SET weekly_hours = 30 
WHERE employee_id IN (
  SELECT id 
  FROM employees 
  WHERE first_name ILIKE '%francisco%' 
  AND last_name ILIKE '%mancilla%'
);

-- Verificar el cambio
SELECT 
  e.rut,
  e.first_name,
  e.last_name,
  ec.weekly_hours,
  ec.position
FROM employees e 
JOIN employment_contracts ec ON e.id = ec.employee_id 
WHERE e.first_name ILIKE '%francisco%' 
AND e.last_name ILIKE '%mancilla%';