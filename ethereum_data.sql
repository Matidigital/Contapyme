-- Agregar datos iniciales de Ethereum
INSERT INTO economic_indicators (code, name, unit, value, date, category) VALUES
('ethereum', 'Ethereum', 'USD', 2800.50, '2025-08-03', 'crypto'),
('ethereum', 'Ethereum', 'USD', 2750.25, '2025-08-02', 'crypto'),
('ethereum', 'Ethereum', 'USD', 2825.75, '2025-08-01', 'crypto')
ON CONFLICT (code, date) DO NOTHING;