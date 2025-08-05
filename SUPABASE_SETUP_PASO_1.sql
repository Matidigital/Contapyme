-- =====================================================
-- SETUP PASO 1: TABLAS PRINCIPALES
-- =====================================================

-- 1. CREAR TABLA EMPLOYEES DESDE CERO
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL,
    
    -- Información Personal
    rut VARCHAR(12) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    birth_date DATE NOT NULL,
    gender VARCHAR(20),
    marital_status VARCHAR(30),
    nationality VARCHAR(50) DEFAULT 'Chilena',
    
    -- Información de Contacto
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(50),
    postal_code VARCHAR(10),
    
    -- Contacto de emergencia
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    
    -- Estado del empleado
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    termination_date DATE,
    termination_reason VARCHAR(50),
    termination_article VARCHAR(10),
    termination_detail TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    -- Constraints
    UNIQUE(company_id, rut)
);

-- 2. CREAR TABLA EMPLOYMENT_CONTRACTS
CREATE TABLE IF NOT EXISTS employment_contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    company_id UUID NOT NULL,
    
    -- Información del contrato
    position VARCHAR(200) NOT NULL,
    department VARCHAR(100),
    contract_type VARCHAR(20) NOT NULL DEFAULT 'indefinido' CHECK (contract_type IN ('indefinido', 'plazo_fijo', 'por_obra', 'part_time')),
    start_date DATE NOT NULL,
    end_date DATE,
    termination_date DATE,
    
    -- Salario y jornada
    base_salary DECIMAL(12,2) NOT NULL,
    salary_type VARCHAR(20) DEFAULT 'monthly' CHECK (salary_type IN ('monthly', 'hourly', 'daily')),
    weekly_hours DECIMAL(5,2) DEFAULT 45,
    
    -- Estado del contrato
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'terminated', 'suspended')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- 3. CONFIGURACIÓN PREVISIONAL
CREATE TABLE IF NOT EXISTS payroll_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- AFP
    afp_name VARCHAR(50) NOT NULL,
    afp_commission DECIMAL(5,2) NOT NULL,
    
    -- Salud
    health_system VARCHAR(10) NOT NULL CHECK (health_system IN ('fonasa', 'isapre')),
    health_provider VARCHAR(50),
    health_plan VARCHAR(100),
    health_plan_uf DECIMAL(10,4),
    health_additional_uf DECIMAL(10,4) DEFAULT 0,
    
    -- Seguro cesantía
    afc_contract_type VARCHAR(20) NOT NULL DEFAULT 'indefinido' CHECK (afc_contract_type IN ('indefinido', 'plazo_fijo')),
    
    -- Otros
    has_agreed_deposit BOOLEAN DEFAULT false,
    agreed_deposit_amount DECIMAL(12,2) DEFAULT 0,
    family_charges INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id)
);