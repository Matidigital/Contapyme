'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Save, X, Check, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui';

interface TaxConfiguration {
  id: string;
  company_id: string;
  tax_type: string;
  tax_name: string;
  tax_rate?: number;
  sales_account_code?: string;
  sales_account_name?: string;
  purchases_account_code?: string;
  purchases_account_name?: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface TaxConfigurationTableProps {
  companyId: string;
  accounts: any[];
}

export default function TaxConfigurationTable({ companyId, accounts }: TaxConfigurationTableProps) {
  const [configurations, setConfigurations] = useState<TaxConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>({});

  // Estado para nueva configuración
  const [showNewRow, setShowNewRow] = useState(false);
  const [newConfig, setNewConfig] = useState({
    tax_type: '',
    tax_name: '',
    tax_rate: '',
    sales_account_code: '',
    sales_account_name: '',
    purchases_account_code: '',
    purchases_account_name: '',
    notes: ''
  });

  // Tipos de impuestos disponibles
  const TAX_TYPES = [
    { value: 'iva_19', label: 'IVA 19%', rate: 19 },
    { value: 'iva_exento', label: 'IVA Exento', rate: 0 },
    { value: 'ila_20.5', label: 'ILA 20.5%', rate: 20.5 },
    { value: 'ila_31.5', label: 'ILA 31.5%', rate: 31.5 },
    { value: 'ila_10', label: 'ILA 10%', rate: 10 },
    { value: 'iaba_5', label: 'IABA 5%', rate: 5 },
  ];

  // Cargar configuraciones
  const loadConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/accounting/tax-configurations?company_id=${companyId}`);
      const result = await response.json();
      
      if (result.success) {
        setConfigurations(result.data || []);
        setStats(result.stats || {});
      } else {
        console.error('Error loading configurations:', result.error);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      loadConfigurations();
    }
  }, [companyId]);

  // Manejar selección de cuenta
  const handleAccountSelect = (field: string, accountCode: string, isNew = false) => {
    const account = accounts.find(acc => acc.code === accountCode);
    const accountName = account ? account.name : '';
    
    if (isNew) {
      setNewConfig(prev => ({
        ...prev,
        [field]: accountCode,
        [field.replace('_code', '_name')]: accountName
      }));
    } else {
      // Para edición de configuraciones existentes
      // Implementar lógica similar si es necesario
    }
  };

  // Crear nueva configuración
  const handleCreateConfig = async () => {
    try {
      const response = await fetch('/api/accounting/tax-configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          ...newConfig,
          tax_rate: newConfig.tax_rate ? parseFloat(newConfig.tax_rate) : null
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await loadConfigurations();
        setShowNewRow(false);
        setNewConfig({
          tax_type: '',
          tax_name: '',
          tax_rate: '',
          sales_account_code: '',
          sales_account_name: '',
          purchases_account_code: '',
          purchases_account_name: '',
          notes: ''
        });
      } else {
        console.error('Error creating configuration:', result.error);
        alert('Error al crear configuración: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating configuration:', error);
    }
  };

  // Eliminar configuración
  const handleDeleteConfig = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta configuración?')) {
      try {
        const response = await fetch(`/api/accounting/tax-configurations/${id}`, {
          method: 'DELETE'
        });

        const result = await response.json();
        
        if (result.success) {
          await loadConfigurations();
        } else {
          console.error('Error deleting configuration:', result.error);
          alert('Error al eliminar configuración: ' + result.error);
        }
      } catch (error) {
        console.error('Error deleting configuration:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-sm border-2 border-purple-100 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Cargando configuraciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm border-2 border-purple-100 hover:border-purple-200 transition-colors rounded-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Configuraciones de Impuestos RCV
              </h3>
              <p className="text-sm text-gray-600">
                Asociación directa de cuentas contables por tipo de impuesto
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowNewRow(true)}
            disabled={showNewRow}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Nueva Configuración
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-green-700 font-medium">
              {stats.active_configurations || 0} activas
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span className="text-blue-700 font-medium">
              {stats.iva_configurations || 0} IVA
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span className="text-purple-700 font-medium">
              {stats.ila_configurations || 0} ILA
            </span>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Tasa (%)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Cuenta Ventas</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Cuenta Compras</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Notas</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {/* Fila para nueva configuración */}
              {showNewRow && (
                <tr className="border-b border-gray-100 bg-blue-50/50">
                  <td className="py-3 px-4">
                    <select
                      value={newConfig.tax_type}
                      onChange={(e) => {
                        const selectedType = TAX_TYPES.find(type => type.value === e.target.value);
                        setNewConfig(prev => ({
                          ...prev,
                          tax_type: e.target.value,
                          tax_name: selectedType?.label || '',
                          tax_rate: selectedType?.rate?.toString() || ''
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
                    >
                      <option value="">Seleccionar...</option>
                      {TAX_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={newConfig.tax_name}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, tax_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
                      placeholder="Nombre del impuesto"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.1"
                      value={newConfig.tax_rate}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, tax_rate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
                      placeholder="19.0"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={newConfig.sales_account_code}
                      onChange={(e) => handleAccountSelect('sales_account_code', e.target.value, true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
                    >
                      <option value="">Seleccionar cuenta...</option>
                      {accounts.map(account => (
                        <option key={account.code} value={account.code}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={newConfig.purchases_account_code}
                      onChange={(e) => handleAccountSelect('purchases_account_code', e.target.value, true)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
                    >
                      <option value="">Seleccionar cuenta...</option>
                      {accounts.map(account => (
                        <option key={account.code} value={account.code}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      value={newConfig.notes}
                      onChange={(e) => setNewConfig(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
                      placeholder="Notas opcionales"
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Save className="w-4 h-4" />}
                        onClick={handleCreateConfig}
                        disabled={!newConfig.tax_type || !newConfig.tax_name}
                      >
                        Guardar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<X className="w-4 h-4" />}
                        onClick={() => setShowNewRow(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Filas de configuraciones existentes */}
              {configurations.map((config) => (
                <tr key={config.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                      {config.tax_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {config.tax_name}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {config.tax_rate ? `${config.tax_rate}%` : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {config.sales_account_code || '-'}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {config.sales_account_name || ''}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {config.purchases_account_code || '-'}
                      </div>
                      <div className="text-gray-600 text-xs">
                        {config.purchases_account_name || ''}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-sm">
                    {config.notes || '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit2 className="w-4 h-4" />}
                        onClick={() => setEditingId(config.id)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Trash2 className="w-4 h-4" />}
                        onClick={() => handleDeleteConfig(config.id)}
                        className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Mensaje cuando no hay configuraciones */}
              {configurations.length === 0 && !showNewRow && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No hay configuraciones de impuestos.</p>
                    <p className="text-sm">Haz clic en "Nueva Configuración" para agregar una.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}