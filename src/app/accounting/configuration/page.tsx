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
import { Button, Card } from '@/components/ui';
import { exportToCSV, exportToJSON, parseCSV, downloadFile } from '@/lib/chartOfAccounts';

import { Account } from '@/types';

// Datos demo del plan de cuentas
const demoAccounts: Account[] = [
  {
    id: '1',
    code: '1',
    name: 'ACTIVOS',
    account_type: 'asset',
    level: 1,
    is_active: true,
    is_detail: false,
    children: [
      {
        id: '1.1',
        code: '1.1',
        name: 'ACTIVOS CORRIENTES',
        account_type: 'asset',
        parent_id: '1',
        level: 2,
        is_active: true,
        is_detail: false,
        children: [
          {
            id: '1.1.01',
            code: '1.1.01',
            name: 'Efectivo y Equivalentes al Efectivo',
            account_type: 'asset',
            parent_id: '1.1',
            level: 3,
            is_active: true,
            is_detail: false,
            children: [
              {
                id: '1.1.01.001',
                code: '1.1.01.001',
                name: 'Caja',
                account_type: 'asset',
                parent_id: '1.1.01',
                level: 4,
                is_active: true,
                is_detail: true
              },
              {
                id: '1.1.01.002',
                code: '1.1.01.002',
                name: 'Banco Estado - Cuenta Corriente',
                account_type: 'asset',
                parent_id: '1.1.01',
                level: 4,
                is_active: true,
                is_detail: true
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: '2',
    code: '2',
    name: 'PASIVOS',
    account_type: 'liability',
    level: 1,
    is_active: true,
    is_detail: false,
    children: [
      {
        id: '2.1',
        code: '2.1',
        name: 'PASIVOS CORRIENTES',
        account_type: 'liability',
        parent_id: '2',
        level: 2,
        is_active: true,
        is_detail: false
      }
    ]
  },
  {
    id: '4',
    code: '4',
    name: 'INGRESOS',
    account_type: 'income',
    level: 1,
    is_active: true,
    is_detail: false,
    children: [
      {
        id: '4.1',
        code: '4.1',
        name: 'INGRESOS OPERACIONALES',
        account_type: 'income',
        parent_id: '4',
        level: 2,
        is_active: true,
        is_detail: false,
        children: [
          {
            id: '4.1.01',
            code: '4.1.01',
            name: 'Ventas de Mercaderías',
            account_type: 'income',
            parent_id: '4.1',
            level: 3,
            is_active: true,
            is_detail: true
          }
        ]
      }
    ]
  }
];

export default function ConfigurationPage() {
  const [accounts, setAccounts] = useState<Account[]>(demoAccounts);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '1.1', '4']));
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/accounting" className="text-gray-600 hover:text-gray-900 mr-4">
                ← Volver a Contabilidad
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Settings className="mr-2 h-6 w-6" />
                Configuración
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Plan de Cuentas Section */}
          <Card className="mb-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Plan de Cuentas IFRS
                </h2>
                <div className="flex space-x-2">
                  <div className="relative group">
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Download className="w-4 h-4" />}
                    >
                      Exportar
                    </Button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <button
                        onClick={() => {
                          const csv = exportToCSV(accounts);
                          downloadFile(csv, 'plan_de_cuentas.csv', 'text/csv');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Exportar como CSV
                      </button>
                      <button
                        onClick={() => {
                          const json = exportToJSON(accounts);
                          downloadFile(json, 'plan_de_cuentas.json', 'application/json');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Exportar como JSON
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
                  >
                    Importar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                    onClick={() => setShowAddForm(true)}
                  >
                    Nueva Cuenta
                  </Button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Buscar por código o nombre..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Chart of Accounts Tree */}
              <div className="border border-gray-200 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                {accounts.map(account => renderAccount(account))}
              </div>

              {/* Info Box */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Plan de Cuentas Demostrativo:</strong> Este es un plan de cuentas basado en IFRS para PyMEs chilenas. 
                  Puedes editarlo según las necesidades de tu empresa.
                </p>
              </div>
            </div>
          </Card>

          {/* Other Configuration Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="font-semibold text-gray-900 mb-2">Datos de la Empresa</h3>
              <p className="text-sm text-gray-600">Configura la información básica de tu empresa</p>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="font-semibold text-gray-900 mb-2">Folios y Documentos</h3>
              <p className="text-sm text-gray-600">Gestiona folios de facturas y otros documentos</p>
            </Card>

            <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
              <h3 className="font-semibold text-gray-900 mb-2">Usuarios y Permisos</h3>
              <p className="text-sm text-gray-600">Administra usuarios y sus permisos de acceso</p>
            </Card>
          </div>
        </div>
      </div>

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