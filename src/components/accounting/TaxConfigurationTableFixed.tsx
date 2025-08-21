'use client';

import { useState, useEffect } from 'react';
import { Edit2, Save, X, FileText, AlertTriangle } from 'lucide-react';
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
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<Partial<TaxConfiguration>>({});

  // Configuraciones fijas de impuestos chilenos (no editables en estructura, solo en cuentas)
  const FIXED_TAX_CONFIGURATIONS = [
    { tax_type: 'iva_19', tax_name: 'IVA 19%', tax_rate: 19.0 },
    { tax_type: 'iva_exento', tax_name: 'IVA Exento', tax_rate: 0.0 },
    { tax_type: 'ila_20.5', tax_name: 'ILA 20.5%', tax_rate: 20.5 },
    { tax_type: 'ila_31.5', tax_name: 'ILA 31.5%', tax_rate: 31.5 },
    { tax_type: 'ila_10', tax_name: 'ILA 10%', tax_rate: 10.0 },
    { tax_type: 'iaba_5', tax_name: 'IABA 5%', tax_rate: 5.0 },
    { tax_type: 'diesel', tax_name: 'Impuesto al Diesel', tax_rate: null },
    { tax_type: 'gasolina', tax_name: 'Impuesto a la Gasolina', tax_rate: null },
    { tax_type: 'tabaco', tax_name: 'Impuesto al Tabaco', tax_rate: null },
    { tax_type: 'lujo', tax_name: 'Impuesto a Artículos de Lujo', tax_rate: 15.0 },
    { tax_type: 'digital', tax_name: 'IVA Servicios Digitales', tax_rate: 19.0 },
    { tax_type: 'vehiculos', tax_name: 'Impuesto Verde Vehículos', tax_rate: null }
  ];

  // Cargar configuraciones y combinar con estructura fija
  const loadConfigurations = async () => {
    try {
      setLoading(true);
      
      // Cargar configuraciones guardadas de la base de datos
      const response = await fetch(`/api/accounting/tax-configurations?company_id=${companyId}`);
      const result = await response.json();
      
      let savedConfigs: TaxConfiguration[] = [];
      if (result.success) {
        savedConfigs = result.data || [];
      }
      
      // Combinar configuraciones fijas con las guardadas
      const combinedConfigs = FIXED_TAX_CONFIGURATIONS.map(fixedConfig => {
        // Buscar si existe configuración guardada para este tipo
        const savedConfig = savedConfigs.find(saved => saved.tax_type === fixedConfig.tax_type);
        
        if (savedConfig) {
          // Si existe, usar la configuración guardada
          return savedConfig;
        } else {
          // Si no existe, crear una nueva basada en la configuración fija
          return {
            id: `temp-${fixedConfig.tax_type}`,
            company_id: companyId,
            tax_type: fixedConfig.tax_type,
            tax_name: fixedConfig.tax_name,
            tax_rate: fixedConfig.tax_rate,
            sales_account_code: '',
            sales_account_name: '',
            purchases_account_code: '',
            purchases_account_name: '',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as TaxConfiguration;
        }
      });
      
      setConfigurations(combinedConfigs);
      
    } catch (error) {
      console.error('Error loading configurations:', error);
      // En caso de error, mostrar solo las configuraciones fijas
      const fallbackConfigs = FIXED_TAX_CONFIGURATIONS.map(fixedConfig => ({
        id: `temp-${fixedConfig.tax_type}`,
        company_id: companyId,
        tax_type: fixedConfig.tax_type,
        tax_name: fixedConfig.tax_name,
        tax_rate: fixedConfig.tax_rate,
        sales_account_code: '',
        sales_account_name: '',
        purchases_account_code: '',
        purchases_account_name: '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as TaxConfiguration));
      
      setConfigurations(fallbackConfigs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      loadConfigurations();
    }
  }, [companyId]);

  // Manejar selección de cuenta en modo edición
  const handleAccountSelect = (field: string, accountCode: string) => {
    const account = accounts.find(acc => acc.code === accountCode);
    const accountName = account ? account.name : '';
    
    setEditingConfig(prev => ({
      ...prev,
      [field]: accountCode,
      [field.replace('_code', '_name')]: accountName
    }));
  };

  // Iniciar edición de una fila
  const startEditing = (config: TaxConfiguration) => {
    setEditingRow(config.tax_type);
    setEditingConfig({
      sales_account_code: config.sales_account_code || '',
      sales_account_name: config.sales_account_name || '',
      purchases_account_code: config.purchases_account_code || '',
      purchases_account_name: config.purchases_account_name || ''
    });
  };

  // Cancelar edición
  const cancelEditing = () => {
    setEditingRow(null);
    setEditingConfig({});
  };

  // Guardar configuración editada
  const saveConfiguration = async (config: TaxConfiguration) => {
    try {
      const isTemporary = config.id.startsWith('temp-');
      const method = isTemporary ? 'POST' : 'PUT';
      const url = isTemporary 
        ? '/api/accounting/tax-configurations'
        : `/api/accounting/tax-configurations/${config.id}`;

      const requestBody = {
        ...(isTemporary && { company_id: companyId }),
        ...(isTemporary && { tax_type: config.tax_type }),
        ...(isTemporary && { tax_name: config.tax_name }),
        ...(isTemporary && { tax_rate: config.tax_rate }),
        ...(!isTemporary && { id: config.id }),
        sales_account_code: editingConfig.sales_account_code,
        sales_account_name: editingConfig.sales_account_name,
        purchases_account_code: editingConfig.purchases_account_code,
        purchases_account_name: editingConfig.purchases_account_name,
        is_active: true
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      
      if (result.success) {
        await loadConfigurations();
        setEditingRow(null);
        setEditingConfig({});
      } else {
        console.error('Error saving configuration:', result.error);
        alert('Error al guardar configuración: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Error al guardar configuración');
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
                Configure las cuentas contables para cada tipo de impuesto chileno
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              <div className="font-medium text-gray-900">
                {configurations.length} impuestos configurables
              </div>
              <div className="text-xs">
                Haga clic en "Configurar/Editar" para asignar cuentas
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mt-4 flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-green-700 font-medium">
              {configurations.filter(c => c.sales_account_code && c.purchases_account_code).length} configuradas
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span className="text-yellow-700 font-medium">
              {configurations.filter(c => !c.sales_account_code || !c.purchases_account_code).length} pendientes
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span className="text-blue-700 font-medium">
              {configurations.filter(c => c.tax_type.startsWith('iva')).length} IVA
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span className="text-purple-700 font-medium">
              {configurations.filter(c => c.tax_type.startsWith('ila')).length} ILA
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
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Impuesto</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Tasa</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Cuenta Ventas</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Cuenta Compras</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {/* Filas de configuraciones con edición inline */}
              {configurations.map((config) => {
                const isEditing = editingRow === config.tax_type;
                const isConfigured = config.sales_account_code && config.purchases_account_code;
                
                return (
                  <tr key={config.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isEditing ? 'bg-blue-50/50' : ''}`}>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        config.tax_type.startsWith('iva') ? 'bg-blue-100 text-blue-800' :
                        config.tax_type.startsWith('ila') ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {config.tax_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{config.tax_name}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {config.tax_rate ? `${config.tax_rate}%` : 'Variable'}
                    </td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <select
                          value={editingConfig.sales_account_code}
                          onChange={(e) => handleAccountSelect('sales_account_code', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
                        >
                          <option value="">Seleccionar cuenta...</option>
                          {accounts.map(account => (
                            <option key={account.code} value={account.code}>
                              {account.code} - {account.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm">
                          <div className={`font-medium ${isConfigured ? 'text-gray-900' : 'text-gray-400'}`}>
                            {config.sales_account_code || 'Sin configurar'}
                          </div>
                          <div className="text-gray-600 text-xs">
                            {config.sales_account_name || ''}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <select
                          value={editingConfig.purchases_account_code}
                          onChange={(e) => handleAccountSelect('purchases_account_code', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
                        >
                          <option value="">Seleccionar cuenta...</option>
                          {accounts.map(account => (
                            <option key={account.code} value={account.code}>
                              {account.code} - {account.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm">
                          <div className={`font-medium ${isConfigured ? 'text-gray-900' : 'text-gray-400'}`}>
                            {config.purchases_account_code || 'Sin configurar'}
                          </div>
                          <div className="text-gray-600 text-xs">
                            {config.purchases_account_name || ''}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {isEditing ? (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<Save className="w-4 h-4" />}
                              onClick={() => saveConfiguration(config)}
                            >
                              Guardar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              leftIcon={<X className="w-4 h-4" />}
                              onClick={cancelEditing}
                            >
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Edit2 className="w-4 h-4" />}
                            onClick={() => startEditing(config)}
                            className={isConfigured ? 'hover:bg-blue-50 hover:border-blue-300' : 'hover:bg-orange-50 hover:border-orange-300 border-orange-200 text-orange-700'}
                          >
                            {isConfigured ? 'Editar' : 'Configurar'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Mensaje cuando no hay configuraciones */}
              {configurations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Cargando configuraciones de impuestos...</p>
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