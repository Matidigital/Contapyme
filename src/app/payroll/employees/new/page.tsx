'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { ArrowLeft, Save, User, Phone, Mail, Home, Calendar, AlertCircle, Calculator, Settings, DollarSign } from 'lucide-react';
import RutInputFixed from '@/components/payroll/RutInputFixed';

interface EmployeeFormData {
  // Información Personal
  rut: string;
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  
  // Información de Contacto
  email: string;
  phone: string;
  mobilePhone: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  
  // Información de Emergencia
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  
  // Información del Contrato
  position: string;
  department: string;
  contractType: string;
  startDate: string;
  endDate: string;
  baseSalary: string;
  salaryType: string;
  weeklyHours: string;
  healthInsurance: string;
  pensionFund: string;
}

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRutValid, setIsRutValid] = useState(false);
  const [showPayrollConfig, setShowPayrollConfig] = useState(false);
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    // Información Personal
    rut: '',
    firstName: '',
    lastName: '',
    middleName: '',
    birthDate: '',
    gender: '',
    maritalStatus: '',
    nationality: 'Chilena',
    
    // Información de Contacto
    email: '',
    phone: '',
    mobilePhone: '',
    address: '',
    city: '',
    region: '',
    postalCode: '',
    
    // Información de Emergencia
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    
    // Información del Contrato
    position: '',
    department: '',
    contractType: 'indefinido',
    startDate: '',
    endDate: '',
    baseSalary: '',
    salaryType: 'monthly',
    weeklyHours: '45',
    healthInsurance: '',
    pensionFund: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validaciones básicas
    if (!formData.rut) newErrors.rut = 'RUT es requerido';
    if (!isRutValid) newErrors.rut = 'RUT inválido';
    if (!formData.firstName) newErrors.firstName = 'Nombre es requerido';
    if (!formData.lastName) newErrors.lastName = 'Apellido es requerido';
    if (!formData.birthDate) newErrors.birthDate = 'Fecha de nacimiento es requerida';
    if (!formData.email) newErrors.email = 'Email es requerido';
    if (!formData.position) newErrors.position = 'Cargo es requerido';
    if (!formData.startDate) newErrors.startDate = 'Fecha de inicio es requerida';
    if (!formData.baseSalary) newErrors.baseSalary = 'Salario base es requerido';
    
    // Validaciones adicionales para configuración previsional
    if (!formData.healthInsurance) newErrors.healthInsurance = 'Previsión de salud es requerida';
    if (!formData.pensionFund) newErrors.pensionFund = 'AFP es requerida';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Find first tab with error
      if (errors.rut || errors.firstName || errors.lastName || errors.birthDate) {
        setActiveTab('personal');
      } else if (errors.email) {
        setActiveTab('contact');
      } else if (errors.position || errors.startDate || errors.baseSalary) {
        setActiveTab('contract');
      } else if (errors.healthInsurance || errors.pensionFund) {
        setActiveTab('payroll');
      }
      return;
    }
    
    setLoading(true);
    
    try {
      // Mapear valores de AFP a códigos de base de datos
      const afpMapping: Record<string, string> = {
        'Capital': 'CAPITAL',
        'Cuprum': 'CUPRUM', 
        'Habitat': 'HABITAT',
        'Modelo': 'MODELO',
        'PlanVital': 'PLANVITAL',
        'ProVida': 'PROVIDA',
        'Uno': 'UNO'
      };

      // Mapear valores de salud a códigos de base de datos
      const healthMapping: Record<string, string> = {
        'FONASA': 'FONASA',
        'Banmédica': 'BANMEDICA',
        'Consalud': 'CONSALUD',
        'Colmena': 'COLMENA',
        'Cruz Blanca': 'CRUZ_BLANCA',
        'Vida Tres': 'VIDA_TRES',
        'Más Vida': 'MAS_VIDA'
      };
      
      // Preparar datos para la API
      const apiData = {
        // Company info (valores correctos de la base de datos)
        company_id: '8033ee69-b420-4d91-ba0e-482f46cd6fce',
        created_by: '550e8400-e29b-41d4-a716-446655440000',
        
        // Employee data
        rut: formData.rut,
        first_name: formData.firstName,
        last_name: formData.lastName,
        middle_name: formData.middleName || null,
        birth_date: formData.birthDate,
        gender: formData.gender || null,
        marital_status: formData.maritalStatus || null,
        nationality: formData.nationality || 'Chilena',
        
        // Contact info
        email: formData.email,
        phone: formData.phone || null,
        mobile_phone: formData.mobilePhone || null,
        address: formData.address || null,
        city: formData.city || null,
        region: formData.region || null,
        postal_code: formData.postalCode || null,
        
        // Emergency contact
        emergency_contact_name: formData.emergencyContactName || null,
        emergency_contact_phone: formData.emergencyContactPhone || null,
        emergency_contact_relationship: formData.emergencyContactRelationship || null,
        
        // Contract info
        position: formData.position,
        department: formData.department || null,
        contract_type: formData.contractType,
        start_date: formData.startDate,
        end_date: formData.endDate || null,
        base_salary: parseFloat(formData.baseSalary),
        salary_type: formData.salaryType,
        weekly_hours: parseFloat(formData.weeklyHours) || 45,
        
        // Payroll config - Estructura correcta para la API
        payroll_config: {
          afp_code: afpMapping[formData.pensionFund] || 'HABITAT',
          health_institution_code: healthMapping[formData.healthInsurance] || 'FONASA',
          family_allowances: 0,
          legal_gratification_type: 'none',
          has_unemployment_insurance: true
        }
      };
      
      const response = await fetch('/api/payroll/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al guardar empleado');
      }

      console.log('Empleado creado:', result.data);
      
      // Redirigir a la lista de empleados
      router.push('/payroll?tab=employees');
    } catch (error) {
      console.error('Error al guardar empleado:', error);
      alert(error instanceof Error ? error.message : 'Error al guardar empleado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Nuevo Empleado"
        subtitle="Registra la información del empleado y su contrato"
        showBackButton
      />

      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <form onSubmit={handleSubmit}>
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('personal')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'personal'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <User className="w-4 h-4 inline-block mr-2" />
                  Información Personal
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('contact')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'contact'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Phone className="w-4 h-4 inline-block mr-2" />
                  Contacto
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('contract')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'contract'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline-block mr-2" />
                  Contrato
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('payroll')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === 'payroll'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Settings className="w-4 h-4 inline-block mr-2" />
                  Configuración Previsional
                </button>
              </nav>
            </div>

            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>Datos personales del empleado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RUT *
                      </label>
                      <RutInputFixed
                        value={formData.rut}
                        onChange={(value) => setFormData(prev => ({ ...prev, rut: value }))}
                        onValidChange={setIsRutValid}
                        required
                        className={errors.rut ? 'border-red-500' : ''}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nacionalidad
                      </label>
                      <input
                        type="text"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Segundo Nombre
                      </label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Nacimiento *
                      </label>
                      <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.birthDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.birthDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.birthDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Género
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado Civil
                      </label>
                      <select
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccionar</option>
                        <option value="soltero">Soltero/a</option>
                        <option value="casado">Casado/a</option>
                        <option value="divorciado">Divorciado/a</option>
                        <option value="viudo">Viudo/a</option>
                        <option value="conviviente">Conviviente</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Information Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información de Contacto</CardTitle>
                    <CardDescription>Datos de contacto y dirección</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teléfono Fijo
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teléfono Móvil
                        </label>
                        <input
                          type="tel"
                          name="mobilePhone"
                          value={formData.mobilePhone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Código Postal
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dirección
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ciudad
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Región
                        </label>
                        <select
                          name="region"
                          value={formData.region}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccionar</option>
                          <option value="I">I - Tarapacá</option>
                          <option value="II">II - Antofagasta</option>
                          <option value="III">III - Atacama</option>
                          <option value="IV">IV - Coquimbo</option>
                          <option value="V">V - Valparaíso</option>
                          <option value="RM">RM - Metropolitana</option>
                          <option value="VI">VI - O'Higgins</option>
                          <option value="VII">VII - Maule</option>
                          <option value="VIII">VIII - Biobío</option>
                          <option value="IX">IX - Araucanía</option>
                          <option value="X">X - Los Lagos</option>
                          <option value="XI">XI - Aysén</option>
                          <option value="XII">XII - Magallanes</option>
                          <option value="XIV">XIV - Los Ríos</option>
                          <option value="XV">XV - Arica y Parinacota</option>
                          <option value="XVI">XVI - Ñuble</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contacto de Emergencia</CardTitle>
                    <CardDescription>Persona a contactar en caso de emergencia</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre Completo
                        </label>
                        <input
                          type="text"
                          name="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          name="emergencyContactPhone"
                          value={formData.emergencyContactPhone}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Parentesco
                        </label>
                        <input
                          type="text"
                          name="emergencyContactRelationship"
                          value={formData.emergencyContactRelationship}
                          onChange={handleInputChange}
                          placeholder="Ej: Cónyuge, Padre, Madre, etc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Contract Information Tab */}
            {activeTab === 'contract' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información del Contrato</CardTitle>
                    <CardDescription>Detalles del contrato laboral</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cargo *
                        </label>
                        <input
                          type="text"
                          name="position"
                          value={formData.position}
                          onChange={handleInputChange}
                          placeholder="Ej: Vendedor, Administrativo, etc."
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.position ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.position && (
                          <p className="mt-1 text-sm text-red-600">{errors.position}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Departamento
                        </label>
                        <input
                          type="text"
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          placeholder="Ej: Ventas, Administración, etc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Contrato *
                        </label>
                        <select
                          name="contractType"
                          value={formData.contractType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="indefinido">Indefinido</option>
                          <option value="plazo_fijo">Plazo Fijo</option>
                          <option value="por_obra">Por Obra o Faena</option>
                          <option value="part_time">Part Time</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horas Semanales
                        </label>
                        <input
                          type="number"
                          name="weeklyHours"
                          value={formData.weeklyHours}
                          onChange={handleInputChange}
                          min="1"
                          max="45"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Inicio *
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.startDate ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.startDate && (
                          <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Término
                          {formData.contractType === 'indefinido' && (
                            <span className="text-gray-500 text-xs ml-2">(No aplica)</span>
                          )}
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleInputChange}
                          disabled={formData.contractType === 'indefinido'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Salario Base *
                        </label>
                        <input
                          type="number"
                          name="baseSalary"
                          value={formData.baseSalary}
                          onChange={handleInputChange}
                          placeholder="500000"
                          min="0"
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.baseSalary ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.baseSalary && (
                          <p className="mt-1 text-sm text-red-600">{errors.baseSalary}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Salario
                        </label>
                        <select
                          name="salaryType"
                          value={formData.salaryType}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="monthly">Mensual</option>
                          <option value="hourly">Por Hora</option>
                          <option value="daily">Diario</option>
                        </select>
                      </div>

                    </div>
                  </CardContent>
                </Card>

                {/* Alert about contract creation */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Información del contrato
                      </h3>
                      <p className="mt-1 text-sm text-blue-700">
                        Al guardar este empleado, se creará automáticamente un contrato con la información proporcionada.
                        Podrás modificar o agregar más contratos desde la sección de gestión de contratos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payroll Configuration Tab */}
            {activeTab === 'payroll' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración AFP</CardTitle>
                    <CardDescription>Administradora de Fondos de Pensiones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          AFP *
                        </label>
                        <select
                          name="pensionFund"
                          value={formData.pensionFund}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.pensionFund ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Seleccionar AFP</option>
                          <option value="Capital">Capital (1.44%)</option>
                          <option value="Cuprum">Cuprum (1.44%)</option>
                          <option value="Habitat">Habitat (1.27%)</option>
                          <option value="Modelo">Modelo (0.77%)</option>
                          <option value="PlanVital">PlanVital (1.16%)</option>
                          <option value="ProVida">ProVida (1.45%)</option>
                          <option value="Uno">Uno (0.69%)</option>
                        </select>
                        {errors.pensionFund && (
                          <p className="mt-1 text-sm text-red-600">{errors.pensionFund}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Contrato (para AFC)
                        </label>
                        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                          <p><strong>Contrato {formData.contractType === 'indefinido' ? 'Indefinido' : 'Plazo Fijo'}</strong></p>
                          <p className="mt-1">Trabajador: 0.6%</p>
                          <p>Empleador: {formData.contractType === 'indefinido' ? '2.4%' : '3.0%'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Salud</CardTitle>
                    <CardDescription>Sistema de salud y planes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sistema de Salud *
                        </label>
                        <select
                          name="healthInsurance"
                          value={formData.healthInsurance}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.healthInsurance ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Seleccionar</option>
                          <option value="FONASA">FONASA (7%)</option>
                          <optgroup label="Isapres">
                            <option value="Banmédica">Banmédica</option>
                            <option value="Consalud">Consalud</option>
                            <option value="Colmena">Colmena</option>
                            <option value="Cruz Blanca">Cruz Blanca</option>
                            <option value="Vida Tres">Vida Tres</option>
                            <option value="Más Vida">Más Vida</option>
                          </optgroup>
                        </select>
                        {errors.healthInsurance && (
                          <p className="mt-1 text-sm text-red-600">{errors.healthInsurance}</p>
                        )}
                      </div>

                      {formData.healthInsurance && formData.healthInsurance !== 'FONASA' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Plan de Salud (UF)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Ej: 2.5"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Valor del plan en UF. Si es mayor al 7%, el trabajador paga la diferencia.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Otros Descuentos y Beneficios</CardTitle>
                    <CardDescription>Configuración adicional opcional</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">APV - Ahorro Previsional Voluntario</h4>
                          <p className="text-sm text-gray-500">Descuento adicional para ahorro</p>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Seguro Complementario</h4>
                          <p className="text-sm text-gray-500">Seguro adicional de salud</p>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Préstamo Empresa</h4>
                          <p className="text-sm text-gray-500">Descuento por préstamo de la empresa</p>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Calculadora de liquidación */}
                {formData.baseSalary && formData.healthInsurance && formData.pensionFund && (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-900">Vista Previa de Liquidación</CardTitle>
                      <CardDescription>
                        Cálculo estimado basado en los datos ingresados (sueldo base: {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(parseFloat(formData.baseSalary))})
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <p className="text-sm text-gray-600">Sueldo Bruto</p>
                          <p className="text-lg font-semibold text-green-700">
                            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(parseFloat(formData.baseSalary) * 1.25)}
                          </p>
                          <p className="text-xs text-gray-500">Incluye gratificación</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <p className="text-sm text-gray-600">Descuentos</p>
                          <p className="text-lg font-semibold text-red-600">
                            -{new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(parseFloat(formData.baseSalary) * 0.20)}
                          </p>
                          <p className="text-xs text-gray-500">AFP + Salud + Imp. único</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <p className="text-sm text-gray-600">Líquido a Pagar</p>
                          <p className="text-lg font-semibold text-blue-700">
                            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(parseFloat(formData.baseSalary) * 1.05)}
                          </p>
                          <p className="text-xs text-gray-500">Estimación</p>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-medium text-gray-900 mb-3">Desglose de Descuentos Estimados:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">AFP ({formData.pensionFund}):</span>
                            <br />
                            <span className="font-medium">
                              {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(parseFloat(formData.baseSalary) * 0.11)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Salud ({formData.healthInsurance}):</span>
                            <br />
                            <span className="font-medium">
                              {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(parseFloat(formData.baseSalary) * 0.07)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Seguro Cesantía:</span>
                            <br />
                            <span className="font-medium">
                              {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(parseFloat(formData.baseSalary) * 0.006)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Impuesto Único:</span>
                            <br />
                            <span className="font-medium">
                              {parseFloat(formData.baseSalary) > 700000 ? 
                                new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(parseFloat(formData.baseSalary) * 0.04) : 
                                'Exento'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Información sobre cálculo de liquidación */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex">
                    <Calculator className="h-6 w-6 text-blue-600 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-900">
                        Cálculo Automático de Liquidaciones
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Al guardar el empleado, podrás:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Generar liquidaciones de sueldo mensuales automáticamente</li>
                          <li>Calcular impuesto único de segunda categoría</li>
                          <li>Integración automática con F29 (códigos 10 y 161)</li>
                          <li>Exportar libro de remuneraciones en Excel</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Link href="/payroll">
                <Button variant="outline" type="button">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </Link>
              
              <Button 
                type="submit" 
                variant="primary"
                loading={loading}
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Empleado
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}