/**
 * Mock Employee Store - Persistencia en memoria para desarrollo
 * 
 * Este servicio mantiene los empleados en memoria durante la sesión del servidor.
 * Permite crear, listar y persistir empleados sin base de datos.
 * 
 * IMPORTANTE: Los datos se pierden al reiniciar el servidor.
 * Esta es una solución temporal mientras se resuelve Supabase.
 */

interface Employee {
  id: string;
  company_id: string;
  rut: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  birth_date: string;
  gender?: string;
  marital_status?: string;
  nationality?: string;
  email: string;
  phone?: string;
  mobile_phone?: string;
  address?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  status: string;
  created_at: string;
  updated_at: string;
  employment_contracts?: any[];
  payroll_config?: any[];
}

class MockEmployeeStore {
  private employees: Map<string, Employee[]> = new Map();
  
  constructor() {
    // Inicializar con datos de ejemplo
    this.initializeWithMockData();
  }
  
  /**
   * Inicializar con empleados de ejemplo
   */
  private initializeWithMockData() {
    const companyId = '8033ee69-b420-4d91-ba0e-482f46cd6fce';
    
    const mockEmployees: Employee[] = [
      {
        id: 'mock-employee-1',
        company_id: companyId,
        rut: '12.345.678-9',
        first_name: 'Juan',
        last_name: 'Pérez',
        middle_name: 'Carlos',
        birth_date: '1985-05-15',
        gender: 'masculino',
        marital_status: 'casado',
        nationality: 'chilena',
        email: 'juan.perez@empresa.cl',
        phone: '+56912345678',
        address: 'Av. Principal 123',
        city: 'Santiago',
        region: 'Metropolitana',
        status: 'active',
        created_at: new Date('2024-01-01').toISOString(),
        updated_at: new Date().toISOString(),
        employment_contracts: [
          {
            id: 'mock-contract-1',
            position: 'Desarrollador Senior',
            department: 'Tecnología',
            contract_type: 'indefinido',
            start_date: '2024-01-01',
            base_salary: 1500000,
            salary_type: 'monthly',
            status: 'active'
          }
        ],
        payroll_config: [
          {
            afp_code: 'HABITAT',
            health_institution_code: 'FONASA',
            family_allowances: 2,
            legal_gratification_type: 'code_47',
            has_unemployment_insurance: true
          }
        ]
      },
      {
        id: 'mock-employee-2',
        company_id: companyId,
        rut: '98.765.432-1',
        first_name: 'María',
        last_name: 'González',
        middle_name: 'Isabel',
        birth_date: '1990-08-22',
        gender: 'femenino',
        marital_status: 'soltera',
        nationality: 'chilena',
        email: 'maria.gonzalez@empresa.cl',
        phone: '+56987654321',
        address: 'Calle Sur 456',
        city: 'Santiago',
        region: 'Metropolitana',
        status: 'active',
        created_at: new Date('2023-06-15').toISOString(),
        updated_at: new Date().toISOString(),
        employment_contracts: [
          {
            id: 'mock-contract-2',
            position: 'Contadora',
            department: 'Finanzas',
            contract_type: 'indefinido',
            start_date: '2023-06-15',
            base_salary: 1200000,
            salary_type: 'monthly',
            status: 'active'
          }
        ],
        payroll_config: [
          {
            afp_code: 'PROVIDA',
            health_institution_code: 'ISAPRE_CONSALUD',
            family_allowances: 1,
            legal_gratification_type: 'code_50',
            has_unemployment_insurance: true
          }
        ]
      }
    ];
    
    this.employees.set(companyId, mockEmployees);
    console.log('✅ MockEmployeeStore inicializado con', mockEmployees.length, 'empleados de ejemplo');
  }
  
  /**
   * Obtener todos los empleados de una empresa
   */
  getEmployeesByCompany(companyId: string): Employee[] {
    const employees = this.employees.get(companyId) || [];
    console.log(`📋 Retornando ${employees.length} empleados para empresa ${companyId}`);
    return employees;
  }
  
  /**
   * Agregar un nuevo empleado
   */
  addEmployee(employee: Employee): Employee {
    const companyEmployees = this.employees.get(employee.company_id) || [];
    
    // Generar ID único si no tiene
    if (!employee.id || employee.id.includes('mock-employee-')) {
      employee.id = `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Agregar timestamps
    employee.created_at = employee.created_at || new Date().toISOString();
    employee.updated_at = new Date().toISOString();
    
    // Agregar el nuevo empleado
    companyEmployees.push(employee);
    this.employees.set(employee.company_id, companyEmployees);
    
    console.log(`✅ Empleado agregado: ${employee.first_name} ${employee.last_name} (${employee.id})`);
    console.log(`📊 Total empleados en empresa ${employee.company_id}: ${companyEmployees.length}`);
    
    return employee;
  }
  
  /**
   * Obtener un empleado por ID
   */
  getEmployeeById(companyId: string, employeeId: string): Employee | null {
    const employees = this.getEmployeesByCompany(companyId);
    return employees.find(emp => emp.id === employeeId) || null;
  }
  
  /**
   * Actualizar un empleado
   */
  updateEmployee(companyId: string, employeeId: string, updates: Partial<Employee>): Employee | null {
    const employees = this.getEmployeesByCompany(companyId);
    const index = employees.findIndex(emp => emp.id === employeeId);
    
    if (index === -1) {
      return null;
    }
    
    // Actualizar empleado
    employees[index] = {
      ...employees[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.employees.set(companyId, employees);
    console.log(`✅ Empleado actualizado: ${employeeId}`);
    
    return employees[index];
  }
  
  /**
   * Eliminar un empleado (soft delete)
   */
  deleteEmployee(companyId: string, employeeId: string): boolean {
    const employee = this.getEmployeeById(companyId, employeeId);
    
    if (!employee) {
      return false;
    }
    
    // Soft delete - cambiar estado
    this.updateEmployee(companyId, employeeId, { status: 'terminated' });
    console.log(`✅ Empleado desactivado: ${employeeId}`);
    
    return true;
  }
  
  /**
   * Obtener estadísticas del store
   */
  getStats(): { companies: number; totalEmployees: number } {
    let totalEmployees = 0;
    
    this.employees.forEach(companyEmployees => {
      totalEmployees += companyEmployees.length;
    });
    
    return {
      companies: this.employees.size,
      totalEmployees
    };
  }
}

// Singleton instance
const mockEmployeeStore = new MockEmployeeStore();

// Exportar instance para uso global
export default mockEmployeeStore;

// Exportar tipos
export type { Employee };