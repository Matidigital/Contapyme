'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PayrollHeader } from '@/components/layout/PayrollHeader';

interface Employee {
  id: string;
  rut: string;
  first_name: string;
  last_name: string;
  employment_contracts: {
    position: string;
    base_salary: number;
    start_date: string;
    contract_type: string;
    weekly_hours: number;
  }[];
}

interface Termination {
  id: string;
  employee_id: string;
  termination_date: string;
  termination_cause_code: string;
  termination_cause_description: string;
  final_net_amount: number;
  status: 'draft' | 'calculated' | 'approved' | 'notified' | 'paid';
  employees: {
    rut: string;
    first_name: string;
    last_name: string;
    employment_contracts: {
      position: string;
    }[];
  };
}

const TERMINATION_CAUSES = [
  // Art. 159 - Iniciativa del trabajador o circunstancias especiales
  { code: '159-1', name: 'Art. 159 N°1 - Mutuo acuerdo de las partes', requiresNotice: false, requiresSeverance: false },
  { code: '159-2', name: 'Art. 159 N°2 - Renuncia del trabajador', requiresNotice: false, requiresSeverance: false },
  { code: '159-3', name: 'Art. 159 N°3 - Muerte del trabajador', requiresNotice: false, requiresSeverance: false },
  { code: '159-4', name: 'Art. 159 N°4 - Vencimiento del plazo convenido', requiresNotice: false, requiresSeverance: false },
  { code: '159-5', name: 'Art. 159 N°5 - Conclusión del trabajo o servicio', requiresNotice: false, requiresSeverance: false },
  { code: '159-6', name: 'Art. 159 N°6 - Caso fortuito o fuerza mayor', requiresNotice: false, requiresSeverance: false },
  
  // Art. 160 - Conductas indebidas del trabajador (con justa causa)
  { code: '160-1-a', name: 'Art. 160 N°1-a - Falta de probidad', requiresNotice: false, requiresSeverance: false },
  { code: '160-1-b', name: 'Art. 160 N°1-b - Acoso sexual', requiresNotice: false, requiresSeverance: false },
  { code: '160-1-c', name: 'Art. 160 N°1-c - Maltrato físico', requiresNotice: false, requiresSeverance: false },
  { code: '160-1-d', name: 'Art. 160 N°1-d - Injurias contra el empleador', requiresNotice: false, requiresSeverance: false },
  { code: '160-1-e', name: 'Art. 160 N°1-e - Conducta inmoral', requiresNotice: false, requiresSeverance: false },
  { code: '160-1-f', name: 'Art. 160 N°1-f - Acoso laboral', requiresNotice: false, requiresSeverance: false },
  { code: '160-2', name: 'Art. 160 N°2 - Negociación dentro del giro', requiresNotice: false, requiresSeverance: false },
  { code: '160-3', name: 'Art. 160 N°3 - No concurrencia sin causa justificada', requiresNotice: false, requiresSeverance: false },
  { code: '160-4-a', name: 'Art. 160 N°4-a - Abandono del trabajo (salida injustificada)', requiresNotice: false, requiresSeverance: false },
  { code: '160-4-b', name: 'Art. 160 N°4-b - Negativa a trabajar sin causa', requiresNotice: false, requiresSeverance: false },
  { code: '160-5', name: 'Art. 160 N°5 - Actos o imprudencias temerarias', requiresNotice: false, requiresSeverance: false },
  { code: '160-6', name: 'Art. 160 N°6 - Perjuicio material intencional', requiresNotice: false, requiresSeverance: false },
  { code: '160-7', name: 'Art. 160 N°7 - Incumplimiento grave del contrato', requiresNotice: false, requiresSeverance: false },
  
  // Art. 161 - Necesidades de la empresa (con indemnización)
  { code: '161-1', name: 'Art. 161 N°1 - Necesidades de la empresa', requiresNotice: true, requiresSeverance: true },
  { code: '161-2', name: 'Art. 161 N°2 - Desahucio escrito del empleador', requiresNotice: true, requiresSeverance: true },
  
  // Art. 163 bis - Procedimiento concursal
  { code: '163-bis', name: 'Art. 163 bis - Procedimiento concursal de liquidación', requiresNotice: false, requiresSeverance: true }
];

