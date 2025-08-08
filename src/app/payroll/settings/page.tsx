'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PayrollHeader } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Settings, Building2, Heart, Users, Calculator, Globe, AlertCircle, CheckCircle, Save } from 'lucide-react';
import { useCompanyId } from '@/contexts/CompanyContext';

interface AFPConfig {
  id: string;
  name: string;
  code: string;
  commission_percentage: number;
  sis_percentage: number;
  active: boolean;
}

interface HealthConfig {
  id: string;
  name: string;
  code: string;
  plan_percentage: number;
  active: boolean;
}

interface PayrollSettings {
  afp_configs: AFPConfig[];
  health_configs: HealthConfig[];
  income_limits: {
    uf_limit: number;
    minimum_wage: number;
    family_allowance_limit: number;
  };
  family_allowances: {
    tramo_a: number;
    tramo_b: number;
    tramo_c: number;
  };
  contributions: {
    unemployment_insurance_fixed: number;
    unemployment_insurance_indefinite: number;
    social_security_percentage: number;
  };
  company_info: {
    mutual_code: string;
    caja_compensacion_code: string;
  };
}

export default function PayrollSettingsPage() {
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('afp');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ✅ Usar company ID dinámico desde contexto
  const companyId = useCompanyId();

  // 🔧 OPTIMIZACIÓN: Referencias para timeouts seguros
  const timeouts = useRef({
    afp: null as NodeJS.Timeout | null,
    health: null as NodeJS.Timeout | null,
    family: null as NodeJS.Timeout | null,
    company: null as NodeJS.Timeout | null,
    limits: null as NodeJS.Timeout | null,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  // 🔧 OPTIMIZACIÓN: Cleanup de timeouts al desmontar
  useEffect(() => {
    return () => {
      // Limpiar todos los timeouts pendientes
      Object.values(timeouts.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // 🔧 OPTIMIZACIÓN: Eliminado auto-guardado - Solo guardado manual
  // Ya no se usa debounce automático, solo actualización de estado local

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payroll/settings?company_id=${companyId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setSettings(data.data);
      } else {
        setError(data.error || 'Error al cargar configuración');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updatedSettings: Partial<PayrollSettings>) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/payroll/settings?company_id=${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSettings(data.data); // ✅ CORREGIDO: Usar data completa del servidor
        setSuccessMessage(data.message || 'Configuración actualizada exitosamente');
        
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || 'Error al actualizar configuración');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error updating settings:', err);
    } finally {
      setSaving(false);
    }
  };

  // 🔧 OPTIMIZACIÓN: Manejo AFP - Solo actualización local
  const handleAFPUpdate = useCallback((index: number, field: keyof AFPConfig, value: any) => {
    if (!settings) return;
    
    const updatedAFPs = [...settings.afp_configs];
    updatedAFPs[index] = { ...updatedAFPs[index], [field]: value };
    
    // Solo actualizar estado local - guardado manual
    const updatedSettings = { ...settings, afp_configs: updatedAFPs };
    setSettings(updatedSettings);
  }, [settings]);

  // 🔧 OPTIMIZACIÓN: Manejo Health - Solo actualización local
  const handleHealthUpdate = useCallback((index: number, field: keyof HealthConfig, value: any) => {
    if (!settings) return;
    
    const updatedHealth = [...settings.health_configs];
    updatedHealth[index] = { ...updatedHealth[index], [field]: value };
    
    // Solo actualizar estado local - guardado manual
    const updatedSettings = { ...settings, health_configs: updatedHealth };
    setSettings(updatedSettings);
  }, [settings]);

  // 🔧 OPTIMIZACIÓN: Manejo Family Allowance - Solo actualización local
  const handleFamilyAllowanceUpdate = useCallback((field: string, value: number) => {
    if (!settings) return;
    
    const updatedAllowances = { ...settings.family_allowances, [field]: value };
    
    // Solo actualizar estado local - guardado manual
    const updatedSettings = { ...settings, family_allowances: updatedAllowances };
    setSettings(updatedSettings);
  }, [settings]);

  // 🔧 OPTIMIZACIÓN: Manejo Company Info - Solo actualización local
  const handleCompanyInfoUpdate = useCallback((field: string, value: string) => {
    if (!settings) return;
    
    const updatedCompanyInfo = { ...settings.company_info, [field]: value };
    
    // Solo actualizar estado local - guardado manual
    const updatedSettings = { ...settings, company_info: updatedCompanyInfo };
    setSettings(updatedSettings);
  }, [settings]);

  // 🔧 OPTIMIZACIÓN: Manejo Income Limits - Solo actualización local
  const handleIncomeLimit = useCallback((field: string, value: number) => {
    if (!settings) return;
    
    const updatedLimits = { ...settings.income_limits, [field]: value };
    
    // Solo actualizar estado local - guardado manual
    const updatedSettings = { ...settings, income_limits: updatedLimits };
    setSettings(updatedSettings);
  }, [settings]);

  // ✅ NUEVO: Función para actualizar desde Previred
  const handlePreviredUpdate = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/payroll/settings?company_id=${companyId}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSettings(data.data);
        setSuccessMessage('✅ Configuración actualizada desde Previred exitosamente');
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(data.error || 'Error al actualizar desde Previred');
      }
    } catch (err) {
      setError('Error de conexión con Previred');
      console.error('Error updating from Previred:', err);
    } finally {
      setSaving(false);
    }
  };

  // ✅ NUEVO: Función para guardar toda la configuración
  const handleSaveAll = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Enviar toda la configuración actual
      const response = await fetch(`/api/payroll/settings?company_id=${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSettings(data.data);
        setSuccessMessage('✅ Toda la configuración guardada exitosamente');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(data.error || 'Error al guardar configuración completa');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error saving all settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PayrollHeader 
          title="Configuración Previsional"
          subtitle="Cargando configuración..."
          showBackButton
        />
        <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando configuración...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PayrollHeader 
        title="Configuración Previsional"
        subtitle="Gestiona AFP, Salud, Topes y Descuentos"
        showBackButton
        actions={
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              size="md"
              onClick={handlePreviredUpdate}
              disabled={saving}
              className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <Globe className="h-4 w-4 mr-2" />
              {saving ? 'Actualizando...' : 'Actualizar desde Previred'}
            </Button>
            <Button 
              variant="primary" 
              size="md"
              onClick={handleSaveAll}
              disabled={saving || !settings}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Todo'}
            </Button>
          </div>
        }
      />

      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Status Messages */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center text-red-800">
                <AlertCircle className="h-5 w-5 mr-3 text-red-600" />
                <span className="font-medium">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center text-green-800">
                <CheckCircle className="h-5 w-5 mr-3 text-green-600" />
                <span className="font-medium">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Tabs - Clean Style */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-1">
            <nav className="flex flex-wrap gap-1">
              <button
                onClick={() => setActiveTab('afp')}
                className={`flex items-center px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'afp'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Building2 className="h-4 w-4 mr-2" />
                AFP
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={`flex items-center px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'health'
                    ? 'bg-green-600 text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Heart className="h-4 w-4 mr-2" />
                Salud
              </button>
              <button
                onClick={() => setActiveTab('limits')}
                className={`flex items-center px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'limits'
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Topes e Imponibles
              </button>
              <button
                onClick={() => setActiveTab('family')}
                className={`flex items-center px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'family'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                Asignaciones Familiares
              </button>
              <button
                onClick={() => setActiveTab('company')}
                className={`flex items-center px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'company'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Empresa
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'afp' && settings && (
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Configuración AFP
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Administra las comisiones y porcentajes de las AFP disponibles
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AFP</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comisión %</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SIS %</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {settings.afp_configs?.map((afp, index) => (
                        <tr key={afp.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">{afp.name}</div>
                            <div className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded-md inline-block mt-1">{afp.code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                type="number"
                                step="0.01"
                                value={afp.commission_percentage}
                                onChange={(e) => handleAFPUpdate(index, 'commission_percentage', parseFloat(e.target.value))}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                              />
                              <span className="ml-2 text-sm font-medium text-gray-600">%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                type="number"
                                step="0.01"
                                value={afp.sis_percentage}
                                onChange={(e) => handleAFPUpdate(index, 'sis_percentage', parseFloat(e.target.value))}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                              />
                              <span className="ml-2 text-sm font-medium text-gray-600">%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={afp.active}
                                onChange={(e) => handleAFPUpdate(index, 'active', e.target.checked)}
                                className="sr-only"
                              />
                              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                                afp.active ? 'bg-green-500' : 'bg-gray-300'
                              }`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                                  afp.active ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </div>
                              <span className={`ml-3 text-sm font-medium ${afp.active ? 'text-green-700' : 'text-gray-500'}`}>
                                {afp.active ? 'Activa' : 'Inactiva'}
                              </span>
                            </label>
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <Building2 className="h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-sm font-medium">No hay AFP configuradas</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">
                      Información Importante
                    </h4>
                    <p className="text-sm text-blue-800 mb-3">
                      Los porcentajes se actualizan mensualmente según los indicadores oficiales de <strong>Previred</strong>. 
                      El descuento de AFP es del <strong>10%</strong> sobre el sueldo imponible más la <strong>comisión variable</strong> por AFP.
                    </p>
                    <div className="text-xs text-blue-700 bg-white rounded-md p-2 border border-blue-200">
                      <strong>Auto-actualización:</strong> Usa el botón "Actualizar desde Previred" para obtener las tasas más recientes.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'health' && settings && (
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Instituciones de Salud
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Administra las instituciones de salud y sus porcentajes de descuento
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institución</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan %</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {settings.health_configs?.map((health, index) => (
                        <tr key={health.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{health.name}</div>
                            <div className="text-sm text-gray-500">{health.code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              step="0.01"
                              value={health.plan_percentage}
                              onChange={(e) => handleHealthUpdate(index, 'plan_percentage', parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="ml-1 text-sm text-gray-500">%</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <label className="inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={health.active}
                                onChange={(e) => handleHealthUpdate(index, 'active', e.target.checked)}
                                className="form-checkbox h-4 w-4 text-blue-600"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                {health.active ? 'Activa' : 'Inactiva'}
                              </span>
                            </label>
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                            No hay instituciones de salud configuradas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800 mb-1">
                      Sistema de Salud Chileno
                    </h4>
                    <p className="text-sm text-green-700">
                      El descuento base es 7% del sueldo imponible. Las ISAPRE pueden cobrar un plan adicional.
                      FONASA no cobra adicional (solo el 7% legal).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instituciones Comunes */}
            <Card>
              <CardHeader>
                <CardTitle>Instituciones Más Comunes en Chile</CardTitle>
                <CardDescription>
                  Referencia de las principales instituciones de salud
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">FONASA (Público)</h4>
                    <p className="text-sm text-blue-800">
                      • Solo 7% legal (sin adicional)<br/>
                      • Más del 80% de la población<br/>
                      • Código: FONASA
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">ISAPRE (Privadas)</h4>
                    <p className="text-sm text-purple-800">
                      • 7% + plan adicional<br/>
                      • Principales: Colmena, Banmédica, Cruz Blanca<br/>
                      • Planes desde 7.5% a 12%+
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'limits' && settings && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Topes Imponibles</CardTitle>
                <CardDescription>
                  Límites de renta para cálculos previsionales (valores en UF y CLP)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tope Imponible AFP/Salud (UF)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={settings.income_limits?.uf_limit || 83.4}
                        onChange={(e) => handleIncomeLimit('uf_limit', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-2 text-sm text-gray-500">UF</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Máximo imponible mensual para AFP y Salud
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sueldo Mínimo (CLP)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={settings.income_limits?.minimum_wage || 500000}
                        onChange={(e) => handleIncomeLimit('minimum_wage', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-2 text-sm text-gray-500">CLP</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Sueldo mínimo mensual vigente
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Límite Asignación Familiar (CLP)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={settings.income_limits?.family_allowance_limit || 1000000}
                        onChange={(e) => handleIncomeLimit('family_allowance_limit', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="absolute right-3 top-2 text-sm text-gray-500">CLP</span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Límite superior para recibir asignación familiar
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contributions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Cotizaciones y Descuentos</CardTitle>
                <CardDescription>
                  Porcentajes de cotizaciones obligatorias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seguro Cesantía Indefinido (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.contributions?.unemployment_insurance_indefinite || 0.6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Para contratos indefinidos (trabajador)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seguro Cesantía Plazo Fijo (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.contributions?.unemployment_insurance_fixed || 3.0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Para contratos plazo fijo (trabajador)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cotización Básica AFP (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={10.0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Cotización obligatoria AFP (fija)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'family' && settings && (
          <Card>
            <CardHeader>
              <CardTitle>Asignaciones Familiares</CardTitle>
              <CardDescription>
                Montos por tramo según nivel de ingresos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tramo A (CLP)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={settings.family_allowances?.tramo_a || 13596}
                    onChange={(e) => handleFamilyAllowanceUpdate('tramo_a', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ingresos hasta $500.000
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tramo B (CLP)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={settings.family_allowances?.tramo_b || 8397}
                    onChange={(e) => handleFamilyAllowanceUpdate('tramo_b', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ingresos entre $500.001 y $750.000
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tramo C (CLP)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={settings.family_allowances?.tramo_c || 2798}
                    onChange={(e) => handleFamilyAllowanceUpdate('tramo_c', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Ingresos entre $750.001 y $1.000.000
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800 mb-1">
                      Cálculo Automático por Empleado
                    </h4>
                    <p className="text-sm text-yellow-700">
                      El sistema calculará automáticamente el tramo correspondiente según el sueldo de cada empleado 
                      y multiplicará por el número de cargas familiares registradas.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'company' && settings && (
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Empresa</CardTitle>
              <CardDescription>
                Mutual de Seguridad y Caja de Compensación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mutual de Seguridad
                  </label>
                  <select
                    value={settings.company_info?.mutual_code || 'ACHS'}
                    onChange={(e) => handleCompanyInfoUpdate('mutual_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACHS">ACHS (Asociación Chilena de Seguridad)</option>
                    <option value="MUTUAL">Mutual de Seguridad</option>
                    <option value="IST">IST (Instituto de Seguridad del Trabajo)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Organismo administrador del seguro contra accidentes del trabajo
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caja de Compensación
                  </label>
                  <select
                    value={settings.company_info?.caja_compensacion_code || ''}
                    onChange={(e) => handleCompanyInfoUpdate('caja_compensacion_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sin Caja de Compensación</option>
                    <option value="CCAF_ANDES">CCAF Los Andes</option>
                    <option value="CCAF_GABRIELA_MISTRAL">CCAF Gabriela Mistral</option>
                    <option value="CCAF_18_SEPTIEMBRE">CCAF 18 de Septiembre</option>
                    <option value="CCAF_LA_ARAUCANA">CCAF La Araucana</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Opcional - Para beneficios adicionales como créditos sociales
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">
                      Configuración Empresarial
                    </h4>
                    <p className="text-sm text-blue-700">
                      Estas configuraciones aplican a todos los empleados de la empresa y son requeridas 
                      para generar liquidaciones de sueldo completas y cumplir con las obligaciones laborales.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}