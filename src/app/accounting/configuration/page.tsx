'use client';

import { useState } from 'react';
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
  X
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Header } from '@/components/layout';
import { exportToCSV, exportToJSON, parseCSV, downloadFile, generateCSVTemplate } from '@/lib/chartOfAccounts';
import { planDeCuentasChilenoFinal } from '@/lib/planDeCuentasChilenoFinal';
import { Account } from '@/types';


export default function ConfigurationPage() {
  const [accounts, setAccounts] = useState<Account[]>(planDeCuentasChilenoFinal);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '1.1', '1.2', '2', '2.1', '2.2', '2.3', '3', '3.1', '3.2', '4', '4.1', '4.2']));
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

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