export default function TerminationsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [terminations, setTerminations] = useState<Termination[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Termination | null>(null);
  
  // Formulario de finiquito
  const [formData, setFormData] = useState({
    employee_id: '',
    termination_date: '',
    termination_cause_code: '',
    last_work_date: '',
    termination_reason_details: '',
    vacation_days_taken: 0,
    pending_overtime_amount: 0,
    christmas_bonus_pending: false,
    other_bonuses: 0
  });

  const companyId = '8033ee69-b420-4d91-ba0e-482f46cd6fce'; // Demo company

  useEffect(() => {
    fetchEmployees();
    fetchTerminations();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`/api/payroll/employees?company_id=${companyId}`);
      const result = await response.json();
      
      if (result.success) {
        // Solo empleados activos
        const activeEmployees = result.data.filter((emp: Employee) => 
          emp.employment_contracts && emp.employment_contracts.length > 0
        );
        setEmployees(activeEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchTerminations = async () => {
    try {
      const response = await fetch(`/api/payroll/terminations?company_id=${companyId}`);
      const result = await response.json();
      
      if (result.success) {
        setTerminations(result.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching terminations:', error);
      setLoading(false);
    }
  };

  const handleCreateTermination = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch(`/api/payroll/terminations?company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        alert('Finiquito calculado y guardado exitosamente');
        setShowCreateForm(false);
        setFormData({
          employee_id: '',
          termination_date: '',
          termination_cause_code: '',
          last_work_date: '',
          termination_reason_details: '',
          vacation_days_taken: 0,
          pending_overtime_amount: 0,
          christmas_bonus_pending: false,
          other_bonuses: 0
        });
        fetchTerminations();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating termination:', error);
      alert('Error al crear finiquito');
    } finally {
      setCreating(false);
    }
  };

  const generateDocument = async (terminationId: string, documentType: 'notice_letter' | 'settlement') => {
    try {
      const response = await fetch(`/api/payroll/terminations/documents?company_id=${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termination_id: terminationId,
          document_type: documentType
        })
      });

      const result = await response.json();

      if (result.success) {
        // Abrir documento en nueva ventana
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(result.data.html_content);
          newWindow.document.close();
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Error al generar documento');
    }
  };

  const handleDeleteTermination = async (terminationId: string) => {
    try {
      setDeleting(terminationId);
      
      const response = await fetch(`/api/payroll/terminations/${terminationId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        // Actualizar lista de finiquitos
        await fetchTerminations();
        setShowDeleteConfirm(null);
        alert(`Finiquito eliminado exitosamente: ${result.data.employee_name}`);
      } else {
        console.error('Error al eliminar finiquito:', result.error);
        alert(result.error || 'Error al eliminar el finiquito');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar el finiquito');
    } finally {
      setDeleting(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      calculated: 'bg-blue-100 text-blue-800',
      approved: 'bg-yellow-100 text-yellow-800',
      notified: 'bg-purple-100 text-purple-800',
      paid: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getStatusText = (status: string) => {
    const texts = {
      draft: 'Borrador',
      calculated: 'Calculado',
      approved: 'Aprobado',
      notified: 'Notificado',
      paid: 'Pagado'
    };
    return texts[status as keyof typeof texts] || 'Desconocido';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <PayrollHeader 
          title="Finiquitos Laborales" 
          subtitle="Sistema completo de términos de contrato según normativa chilena"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando finiquitos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      <PayrollHeader 
        title="Finiquitos Laborales" 
        subtitle="Sistema completo de términos de contrato según normativa chilena"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Finiquitos</p>
                  <p className="text-2xl font-bold text-gray-900">{terminations.length}</p>
                </div>
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  📄
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Empleados Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  👥
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {terminations.filter(t => ['draft', 'calculated', 'approved'].includes(t.status)).length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  ⏳
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Finalizados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {terminations.filter(t => t.status === 'paid').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  ✅
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones principales */}
        <div className="mb-8">
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            size="lg"
          >
            ➕ Nuevo Finiquito
          </Button>
        </div>

        {/* Formulario de creación */}
        {showCreateForm && (
          <Card className="bg-white/80 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Crear Nuevo Finiquito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTermination} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Selección de empleado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empleado *
                    </label>
                    <select
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Seleccionar empleado</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name} - {employee.rut}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Causal de término */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Causal de Término *
                    </label>
                    <select
                      value={formData.termination_cause_code}
                      onChange={(e) => setFormData({ ...formData, termination_cause_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Seleccionar causal</option>
                      {TERMINATION_CAUSES.map((cause) => (
                        <option key={cause.code} value={cause.code}>
                          {cause.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha de término */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Término *
                    </label>
                    <input
                      type="date"
                      value={formData.termination_date}
                      onChange={(e) => setFormData({ ...formData, termination_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  {/* Último día trabajado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Último Día Trabajado *
                    </label>
                    <input
                      type="date"
                      value={formData.last_work_date}
                      onChange={(e) => setFormData({ ...formData, last_work_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  {/* Días de vacaciones tomados */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Días de Vacaciones Tomados
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.vacation_days_taken}
                      onChange={(e) => setFormData({ ...formData, vacation_days_taken: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Horas extras pendientes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto Horas Extras Pendientes
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.pending_overtime_amount}
                      onChange={(e) => setFormData({ ...formData, pending_overtime_amount: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Monto en CLP"
                    />
                  </div>
                </div>

                {/* Gratificación navideña pendiente */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.christmas_bonus_pending}
                      onChange={(e) => setFormData({ ...formData, christmas_bonus_pending: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Gratificación navideña proporcional pendiente
                    </span>
                  </label>
                </div>

                {/* Detalle del motivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detalle del Motivo de Término
                  </label>
                  <textarea
                    value={formData.termination_reason_details}
                    onChange={(e) => setFormData({ ...formData, termination_reason_details: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Descripción detallada del motivo..."
                  />
                </div>

                <div className="flex space-x-4">
                  <Button 
                    type="submit" 
                    disabled={creating}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {creating ? 'Calculando...' : '💰 Calcular Finiquito'}
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de finiquitos */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Finiquitos Registrados ({terminations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {terminations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay finiquitos registrados</h3>
                <p className="text-gray-600 mb-6">Crea el primer finiquito para comenzar</p>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  ➕ Crear Finiquito
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {terminations.map((termination) => (
                  <div 
                    key={termination.id} 
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {termination.employees.first_name} {termination.employees.last_name}
                        </h3>
                        <p className="text-gray-600">
                          RUT: {termination.employees.rut} • 
                          Cargo: {termination.employees.employment_contracts?.[0]?.position || 'No especificado'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Fecha término: {new Date(termination.termination_date).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(termination.status)}`}>
                        {getStatusText(termination.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Causal</p>
                        <p className="font-medium">{termination.termination_cause_description}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Monto Total</p>
                        <p className="font-bold text-green-600">{formatCurrency(termination.final_net_amount)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">Estado</p>
                        <p className="font-medium">{getStatusText(termination.status)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => generateDocument(termination.id, 'notice_letter')}
                        variant="outline"
                        size="sm"
                      >
                        📝 Carta Aviso
                      </Button>
                      <Button
                        onClick={() => generateDocument(termination.id, 'settlement')}
                        variant="outline"
                        size="sm"
                      >
                        💰 Finiquito
                      </Button>
                      {termination.status !== 'paid' && (
                        <Button
                          onClick={() => setShowDeleteConfirm(termination)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          🗑️ Eliminar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-white max-w-md w-full mx-4">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-red-600">
                ⚠️ Confirmar Eliminación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ¿Estás seguro de que deseas eliminar el finiquito de:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold">
                    {showDeleteConfirm.employees.first_name} {showDeleteConfirm.employees.last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    RUT: {showDeleteConfirm.employees.rut}
                  </p>
                  <p className="text-sm text-gray-600">
                    Fecha término: {new Date(showDeleteConfirm.termination_date).toLocaleDateString('es-CL')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Estado: {getStatusText(showDeleteConfirm.status)}
                  </p>
                </div>
                <p className="text-sm text-red-600 font-medium">
                  Esta acción no se puede deshacer.
                </p>
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={() => handleDeleteTermination(showDeleteConfirm.id)}
                    disabled={deleting === showDeleteConfirm.id}
                    className="bg-red-600 hover:bg-red-700 text-white flex-1"
                  >
                    {deleting === showDeleteConfirm.id ? 'Eliminando...' : '🗑️ Eliminar Finiquito'}
                  </Button>
                  <Button
                    onClick={() => setShowDeleteConfirm(null)}
                    variant="outline"
                    disabled={deleting === showDeleteConfirm.id}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}