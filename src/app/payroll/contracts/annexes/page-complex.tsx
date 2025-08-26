'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AnnexData } from '@/lib/templates/contractAnnexTemplates';

interface Employee {
  id: string;
  rut: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  employment_contracts?: Array<{
    id: string;
    position: string;
    department?: string;
    base_salary: number;
    contract_type: string;
  }>;
}

export default function ContractAnnexesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedType, setSelectedType] = useState<AnnexData['annexType']>('renovation');
  const [isLoading, setIsLoading] = useState(false);
  const [annexData, setAnnexData] = useState<Partial<AnnexData>>({
    annexDate: new Date().toISOString().split('T')[0],
    annexType: 'renovation'
  });

  // Estados específicos para renovación
  const [renovationType, setRenovationType] = useState<'fixed_term' | 'indefinite'>('fixed_term');
  const [newEndDate, setNewEndDate] = useState('');
  
  // Estados para trabajo nocturno
  const [nightShiftPercentage, setNightShiftPercentage] = useState(20);
  const [nightShiftStartTime, setNightShiftStartTime] = useState('21:00');
  const [nightShiftEndTime, setNightShiftEndTime] = useState('07:00');
  
  // Estados para vacaciones
  const [vacationStartDate, setVacationStartDate] = useState('');
  const [vacationEndDate, setVacationEndDate] = useState('');
  const [vacationDays, setVacationDays] = useState(15);
  
  // Estados para cambios
  const [newSalary, setNewSalary] = useState<number | undefined>();
  const [newPosition, setNewPosition] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newSchedule, setNewSchedule] = useState('');
  
  // Estados generales
  const [effectiveDate, setEffectiveDate] = useState('');
  const [observations, setObservations] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const companyId = localStorage.getItem('selectedCompanyId');
      if (!companyId) {
        alert('Por favor selecciona una empresa primero');
        router.push('/dashboard');
        return;
      }

      const response = await fetch(`/api/payroll/employees?company_id=${companyId}`);
      const data = await response.json();
      
      if (data.success) {
        setEmployees(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const loadEmployeeData = async (employeeId: string) => {
    if (!employeeId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/payroll/contracts/generate-annex?employee_id=${employeeId}&type=${selectedType}`);
      const data = await response.json();
      
      if (data.success) {
        setAnnexData(prev => ({
          ...prev,
          ...data.baseData
        }));
        
        // Si hay salario actual, sugerirlo como nuevo salario para cambios
        if (data.baseData.currentSalary) {
          setNewSalary(data.baseData.currentSalary);
        }
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAnnex = async () => {
    if (!selectedEmployee) {
      alert('Por favor selecciona un empleado');
      return;
    }

    setIsLoading(true);
    try {
      // Preparar datos completos del anexo
      const fullAnnexData: AnnexData = {
        ...annexData as AnnexData,
        annexType: selectedType,
        
        // Datos específicos según el tipo
        ...(selectedType === 'renovation' && {
          renovationType,
          newEndDate: renovationType === 'fixed_term' ? newEndDate : undefined,
          effectiveDate: effectiveDate || annexData.annexDate
        }),
        
        ...(selectedType === 'night_shift' && {
          nightShiftPercentage,
          nightShiftStartTime,
          nightShiftEndTime
        }),
        
        ...(selectedType === 'vacation' && {
          vacationStartDate,
          vacationEndDate,
          vacationDays
        }),
        
        ...(selectedType === 'salary_change' && {
          newSalary,
          effectiveDate: effectiveDate || annexData.annexDate
        }),
        
        ...(selectedType === 'position_change' && {
          newPosition,
          newDepartment,
          effectiveDate: effectiveDate || annexData.annexDate
        }),
        
        ...(selectedType === 'schedule_change' && {
          newSchedule,
          effectiveDate: effectiveDate || annexData.annexDate
        }),
        
        observations
      };

      const response = await fetch('/api/payroll/contracts/generate-annex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fullAnnexData)
      });

      if (response.ok) {
        // Abrir el HTML en una nueva pestaña
        const html = await response.text();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating annex:', error);
      alert('Error al generar el anexo');
    } finally {
      setIsLoading(false);
    }
  };

  const annexTypes = [
    { value: 'renovation', label: 'Renovación de Contrato' },
    { value: 'night_shift', label: 'Pacto Trabajo Nocturno' },
    { value: 'vacation', label: 'Comprobante de Feriado' },
    { value: 'salary_change', label: 'Cambio de Remuneración' },
    { value: 'position_change', label: 'Cambio de Cargo' },
    { value: 'schedule_change', label: 'Cambio de Horario' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl shadow-lg">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generador de Anexos Contractuales
          </h1>
          <p className="mt-2 text-blue-100">Crea anexos personalizados para cualquier empleado</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-b-xl shadow-lg p-6">
          {/* Selección de empleado y tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Empleado
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => {
                  setSelectedEmployee(e.target.value);
                  loadEmployeeData(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar empleado...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} - {emp.rut}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Anexo
              </label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value as AnnexData['annexType']);
                  if (selectedEmployee) {
                    loadEmployeeData(selectedEmployee);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {annexTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campos específicos según el tipo de anexo */}
          {selectedType === 'renovation' && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-900 mb-3">Datos de Renovación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Renovación
                  </label>
                  <select
                    value={renovationType}
                    onChange={(e) => setRenovationType(e.target.value as 'fixed_term' | 'indefinite')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="fixed_term">Plazo Fijo</option>
                    <option value="indefinite">Indefinido</option>
                  </select>
                </div>

                {renovationType === 'fixed_term' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva Fecha de Término
                    </label>
                    <input
                      type="date"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Vigencia
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Remuneración (opcional)
                  </label>
                  <input
                    type="number"
                    value={newSalary || ''}
                    onChange={(e) => setNewSalary(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Dejar vacío para mantener actual"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedType === 'night_shift' && (
            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-purple-900 mb-3">Datos del Trabajo Nocturno</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recargo Nocturno (%)
                  </label>
                  <input
                    type="number"
                    value={nightShiftPercentage}
                    onChange={(e) => setNightShiftPercentage(Number(e.target.value))}
                    min="20"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    value={nightShiftStartTime}
                    onChange={(e) => setNightShiftStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora de Término
                  </label>
                  <input
                    type="time"
                    value={nightShiftEndTime}
                    onChange={(e) => setNightShiftEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedType === 'vacation' && (
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-green-900 mb-3">Datos del Feriado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={vacationStartDate}
                    onChange={(e) => setVacationStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Término
                  </label>
                  <input
                    type="date"
                    value={vacationEndDate}
                    onChange={(e) => setVacationEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Días Hábiles
                  </label>
                  <input
                    type="number"
                    value={vacationDays}
                    onChange={(e) => setVacationDays(Number(e.target.value))}
                    min="1"
                    max="30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {(selectedType === 'salary_change' || selectedType === 'position_change' || selectedType === 'schedule_change') && (
            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-yellow-900 mb-3">Datos del Cambio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(selectedType === 'salary_change' || selectedType === 'position_change') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva Remuneración
                    </label>
                    <input
                      type="number"
                      value={newSalary || ''}
                      onChange={(e) => setNewSalary(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}

                {selectedType === 'position_change' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nuevo Cargo
                      </label>
                      <input
                        type="text"
                        value={newPosition}
                        onChange={(e) => setNewPosition(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nuevo Departamento
                      </label>
                      <input
                        type="text"
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </>
                )}

                {selectedType === 'schedule_change' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nuevo Horario
                    </label>
                    <input
                      type="text"
                      value={newSchedule}
                      onChange={(e) => setNewSchedule(e.target.value)}
                      placeholder="Ej: Lunes a Viernes de 08:00 a 17:00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Vigencia
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones (opcional)
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Agregar observaciones adicionales al anexo..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => router.push('/payroll/contracts')}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              onClick={generateAnnex}
              disabled={!selectedEmployee || isLoading}
              className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2
                ${!selectedEmployee || isLoading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'}`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generar Anexo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}