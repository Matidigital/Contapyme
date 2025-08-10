'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Settings, 
  FileText, 
  Download, 
  Upload, 
  Plus, 
  Edit2, 
  Trash2,
  ChevronRight,
  ChevronDown,
  Search,
  Save,
  X,
  Target,
  DollarSign,
  TrendingUp,
  Building2
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Header } from '@/components/layout';
import { exportToCSV, exportToJSON, parseCSV, downloadFile, generateCSVTemplate } from '@/lib/data/chartOfAccounts';
import { planDeCuentasChilenoFinal } from '@/lib/data/planDeCuentasChilenoFinal';
import { Account } from '@/types';


// Interfaces para configuración centralizada
interface CentralizedAccountConfig {
  id: string;
  module_name: string;
  transaction_type: string;
  display_name: string;
  tax_account_code: string;
  tax_account_name: string;
  revenue_account_code: string;
  revenue_account_name: string;
  asset_account_code: string;
  asset_account_name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function ConfigurationPage() {
  const [accounts, setAccounts] = useState<Account[]>(planDeCuentasChilenoFinal);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '1.1', '1.2', '2', '2.1', '2.2', '2.3', '3', '3.1', '3.2', '4', '4.1', '4.2']));
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Estados para configuración centralizada
  const [centralizedConfigs, setCentralizedConfigs] = useState<CentralizedAccountConfig[]>([]);
  const [editingConfig, setEditingConfig] = useState<CentralizedAccountConfig | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(true);

  const companyId = '8033ee69-b420-4d91-ba0e-482f46cd6fce'; // TODO: Get from auth

  // Cargar configuraciones centralizadas
  useEffect(() => {
    loadCentralizedConfigs();
  }, []);

  const loadCentralizedConfigs = async () => {
    try {
      setLoadingConfigs(true);
      const response = await fetch(`/api/accounting/configuration/centralized?company_id=${companyId}`);
      const data = await response.json();

      if (data.success) {
        setCentralizedConfigs(data.data);
      }
    } catch (error) {
      console.error('Error loading centralized configs:', error);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const saveCentralizedConfig = async (config: Partial<CentralizedAccountConfig>) => {
    try {
      const response = await fetch('/api/accounting/configuration/centralized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          ...config
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadCentralizedConfigs();
        setShowConfigForm(false);
        setEditingConfig(null);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving centralized config:', error);
      alert('Error guardando configuración');
    }
  };

  const deleteCentralizedConfig = async (configId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta configuración?')) return;

    try {
      const response = await fetch(`/api/accounting/configuration/centralized/${configId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await loadCentralizedConfigs();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting centralized config:', error);
      alert('Error eliminando configuración');
    }
  };

  // Filtrar cuentas imputables (nivel 4) para los selectores
  const getDetailAccounts = () => {
    const flattenAccounts = (accounts: Account[]): Account[] => {
      let result: Account[] = [];
      accounts.forEach(account => {
        if (account.is_detail) {
          result.push(account);
        }
        if (account.children) {
          result = result.concat(flattenAccounts(account.children));
        }
      });
      return result;
    };
    
    return flattenAccounts(accounts).sort((a, b) => a.code.localeCompare(b.code));
  };

  // Toggle expand/collapse
  const toggleExpand = (accountId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedNodes(newExpanded);
  };

  // Renderizar cuenta con sus hijos
  const renderAccount = (account: Account) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedNodes.has(account.id);
    
    // Aplicar filtro de búsqueda
    if (searchTerm && !account.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !account.code.includes(searchTerm)) {
      return null;
    }

    const accountTypeColors = {
      asset: 'text-blue-600 bg-blue-50',
      liability: 'text-red-600 bg-red-50',
      equity: 'text-purple-600 bg-purple-50',
      income: 'text-green-600 bg-green-50',
      expense: 'text-orange-600 bg-orange-50'
    };

    return (
      <div key={account.id} className="mb-1">
        <div 
          className={`flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer ${
            account.level === 1 ? 'font-semibold' : ''
          }`}
          style={{ paddingLeft: `${(account.level - 1) * 2}rem` }}
        >
          <div className="flex items-center flex-1">
            {hasChildren && (
              <button
                onClick={() => toggleExpand(account.id)}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            {!hasChildren && <div className="w-6 mr-2" />}
            
            <span className="text-gray-600 mr-3 font-mono text-sm">{account.code}</span>
            <span className="flex-1">{account.name}</span>
            
            <span className={`px-2 py-1 text-xs rounded-full ${accountTypeColors[account.account_type]}`}>
              {account.account_type === 'asset' && 'Activo'}
              {account.account_type === 'liability' && 'Pasivo'}
              {account.account_type === 'equity' && 'Patrimonio'}
              {account.account_type === 'income' && 'Ingreso'}
              {account.account_type === 'expense' && 'Gasto'}
            </span>
            
            {account.is_detail && (
              <span className="ml-2 text-xs text-gray-500">(Detalle)</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setEditingAccount(account)}
              className="p-1 text-gray-400 hover:text-blue-600"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            {account.level > 1 && (
              <button className="p-1 text-gray-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {account.children!.map(child => renderAccount(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000" />
      </div>

      <Header 
        title="Configuración del Sistema"
        subtitle="Gestión del plan de cuentas IFRS y configuraciones avanzadas"
        showBackButton={true}
        backHref="/accounting"
        variant="premium"
        actions={
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-xs font-medium text-blue-800">
              <Settings className="w-3 h-3" />
              <span>IFRS Compliant</span>
            </div>
          </div>
        }
      />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto py-8 px-4 space-y-8">
        {/* Plan de Cuentas Section */}
        <Card className="bg-white/90 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-200 transition-colors">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span>Plan de Cuentas IFRS</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {accounts.length} cuentas
              </span>
            </CardTitle>
            <CardDescription>
              Gestión completa del plan de cuentas con importación/exportación y edición avanzada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Total: {accounts.length} cuentas</span>
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-green-600">Sistema activo</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative group">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-4 h-4" />}
                    className="border-green-200 hover:bg-green-50 hover:border-green-300"
                  >
                    Exportar
                  </Button>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border-2 border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <button
                      onClick={() => {
                        const csv = exportToCSV(accounts);
                        downloadFile(csv, 'plan_de_cuentas.csv', 'text/csv');
                      }}
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors rounded-t-xl"
                    >
                      📄 Exportar como CSV
                    </button>
                    <button
                      onClick={() => {
                        const json = exportToJSON(accounts);
                        downloadFile(json, 'plan_de_cuentas.json', 'application/json');
                      }}
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      📁 Exportar como JSON
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        const template = generateCSVTemplate();
                        downloadFile(template, 'template_plan_de_cuentas.csv', 'text/csv');
                      }}
                      className="block w-full text-left px-4 py-3 text-sm text-purple-700 hover:bg-purple-50 font-medium transition-colors rounded-b-xl"
                    >
                      📋 Descargar Template CSV
                    </button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload className="w-4 h-4" />}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.csv,.json';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const content = await file.text();
                        if (file.name.endsWith('.csv')) {
                          const parsed = parseCSV(content);
                          setAccounts(parsed);
                        } else if (file.name.endsWith('.json')) {
                          const parsed = JSON.parse(content);
                          setAccounts(parsed);
                        }
                      }
                    };
                    input.click();
                  }}
                  className="border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                >
                  Importar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Nueva Cuenta
                </Button>
              </div>
            </div>

            {/* Search Bar Modernizada */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por código o nombre de cuenta..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Chart of Accounts Tree Modernizado */}
            <div className="border-2 border-blue-100 rounded-xl p-6 max-h-[600px] overflow-y-auto bg-gradient-to-br from-white to-blue-50/30">
              <div className="space-y-1">
                {accounts.map(account => renderAccount(account))}
              </div>
            </div>

              {/* Info Box */}
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm text-indigo-800">
                  <strong>Plan de Cuentas Chileno Final:</strong> Estructura optimizada con Patrimonio como subcategoría de Pasivo. 
                  Distribución: 1=Activo (1.1 Corriente, 1.2 No Corriente), 2=Pasivo (2.1 Corriente, 2.2 No Corriente, 2.3 Patrimonio), 3=Gastos (3.1 Operacionales, 3.2 No Operacionales), 4=Ingresos (4.1 Operacionales, 4.2 No Operacionales).
                </p>
                <div className="mt-2 text-xs text-indigo-700 grid grid-cols-2 gap-2">
                  <div><span className="font-medium">📊 Estructura:</span> 4 categorías con subcategorías</div>
                  <div><span className="font-medium">🔢 Códigos:</span> Jerárquicos (x.y.z)</div>
                  <div><span className="font-medium">📄 Niveles:</span> Hasta 4 niveles jerárquicos</div>
                  <div><span className="font-medium">🇨🇱 Compatible:</span> IFRS + SII Chile</div>
                </div>
                <div className="mt-3 p-3 bg-blue-100 rounded border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>💡 Template CSV:</strong> Descarga el template CSV con ejemplos y formato correcto para crear tu propio plan de cuentas. 
                    Incluye columnas: Código, Nombre, Tipo, Nivel, Es Detalle, Activa.
                  </p>
                </div>
              </div>
            </CardContent>
        </Card>

        {/* Panel de Configuración Centralizada de Cuentas */}
        <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-100 hover:border-purple-200 transition-colors">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-white" />
                </div>
                <span>Configuración Centralizada de Cuentas</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                  {centralizedConfigs.length} configuraciones
                </span>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowConfigForm(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                Nueva Configuración
              </Button>
            </CardTitle>
            <CardDescription>
              Centraliza la configuración de cuentas contables por módulo para asientos automáticos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingConfigs ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600">Cargando configuraciones...</span>
              </div>
            ) : centralizedConfigs.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay configuraciones</h3>
                <p className="text-gray-600 mb-4">
                  Crea tu primera configuración centralizada para automatizar asientos contables
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowConfigForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600"
                >
                  Crear Configuración
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {centralizedConfigs.map((config) => (
                  <div
                    key={config.id}
                    className="border-2 border-purple-100 rounded-xl p-6 hover:border-purple-200 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                          {config.module_name === 'rcv' && <FileText className="w-5 h-5 text-white" />}
                          {config.module_name === 'fixed_assets' && <Building2 className="w-5 h-5 text-white" />}
                          {config.module_name === 'payroll' && <DollarSign className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{config.display_name}</h3>
                          <p className="text-sm text-gray-600">
                            {config.module_name.toUpperCase()} - {config.transaction_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingConfig(config);
                            setShowConfigForm(true);
                          }}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCentralizedConfig(config.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Cuenta de Impuesto</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono text-green-700">{config.tax_account_code}</p>
                          <p className="text-xs text-green-600">{config.tax_account_name}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Cuenta de Utilidad</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono text-blue-700">{config.revenue_account_code}</p>
                          <p className="text-xs text-blue-600">{config.revenue_account_name}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">Cuenta de Activo</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono text-orange-700">{config.asset_account_code}</p>
                          <p className="text-xs text-orange-600">{config.asset_account_name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          config.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {config.is_active ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {config.created_at && new Date(config.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Información sobre configuración centralizada */}
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-900 mb-2">💡 ¿Cómo funciona la Configuración Centralizada?</h4>
                <div className="text-sm text-purple-800 space-y-1">
                  <p>• <strong>Cuenta de Impuesto:</strong> Se utiliza para registrar IVA y otros impuestos</p>
                  <p>• <strong>Cuenta de Utilidad:</strong> Registra ingresos por ventas o reducciones por compras</p>
                  <p>• <strong>Cuenta de Activo:</strong> Para clientes en ventas o inventario en compras</p>
                  <p>• <strong>Asientos Automáticos:</strong> El sistema usa estas cuentas al procesar transacciones de cada módulo</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>🔗 Integración con Libro Diario</span>
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>✅ <strong>Automatización Completa:</strong> Estas configuraciones se usan automáticamente en:</p>
                  <p className="ml-4">• <strong>Integración RCV:</strong> Al procesar registros de compra y venta</p>
                  <p className="ml-4">• <strong>Integración Activos Fijos:</strong> Al contabilizar adquisiciones</p>
                  <p className="ml-4">• <strong>Libro Diario:</strong> Para generar asientos contables automáticos</p>
                  <p className="mt-3">🎯 <strong>Sin configuración adicional:</strong> Una vez creada, la integración usa estas cuentas automáticamente.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Other Configuration Options Modernizadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white/90 backdrop-blur-sm border-2 border-green-100 hover:border-green-200 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Datos de la Empresa</h3>
              </div>
              <p className="text-sm text-gray-600">Configura la información básica de tu empresa y parámetros fiscales</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Folios y Documentos</h3>
              </div>
              <p className="text-sm text-gray-600">Gestiona folios de facturas y otros documentos tributarios</p>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-100 hover:border-purple-200 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900">Usuarios y Permisos</h3>
              </div>
              <p className="text-sm text-gray-600">Administra usuarios y sus permisos de acceso al sistema</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
      {/* Modal de Configuración Centralizada */}
      {showConfigForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <Target className="w-6 h-6 text-purple-600" />
                <span>{editingConfig ? 'Editar Configuración' : 'Nueva Configuración Centralizada'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowConfigForm(false);
                  setEditingConfig(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                
                const config = {
                  id: editingConfig?.id,
                  module_name: formData.get('module_name') as string,
                  transaction_type: formData.get('transaction_type') as string,
                  display_name: formData.get('display_name') as string,
                  tax_account_code: formData.get('tax_account_code') as string,
                  tax_account_name: formData.get('tax_account_name') as string,
                  revenue_account_code: formData.get('revenue_account_code') as string,
                  revenue_account_name: formData.get('revenue_account_name') as string,
                  asset_account_code: formData.get('asset_account_code') as string,
                  asset_account_name: formData.get('asset_account_name') as string,
                  is_active: (formData.get('is_active') as string) === 'true'
                };

                saveCentralizedConfig(config);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Módulo *
                  </label>
                  <select
                    name="module_name"
                    required
                    defaultValue={editingConfig?.module_name || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Seleccionar módulo...</option>
                    <option value="rcv">📄 RCV (Registro de Compra y Venta)</option>
                    <option value="fixed_assets">🏢 Activos Fijos</option>
                    <option value="payroll">💰 Remuneraciones</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Transacción *
                  </label>
                  <select
                    name="transaction_type"
                    required
                    defaultValue={editingConfig?.transaction_type || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Seleccionar tipo...</option>
                    <option value="sales">Ventas</option>
                    <option value="purchases">Compras</option>
                    <option value="acquisition">Adquisición</option>
                    <option value="depreciation">Depreciación</option>
                    <option value="salary">Sueldos</option>
                    <option value="benefits">Beneficios</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Descriptivo *
                </label>
                <input
                  type="text"
                  name="display_name"
                  required
                  defaultValue={editingConfig?.display_name || ''}
                  placeholder="ej: RCV Ventas IVA 19%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Selector de Cuenta de Impuesto */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-green-800 mb-2 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Cuenta de Impuesto (IVA, etc.) *</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    name="tax_account_code"
                    required
                    defaultValue={editingConfig?.tax_account_code || ''}
                    onChange={(e) => {
                      const selectedAccount = getDetailAccounts().find(acc => acc.code === e.target.value);
                      const nameInput = document.querySelector('[name="tax_account_name"]') as HTMLInputElement;
                      if (nameInput && selectedAccount) {
                        nameInput.value = selectedAccount.name;
                      }
                    }}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {getDetailAccounts()
                      .filter(acc => acc.account_type === 'liability' || acc.account_type === 'asset')
                      .map((account) => (
                      <option key={account.id} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="tax_account_name"
                    required
                    defaultValue={editingConfig?.tax_account_name || ''}
                    placeholder="Nombre de la cuenta"
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    readOnly
                  />
                </div>
              </div>

              {/* Selector de Cuenta de Utilidad */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-blue-800 mb-2 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Cuenta de Utilidad/Ingresos *</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    name="revenue_account_code"
                    required
                    defaultValue={editingConfig?.revenue_account_code || ''}
                    onChange={(e) => {
                      const selectedAccount = getDetailAccounts().find(acc => acc.code === e.target.value);
                      const nameInput = document.querySelector('[name="revenue_account_name"]') as HTMLInputElement;
                      if (nameInput && selectedAccount) {
                        nameInput.value = selectedAccount.name;
                      }
                    }}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {getDetailAccounts()
                      .filter(acc => acc.account_type === 'income' || acc.account_type === 'expense')
                      .map((account) => (
                      <option key={account.id} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="revenue_account_name"
                    required
                    defaultValue={editingConfig?.revenue_account_name || ''}
                    placeholder="Nombre de la cuenta"
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    readOnly
                  />
                </div>
              </div>

              {/* Selector de Cuenta de Activo */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-orange-800 mb-2 flex items-center space-x-2">
                  <Building2 className="w-4 h-4" />
                  <span>Cuenta de Activo (Clientes, Inventario, etc.) *</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    name="asset_account_code"
                    required
                    defaultValue={editingConfig?.asset_account_code || ''}
                    onChange={(e) => {
                      const selectedAccount = getDetailAccounts().find(acc => acc.code === e.target.value);
                      const nameInput = document.querySelector('[name="asset_account_name"]') as HTMLInputElement;
                      if (nameInput && selectedAccount) {
                        nameInput.value = selectedAccount.name;
                      }
                    }}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {getDetailAccounts()
                      .filter(acc => acc.account_type === 'asset')
                      .map((account) => (
                      <option key={account.id} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="asset_account_name"
                    required
                    defaultValue={editingConfig?.asset_account_name || ''}
                    placeholder="Nombre de la cuenta"
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    readOnly
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active"
                  value="true"
                  defaultChecked={editingConfig?.is_active ?? true}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-3"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Configuración activa (se usará para asientos automáticos)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowConfigForm(false);
                    setEditingConfig(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingConfig ? 'Actualizar' : 'Crear'} Configuración
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    
    {/* Modal de Edición */}
      {editingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar Cuenta</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  defaultValue={editingAccount.code}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  defaultValue={editingAccount.name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cuenta</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="asset">Activo</option>
                  <option value="liability">Pasivo</option>
                  <option value="equity">Patrimonio</option>
                  <option value="income">Ingreso</option>
                  <option value="expense">Gasto</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_detail"
                  className="mr-2"
                  defaultChecked={editingAccount.is_detail}
                />
                <label htmlFor="is_detail" className="text-sm text-gray-700">
                  Es cuenta de detalle (permite asientos)
                </label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingAccount(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}