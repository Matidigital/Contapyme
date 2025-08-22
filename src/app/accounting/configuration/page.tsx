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
  Building2,
  Users,
  UserCheck,
  Building,
  Shield
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Header } from '@/components/layout';
import RCVTaxConfigModal from '@/components/accounting/RCVTaxConfigModal';
import TaxConfigurationTable from '@/components/accounting/TaxConfigurationTableFixed';


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

// Interface para entidades RCV
interface RCVEntity {
  id?: string;
  company_id: string;
  entity_name: string;
  entity_rut: string;
  entity_business_name?: string;
  entity_type: 'supplier' | 'customer' | 'both';
  account_code: string;
  account_name: string;
  account_type?: string;
  default_tax_rate?: number;
  is_tax_exempt?: boolean;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface ChartAccount {
  id: string;
  code: string;
  name: string;
  level_type: string;
  account_type: string;
  parent_code?: string;
  is_active: boolean;
  created_at: string;
}

export default function ConfigurationPage() {
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<ChartAccount[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '1.1', '1.2', '2', '2.1', '2.2', '2.3', '3', '3.1', '3.2', '4', '4.1', '4.2']));
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAccount, setEditingAccount] = useState<ChartAccount | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountFormData, setAccountFormData] = useState({
    code: '',
    name: '',
    level_type: '1er Nivel',
    account_type: 'ACTIVO',
    parent_code: '',
    is_active: true
  });

  // Función para formatear automáticamente el código de cuenta (formato compatible con BD existente)
  const formatAccountCode = (input: string, preserveOriginal = false) => {
    // Si queremos preservar el formato original (para edición), solo limpiar algunos caracteres
    if (preserveOriginal) {
      // Permitir números, puntos y espacios para edición más flexible
      return input.replace(/[^\d\.\s]/g, '').trim();
    }
    
    // Remover todos los caracteres que no sean números
    const numbersOnly = input.replace(/[^\d]/g, '');
    
    console.log(`🔍 Formateando: "${input}" → numbersOnly: "${numbersOnly}" (${numbersOnly.length} dígitos)`);
    
    // Si está vacío, retornar vacío
    if (numbersOnly.length === 0) return '';
    
    // Formatear según la longitud para mantener compatibilidad con cuentas existentes
    if (numbersOnly.length === 1) {
      console.log('📝 Caso 1 dígito:', numbersOnly);
      return numbersOnly; // "1"
    } else if (numbersOnly.length === 2) {
      const result = `${numbersOnly[0]}.${numbersOnly[1]}`;
      console.log('📝 Caso 2 dígitos:', result);
      return result; // "1.2"
    } else if (numbersOnly.length === 3) {
      const result = `${numbersOnly[0]}.${numbersOnly[1]}.${numbersOnly[2]}`;
      console.log('📝 Caso 3 dígitos:', result);
      return result; // "1.2.3"
    } else if (numbersOnly.length === 4) {
      const result = `${numbersOnly[0]}.${numbersOnly[1]}.${numbersOnly[2]}.${numbersOnly[3]}`;
      console.log('📝 Caso 4 dígitos:', result);
      return result; // "1.2.3.4"
    } else if (numbersOnly.length >= 5) {
      console.log('📝 Caso 5+ dígitos - Iniciando formateo avanzado...');
      
      // Para números de 5+ dígitos: 1er, 2do, 3er nivel, resto como código detalle
      const first = numbersOnly[0];   // Nivel 1
      const second = numbersOnly[1];  // Nivel 2  
      const third = numbersOnly[2];   // Nivel 3
      const detail = numbersOnly.slice(3); // Resto
      
      console.log(`📝 Desglose: 1er="${first}", 2do="${second}", 3er="${third}", detalle="${detail}"`);
      
      // Para el código detalle, siempre mantener al menos 3 dígitos
      let finalDetail;
      if (detail.length <= 3) {
        finalDetail = detail.padStart(3, '0'); // "05" → "005"
      } else {
        // Si tiene más de 3 dígitos, mantener todos (máximo 6)
        finalDetail = detail.substring(0, 6);
      }
      
      const result = `${first}.${second}.${third}.${finalDetail}`;
      console.log(`📝 Resultado final: "${result}"`);
      return result;
    }
    
    return numbersOnly;
  };

  // Función para formatear código manteniendo formato libre para edición
  const formatAccountCodeForEditing = (input: string) => {
    // En modo edición, ser MUY permisivo - solo quitar caracteres obviamente inválidos
    let cleaned = input.replace(/[^\d\.]/g, '');
    
    // Evitar múltiples puntos consecutivos
    cleaned = cleaned.replace(/\.{2,}/g, '.');
    
    // Evitar punto al inicio
    if (cleaned.startsWith('.')) {
      cleaned = cleaned.substring(1);
    }
    
    // En modo edición, permitir casi cualquier cosa válida
    return cleaned;
  };

  // Función para detectar automáticamente el padre correcto
  const getCorrectParent = (code: string) => {
    const parts = code.split('.');
    if (parts.length <= 1) return ''; // No tiene padre
    
    // Para cuentas Imputable (4 niveles), buscar el 2do nivel que exista
    if (parts.length >= 4) {
      const secondLevel = `${parts[0]}.${parts[1]}`;
      if (accounts.find(acc => acc.code === secondLevel)) {
        return secondLevel;
      }
    }
    
    // Para 3er nivel, buscar el 2do nivel
    if (parts.length === 3) {
      const secondLevel = `${parts[0]}.${parts[1]}`;
      if (accounts.find(acc => acc.code === secondLevel)) {
        return secondLevel;
      }
    }
    
    // Para 2do nivel, buscar el 1er nivel
    if (parts.length === 2) {
      const firstLevel = parts[0];
      if (accounts.find(acc => acc.code === firstLevel)) {
        return firstLevel;
      }
    }
    
    return '';
  };

  // Estado para detectar si el usuario está editando manualmente
  const [isManualEditing, setIsManualEditing] = useState(false);

  // Handler mejorado para cambios en el código de cuenta
  const handleAccountCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const currentValue = accountFormData.code;
    
    // Detectar si el usuario está borrando o editando manualmente
    const isDeleting = inputValue.length < currentValue.length;
    const isTypingOnlyNumbers = /^\d+$/.test(inputValue); // Solo números sin puntos
    
    console.log('🔧 Debug formateo:', {
      inputValue,
      currentValue,
      isDeleting,
      isTypingOnlyNumbers,
      isManualEditing
    });
    
    let formattedCode;
    
    // SOLO activar modo manual cuando está BORRANDO o ya está en modo manual
    // Si está escribiendo solo números, SIEMPRE usar formateo automático
    if (isDeleting && !isTypingOnlyNumbers) {
      setIsManualEditing(true);
      formattedCode = formatAccountCodeForEditing(inputValue);
      console.log('📝 Modo manual (borrando):', formattedCode);
    } else if (isTypingOnlyNumbers) {
      // Si está escribiendo solo números, FORZAR modo automático
      setIsManualEditing(false);
      formattedCode = formatAccountCode(inputValue);
      console.log('🤖 Modo automático (números):', formattedCode);
    } else {
      // Para otros casos, mantener el modo actual
      if (isManualEditing) {
        formattedCode = formatAccountCodeForEditing(inputValue);
        console.log('📝 Modo manual (mantenido):', formattedCode);
      } else {
        formattedCode = formatAccountCode(inputValue);
        console.log('🤖 Modo automático (mantenido):', formattedCode);
      }
    }
    
    // Determinar el nivel automáticamente basado en la estructura del código
    let autoLevel = '1er Nivel';
    const numbersOnly = formattedCode.replace(/[^\d]/g, '');
    
    if (numbersOnly.length === 1) {
      autoLevel = '1er Nivel';  // ej: 1
    } else if (numbersOnly.length === 2) {
      autoLevel = '2do Nivel';  // ej: 1.1
    } else if (numbersOnly.length === 3) {
      autoLevel = '3er Nivel';  // ej: 1.1.1
    } else if (numbersOnly.length === 4) {
      autoLevel = '3er Nivel';  // ej: 1.1.1.1 (todavía 3er nivel)
    } else if (numbersOnly.length >= 5) {
      autoLevel = 'Imputable';  // ej: 1.2.1.001 (cuenta detalle)
    }
    
    // Detectar automáticamente el padre correcto
    const autoParent = getCorrectParent(formattedCode);
    
    setAccountFormData({
      ...accountFormData, 
      code: formattedCode,
      level_type: autoLevel,
      parent_code: autoParent
    });
  };
  
  // Estados para configuración centralizada
  const [centralizedConfigs, setCentralizedConfigs] = useState<CentralizedAccountConfig[]>([]);
  const [editingConfig, setEditingConfig] = useState<CentralizedAccountConfig | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string>(''); // Estado para el módulo seleccionado
  const [showRCVTaxModal, setShowRCVTaxModal] = useState(false); // Modal específico para RCV

  // Estados para entidades RCV
  const [rcvEntities, setRcvEntities] = useState<RCVEntity[]>([]);
  const [editingEntity, setEditingEntity] = useState<RCVEntity | null>(null);
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [entitySearchTerm, setEntitySearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [systemDiagnostics, setSystemDiagnostics] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const companyId = '8033ee69-b420-4d91-ba0e-482f46cd6fce'; // TODO: Get from auth

  // Cargar configuraciones centralizadas, entidades RCV y cuentas
  useEffect(() => {
    loadChartOfAccounts();
    loadCentralizedConfigs();
    loadRCVEntities();
    loadSystemDiagnostics();
  }, []);

  // Cargar plan de cuentas desde la API
  const loadChartOfAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const response = await fetch('/api/chart-of-accounts');
      const data = await response.json();

      if (data.accounts) {
        setAccounts(data.accounts);
        setFilteredAccounts(data.accounts);
      } else {
        console.error('Error loading accounts:', data.message);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Guardar o actualizar cuenta
  const saveAccount = async (accountData: Partial<ChartAccount>) => {
    try {
      // Validación del lado del cliente para códigos duplicados
      if (!editingAccount) {
        const existingAccount = accounts.find(acc => acc.code === accountData.code);
        if (existingAccount) {
          // Generar sugerencias de códigos disponibles
          const baseCode = accountData.code.split('.').slice(0, -1).join('.');
          const lastPart = parseInt(accountData.code.split('.').pop() || '1');
          const suggestions = [];
          
          for (let i = 1; i <= 5; i++) {
            const newLastPart = String(lastPart + i).padStart(3, '0');
            const suggestedCode = baseCode ? `${baseCode}.${newLastPart}` : newLastPart;
            if (!accounts.find(acc => acc.code === suggestedCode)) {
              suggestions.push(suggestedCode);
            }
          }
          
          alert(`❌ Error: Ya existe una cuenta con el código "${accountData.code}"\n\n💡 Códigos sugeridos disponibles:\n${suggestions.slice(0, 3).map(code => `• ${code}`).join('\n')}\n\nCuenta existente:\n• ${existingAccount.code} - ${existingAccount.name}`);
          return;
        }
      }

      const isEditing = editingAccount !== null;
      const url = isEditing 
        ? `/api/chart-of-accounts/${editingAccount.id}`
        : '/api/chart-of-accounts';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log('📤 Enviando datos de cuenta:', {
        url,
        method,
        accountData,
        isEditing,
        editingAccount: editingAccount?.id
      });

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        await loadChartOfAccounts();
        setShowAddForm(false);
        setEditingAccount(null);
        setAccountFormData({
          code: '',
          name: '',
          level_type: '1er Nivel',
          account_type: 'ACTIVO',
          parent_code: '',
          is_active: true
        });
        alert(`✅ ${result.message}`);
      } else {
        // Manejo específico de errores HTTP
        if (response.status === 409) {
          alert(`❌ Código duplicado: Ya existe una cuenta con el código "${accountData.code}"\n\n💡 Sugerencia: Usa un código diferente como:\n• ${accountData.code}.001\n• ${accountData.code}1\n• Revisa el plan existente para encontrar el próximo código disponible`);
        } else if (response.status === 400) {
          alert(`❌ Datos inválidos: ${result.error}\n\n💡 Verifica que todos los campos requeridos estén completos y en el formato correcto.`);
        } else {
          alert(`❌ Error ${response.status}: ${result.error || 'Error desconocido'}`);
        }
      }
    } catch (error) {
      console.error('Error saving account:', error);
      alert('❌ Error de conexión: No se pudo guardar la cuenta.\n\n💡 Verifica tu conexión a internet e intenta nuevamente.');
    }
  };

  // Eliminar cuenta
  const deleteAccount = async (account: ChartAccount) => {
    if (!confirm(`¿Está seguro de desactivar la cuenta ${account.code} - ${account.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/chart-of-accounts?id=${account.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await loadChartOfAccounts();
        alert(result.message);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error al eliminar cuenta');
    }
  };

  // Exportar cuentas
  const exportAccounts = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      params.append('include_inactive', 'false');

      const response = await fetch(`/api/chart-of-accounts/export?${params.toString()}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `plan_cuentas_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const error = await response.json();
        alert('Error al exportar: ' + error.error);
      }
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar cuentas');
    }
  };

  // Importar cuentas
  const importAccounts = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/chart-of-accounts/import', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        await loadChartOfAccounts();
        alert(`✅ Importación exitosa: ${result.message}`);
      } else {
        alert('❌ Error en importación: ' + result.error);
      }
    } catch (error) {
      console.error('Error importing:', error);
      alert('Error al importar archivo');
    }
  };

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

  // Funciones para entidades RCV
  const loadRCVEntities = async () => {
    try {
      setLoadingEntities(true);
      const response = await fetch(`/api/accounting/rcv-entities?company_id=${companyId}&entity_type=${entityTypeFilter}&search=${entitySearchTerm}`);
      const data = await response.json();

      if (data.success) {
        setRcvEntities(data.data);
      }
    } catch (error) {
      console.error('Error loading RCV entities:', error);
    } finally {
      setLoadingEntities(false);
    }
  };

  const saveRCVEntity = async (entity: Partial<RCVEntity>) => {
    try {
      const method = entity.id ? 'PUT' : 'POST';
      const response = await fetch('/api/accounting/rcv-entities', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          ...entity
        }),
      });

      const result = await response.json();

      if (result.success) {
        await loadRCVEntities();
        setShowEntityForm(false);
        setEditingEntity(null);
        alert(`✅ Entidad "${entity.entity_name}" creada exitosamente`);
      } else {
        // Mostrar mensaje de error más específico
        if (result.error?.includes('Tabla') && result.error?.includes('no existe')) {
          alert(`❌ ${result.error}\n\n💡 Solución: Ve al botón "🔍 Diagnóstico" para ver los pasos de configuración.`);
          setShowDiagnostics(true);
          await loadSystemDiagnostics();
        } else {
          alert(`❌ Error: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error saving RCV entity:', error);
      alert('Error guardando entidad');
    }
  };

  const deleteRCVEntity = async (entityId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta entidad? Esto puede afectar integraciones automáticas del RCV.')) return;

    try {
      const response = await fetch(`/api/accounting/rcv-entities/${entityId}?company_id=${companyId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await loadRCVEntities();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting RCV entity:', error);
      alert('Error eliminando entidad');
    }
  };

  const loadSystemDiagnostics = async () => {
    try {
      const response = await fetch('/api/accounting/rcv-entities/diagnostics');
      const data = await response.json();
      if (data.success) {
        setSystemDiagnostics(data.data);
      }
    } catch (error) {
      console.error('Error loading diagnostics:', error);
    }
  };

  // Recargar entidades cuando cambian los filtros
  useEffect(() => {
    if (entitySearchTerm || entityTypeFilter !== 'all') {
      const timeoutId = setTimeout(() => {
        loadRCVEntities();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      loadRCVEntities();
    }
  }, [entitySearchTerm, entityTypeFilter]);

  // Filtrar cuentas imputables para los selectores
  const getDetailAccounts = () => {
    return accounts
      .filter(account => account.level_type === 'Imputable' && account.is_active)
      .sort((a, b) => a.code.localeCompare(b.code));
  };

  // Aplicar filtros de búsqueda
  useEffect(() => {
    let filtered = [...accounts];

    if (searchTerm) {
      filtered = filtered.filter(account => 
        account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAccounts(filtered);
  }, [accounts, searchTerm]);

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

  // Renderizar cuenta en formato de tabla
  const renderAccountRow = (account: ChartAccount) => {
    const accountTypeColors = {
      'ACTIVO': 'text-blue-600 bg-blue-50',
      'PASIVO': 'text-red-600 bg-red-50',
      'PATRIMONIO': 'text-purple-600 bg-purple-50',
      'INGRESO': 'text-green-600 bg-green-50',
      'GASTO': 'text-orange-600 bg-orange-50'
    };

    const levelColors = {
      '1er Nivel': 'text-gray-800 bg-gray-100',
      '2do Nivel': 'text-amber-800 bg-amber-100',
      '3er Nivel': 'text-purple-800 bg-purple-100',
      'Imputable': 'text-blue-800 bg-blue-100'
    };

    return (
      <tr key={account.id} className="border-t border-gray-200 hover:bg-gray-50">
        <td className="py-3 px-4">
          <span className="font-mono text-sm font-medium text-gray-900">
            {account.code}
          </span>
        </td>
        <td className="py-3 px-4">
          <div className="font-medium text-gray-900">{account.name}</div>
        </td>
        <td className="py-3 px-4">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${levelColors[account.level_type] || 'bg-gray-100 text-gray-800'}`}>
            {account.level_type}
          </span>
        </td>
        <td className="py-3 px-4">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${accountTypeColors[account.account_type] || 'bg-gray-100 text-gray-800'}`}>
            {account.account_type}
          </span>
        </td>
        <td className="py-3 px-4">
          <span className="text-sm text-gray-600 font-mono">
            {account.parent_code || '-'}
          </span>
        </td>
        <td className="py-3 px-4">
          <span className={`px-2 py-1 text-xs rounded-full font-medium ${
            account.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {account.is_active ? 'Activa' : 'Inactiva'}
          </span>
        </td>
        <td className="py-3 px-4 text-right">
          <div className="flex items-center justify-end space-x-2">
            <button 
              onClick={() => {
                setEditingAccount(account);
                setShowAddForm(true);
                setAccountFormData({
                  code: account.code,
                  name: account.name,
                  level_type: account.level_type,
                  account_type: account.account_type,
                  parent_code: account.parent_code || '',
                  is_active: account.is_active
                });
              }}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => deleteAccount(account)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
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
                <span className="text-sm text-green-600">{loadingAccounts ? 'Cargando...' : 'Sistema activo'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative group">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-4 h-4" />}
                    className="border-green-200 hover:bg-green-50 hover:border-green-300"
                    disabled={loadingAccounts}
                  >
                    Exportar
                  </Button>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border-2 border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <button
                      onClick={() => exportAccounts('csv')}
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors rounded-t-xl"
                    >
                      📄 Exportar como CSV
                    </button>
                    <button
                      onClick={() => exportAccounts('json')}
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors rounded-b-xl"
                    >
                      📁 Exportar como JSON
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
                        await importAccounts(file);
                      }
                    };
                    input.click();
                  }}
                  className="border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                  disabled={loadingAccounts}
                >
                  Importar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setShowAddForm(true);
                    setAccountFormData({
                      code: '',
                      name: '',
                      level_type: '1er Nivel',
                      account_type: 'ACTIVO',
                      parent_code: '',
                      is_active: true
                    });
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={loadingAccounts}
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
                  id="search-accounts"
                  name="search-accounts"
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

            {/* Chart of Accounts Table */}
            <div className="border-2 border-blue-100 rounded-xl overflow-hidden bg-gradient-to-br from-white to-blue-50/30">
              {loadingAccounts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Cargando plan de cuentas...</span>
                </div>
              ) : filteredAccounts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron cuentas</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'No hay cuentas que coincidan con tu búsqueda' : 'No hay cuentas configuradas en el sistema'}
                  </p>
                  {!searchTerm && (
                    <Button
                      variant="primary"
                      onClick={() => setShowAddForm(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      Crear Primera Cuenta
                    </Button>
                  )}
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-50 to-purple-50 sticky top-0">
                      <tr>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700 border-b border-blue-200">Código</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700 border-b border-blue-200">Nombre</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700 border-b border-blue-200">Nivel</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700 border-b border-blue-200">Tipo</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700 border-b border-blue-200">Padre</th>
                        <th className="text-left py-4 px-4 font-semibold text-gray-700 border-b border-blue-200">Estado</th>
                        <th className="text-right py-4 px-4 font-semibold text-gray-700 border-b border-blue-200">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.map(account => renderAccountRow(account))}
                    </tbody>
                  </table>
                </div>
              )}
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

        {/* Configuración de Impuestos RCV */}
        <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-100 hover:border-purple-200 transition-colors">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span>Configuración de Impuestos para RCV</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                Tabla Directa
              </span>
            </CardTitle>
            <CardDescription>
              Configuración directa de cuentas contables para cada tipo de impuesto chileno
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TaxConfigurationTable 
              companyId={companyId}
              accounts={getDetailAccounts()}
            />
          </CardContent>
        </Card>

        {/* Sección de Entidades RCV */}
        <Card className="bg-white/90 backdrop-blur-sm border-2 border-emerald-100 hover:border-emerald-200 transition-colors">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span>Entidades Registradas RCV</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                  {rcvEntities.length} entidades
                </span>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowDiagnostics(!showDiagnostics)}
                  variant="outline"
                  size="sm"
                  className="border-yellow-200 hover:bg-yellow-50 text-yellow-700"
                >
                  🔍 {showDiagnostics ? 'Ocultar' : 'Diagnóstico'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowEntityForm(true)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  Nueva Entidad
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Base de datos de proveedores y clientes con cuentas contables asociadas para integración automática del RCV
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Panel de Diagnóstico */}
            {showDiagnostics && systemDiagnostics && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-yellow-800 flex items-center space-x-2">
                    <span>🔍 Diagnóstico del Sistema</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      systemDiagnostics.summary.ready 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {systemDiagnostics.summary.status}
                    </span>
                  </h4>
                  <button
                    onClick={() => setShowDiagnostics(false)}
                    className="text-yellow-600 hover:text-yellow-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {systemDiagnostics.summary.issues.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-yellow-800">
                      <strong>Problemas detectados:</strong>
                    </div>
                    {systemDiagnostics.summary.issues.map((issue, index) => (
                      <div key={index} className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200">
                        {issue}
                      </div>
                    ))}
                  </div>
                )}

                {systemDiagnostics.summary.next_steps.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm font-medium text-yellow-800">
                      Pasos a seguir:
                    </div>
                    {systemDiagnostics.summary.next_steps.map((step, index) => (
                      <div key={index} className="text-sm text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                        {step}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-600">
                  Ver archivo <strong>CONFIGURAR_SUPABASE.md</strong> para instrucciones completas
                </div>
              </div>
            )}

            {/* Filtros y búsqueda para entidades */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o RUT..."
                    className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300 transition-all duration-300"
                    value={entitySearchTerm}
                    onChange={(e) => setEntitySearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={entityTypeFilter}
                  onChange={(e) => setEntityTypeFilter(e.target.value)}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-300"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="supplier">🏢 Proveedores</option>
                  <option value="customer">👤 Clientes</option>
                  <option value="both">🔄 Ambos</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Total: {rcvEntities.length}</span>
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="text-sm text-emerald-600">Base de datos activa</span>
              </div>
            </div>

            {loadingEntities ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <span className="ml-3 text-gray-600">Cargando entidades...</span>
              </div>
            ) : rcvEntities.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay entidades registradas</h3>
                <p className="text-gray-600 mb-4">
                  Registra proveedores y clientes con sus cuentas contables para automatizar la integración del RCV
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowEntityForm(true)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600"
                >
                  Registrar Primera Entidad
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {rcvEntities.map((entity) => (
                  <div
                    key={entity.id}
                    className="border-2 border-emerald-100 rounded-xl p-4 hover:border-emerald-200 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                          {entity.entity_type === 'supplier' && <Building className="w-4 h-4 text-white" />}
                          {entity.entity_type === 'customer' && <UserCheck className="w-4 h-4 text-white" />}
                          {entity.entity_type === 'both' && <Users className="w-4 h-4 text-white" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{entity.entity_name}</h3>
                          <p className="text-xs text-gray-600">{entity.entity_rut}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingEntity(entity);
                            setShowEntityForm(true);
                          }}
                          className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteRCVEntity(entity.id!)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Tipo:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entity.entity_type === 'supplier' 
                            ? 'bg-blue-100 text-blue-800' 
                            : entity.entity_type === 'customer'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {entity.entity_type === 'supplier' && '🏢 Proveedor'}
                          {entity.entity_type === 'customer' && '👤 Cliente'}
                          {entity.entity_type === 'both' && '🔄 Ambos'}
                        </span>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="text-xs text-gray-500 mb-1">Cuenta Asociada:</div>
                        <div className="font-mono text-xs text-gray-800">{entity.account_code}</div>
                        <div className="text-xs text-gray-600">{entity.account_name}</div>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">IVA:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          entity.is_tax_exempt 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {entity.is_tax_exempt ? 'Exento' : `${entity.default_tax_rate}%`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          entity.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {entity.is_active ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                        {entity.created_at && (
                          <span className="text-gray-400">
                            {new Date(entity.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Información sobre entidades RCV */}
            <div className="mt-6 space-y-4">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h4 className="font-medium text-emerald-900 mb-2 flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>🎯 ¿Para qué sirven las Entidades RCV?</span>
                </h4>
                <div className="text-sm text-emerald-800 space-y-1">
                  <p>• <strong>Integración Automática:</strong> Al procesar el RCV, el sistema busca automáticamente la cuenta contable asociada</p>
                  <p>• <strong>Consistencia:</strong> Evita errores manuales y garantiza que cada proveedor/cliente use siempre la misma cuenta</p>
                  <p>• <strong>Eficiencia:</strong> Acelera la generación de asientos contables desde registros RCV</p>
                  <p>• <strong>Configuración por Entidad:</strong> Permite configurar IVA exento o tasas especiales por proveedor/cliente</p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>🔄 Flujo de Integración RCV → Libro Diario</span>
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>1. <strong>Upload RCV:</strong> Se sube archivo CSV con registros de compra/venta</p>
                  <p>2. <strong>Búsqueda Automática:</strong> Sistema busca cada RUT en esta base de datos</p>
                  <p>3. <strong>Asiento Automático:</strong> Si encuentra la entidad, usa su cuenta contable configurada</p>
                  <p>4. <strong>Validación:</strong> Si no encuentra el RUT, solicita configuración manual</p>
                  <p className="mt-3 font-medium">🎯 <strong>Resultado:</strong> Integración 100% automática para entidades registradas</p>
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
      {/* Modal de Configuración de Impuestos RCV */}
      <RCVTaxConfigModal
        isOpen={showRCVTaxModal}
        onClose={() => {
          setShowRCVTaxModal(false);
          setEditingConfig(null);
        }}
        editingConfig={editingConfig}
        accounts={getDetailAccounts()}
        onSave={saveCentralizedConfig}
      />

      {/* Modal de Configuración Centralizada General */}
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
                    onChange={(e) => {
                      if (e.target.value === 'rcv') {
                        setShowConfigForm(false);
                        setShowRCVTaxModal(true);
                      }
                    }}
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
    
      {/* Modal de Crear/Editar Cuenta */}
      {(showAddForm || editingAccount) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <span>{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingAccount(null);
                  setAccountFormData({
                    code: '',
                    name: '',
                    level_type: '1er Nivel',
                    account_type: 'ACTIVO',
                    parent_code: '',
                    is_active: true
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveAccount(accountFormData);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="account-code" className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Cuenta *
                  </label>
                  <div className="relative">
                    <input
                      id="account-code"
                      name="account-code"
                      type="text"
                      required
                      value={accountFormData.code}
                      onChange={handleAccountCodeChange}
                      onKeyDown={(e) => {
                        // Si presiona Delete o Backspace, activar modo manual
                        if (e.key === 'Backspace' || e.key === 'Delete') {
                          setIsManualEditing(true);
                        }
                      }}
                      onFocus={() => {
                        // Si el campo ya tiene puntos, activar modo manual
                        if (accountFormData.code.includes('.')) {
                          setIsManualEditing(true);
                        }
                      }}
                      placeholder="ej: 12105 → 1.2.1.005"
                      maxLength={15}
                      className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    {isManualEditing && accountFormData.code && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsManualEditing(false);
                          const autoFormatted = formatAccountCode(accountFormData.code);
                          setAccountFormData({...accountFormData, code: autoFormatted});
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                        title="Volver al formateo automático"
                      >
                        Auto
                      </button>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {isManualEditing ? (
                      <span className="text-blue-600">
                        ✏️ Modo edición manual - Puedes editar libremente (ej: borrar ceros, cambiar dígitos)
                      </span>
                    ) : (
                      <span>
                        💡 Formateo automático: 12105 → 1.2.1.005 | Borra caracteres para editar manualmente
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="account-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Cuenta *
                  </label>
                  <input
                    id="account-name"
                    name="account-name"
                    type="text"
                    required
                    value={accountFormData.name}
                    onChange={(e) => setAccountFormData({...accountFormData, name: e.target.value})}
                    placeholder="ej: Caja y Bancos"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="account-level" className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel Jerárquico * <span className="text-xs text-green-600">(Auto-detectado)</span>
                  </label>
                  <div className="relative">
                    <select
                      id="account-level"
                      name="account-level"
                      required
                      value={accountFormData.level_type}
                      onChange={(e) => setAccountFormData({...accountFormData, level_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      disabled={accountFormData.code.length > 0}
                    >
                      <option value="1er Nivel">1er Nivel</option>
                      <option value="2do Nivel">2do Nivel</option>
                      <option value="3er Nivel">3er Nivel</option>
                      <option value="Imputable">Imputable (Detalle)</option>
                    </select>
                    {accountFormData.code.length > 0 && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          Auto
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    🤖 Se detecta automáticamente según el código ingresado
                  </div>
                </div>

                <div>
                  <label htmlFor="account-type" className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Cuenta *
                  </label>
                  <select
                    id="account-type"
                    name="account-type"
                    required
                    value={accountFormData.account_type}
                    onChange={(e) => setAccountFormData({...accountFormData, account_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="PASIVO">PASIVO</option>
                    <option value="PATRIMONIO">PATRIMONIO</option>
                    <option value="INGRESO">INGRESO</option>
                    <option value="GASTO">GASTO</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="parent-account" className="block text-sm font-medium text-gray-700 mb-2">
                  Cuenta Padre <span className="text-xs text-green-600">(Auto-detectado)</span>
                </label>
                <div className="relative">
                  <select
                    id="parent-account"
                    name="parent-account"
                    value={accountFormData.parent_code}
                    onChange={(e) => setAccountFormData({...accountFormData, parent_code: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    disabled={accountFormData.code.length > 0}
                  >
                    <option value="">Sin cuenta padre</option>
                    {accounts
                      .filter(acc => acc.level_type !== 'Imputable' && acc.is_active)
                      .map((account) => (
                      <option key={account.id} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                  {accountFormData.code.length > 0 && accountFormData.parent_code && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        Auto
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  🤖 Se detecta automáticamente el padre más cercano que existe en la BD
                </div>
                {accountFormData.parent_code && (
                  <div className="mt-1 text-xs text-green-700">
                    ✅ Padre detectado: {accountFormData.parent_code} - {accounts.find(acc => acc.code === accountFormData.parent_code)?.name}
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active_account"
                  name="is_active_account"
                  checked={accountFormData.is_active}
                  onChange={(e) => setAccountFormData({...accountFormData, is_active: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                />
                <label htmlFor="is_active_account" className="text-sm text-gray-700">
                  Cuenta activa (disponible para asientos contables)
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">🤖 Detección Automática de Niveles:</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded p-2">
                      <p><strong>1 dígito:</strong> <code className="bg-gray-100 px-1 rounded">1</code> → 1er Nivel</p>
                      <p className="text-xs text-gray-600">Categorías principales (ACTIVO, PASIVO)</p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <p><strong>2 dígitos:</strong> <code className="bg-gray-100 px-1 rounded">11</code> → <code>1.1</code> → 2do Nivel</p>
                      <p className="text-xs text-gray-600">Subcategorías (Activo Corriente)</p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <p><strong>3-4 dígitos:</strong> <code className="bg-gray-100 px-1 rounded">121</code> → <code>1.2.1</code> → 3er Nivel</p>
                      <p className="text-xs text-gray-600">Grupos específicos (Prop. Planta y Equipo)</p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <p><strong>5+ dígitos:</strong> <code className="bg-gray-100 px-1 rounded">12105</code> → <code>1.2.1.005</code> → Imputable</p>
                      <p className="text-xs text-gray-600">Cuentas detalle (permiten asientos)</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-green-100 rounded border-l-4 border-green-400">
                  <p className="text-xs text-green-700">
                    <strong>💡 Funcionalidad inteligente:</strong> Solo escribe números y el sistema detecta automáticamente el nivel jerárquico
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingAccount(null);
                    setAccountFormData({
                      code: '',
                      name: '',
                      level_type: '1er Nivel',
                      account_type: 'ACTIVO',
                      parent_code: '',
                      is_active: true
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingAccount ? 'Actualizar' : 'Crear'} Cuenta
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Entidad RCV */}
      {showEntityForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold flex items-center space-x-2">
                <Users className="w-6 h-6 text-emerald-600" />
                <span>{editingEntity ? 'Editar Entidad RCV' : 'Nueva Entidad RCV'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowEntityForm(false);
                  setEditingEntity(null);
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
                
                const entity = {
                  id: editingEntity?.id,
                  entity_name: formData.get('entity_name') as string,
                  entity_rut: formData.get('entity_rut') as string,
                  entity_business_name: formData.get('entity_business_name') as string,
                  entity_type: formData.get('entity_type') as 'supplier' | 'customer' | 'both',
                  account_code: formData.get('account_code') as string,
                  account_name: formData.get('account_name') as string,
                  default_tax_rate: parseFloat(formData.get('default_tax_rate') as string) || 19.0,
                  is_tax_exempt: (formData.get('is_tax_exempt') as string) === 'true',
                  is_active: (formData.get('is_active') as string) === 'true',
                  notes: formData.get('notes') as string
                };

                saveRCVEntity(entity);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Entidad *
                  </label>
                  <input
                    type="text"
                    name="entity_name"
                    required
                    defaultValue={editingEntity?.entity_name || ''}
                    placeholder="ej: Empresa ABC Ltda."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RUT *
                  </label>
                  <input
                    type="text"
                    name="entity_rut"
                    required
                    defaultValue={editingEntity?.entity_rut || ''}
                    placeholder="XX.XXX.XXX-X"
                    pattern="^[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9K]$"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón Social (Opcional)
                </label>
                <input
                  type="text"
                  name="entity_business_name"
                  defaultValue={editingEntity?.entity_business_name || ''}
                  placeholder="ej: Empresa ABC Limitada"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Entidad *
                </label>
                <select
                  name="entity_type"
                  required
                  defaultValue={editingEntity?.entity_type || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccionar tipo...</option>
                  <option value="supplier">🏢 Proveedor</option>
                  <option value="customer">👤 Cliente</option>
                  <option value="both">🔄 Ambos (Proveedor y Cliente)</option>
                </select>
              </div>

              {/* Selector de Cuenta Contable */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-emerald-800 mb-2 flex items-center space-x-2">
                  <Building2 className="w-4 h-4" />
                  <span>Cuenta Contable Asociada *</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    name="account_code"
                    required
                    defaultValue={editingEntity?.account_code || ''}
                    onChange={(e) => {
                      const selectedAccount = getDetailAccounts().find(acc => acc.code === e.target.value);
                      const nameInput = document.querySelector('[name="account_name"]') as HTMLInputElement;
                      if (nameInput && selectedAccount) {
                        nameInput.value = selectedAccount.name;
                      }
                    }}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {getDetailAccounts().map((account) => (
                      <option key={account.id} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="account_name"
                    required
                    defaultValue={editingEntity?.account_name || ''}
                    placeholder="Nombre de la cuenta"
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    readOnly
                  />
                </div>
              </div>

              {/* Configuración de IVA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasa de IVA por Defecto (%)
                  </label>
                  <input
                    type="number"
                    name="default_tax_rate"
                    step="0.1"
                    min="0"
                    max="100"
                    defaultValue={editingEntity?.default_tax_rate || 19.0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_tax_exempt"
                    id="is_tax_exempt"
                    value="true"
                    defaultChecked={editingEntity?.is_tax_exempt || false}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 mr-3"
                  />
                  <label htmlFor="is_tax_exempt" className="text-sm text-gray-700">
                    Entidad exenta de IVA
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (Opcional)
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingEntity?.notes || ''}
                  placeholder="Notas adicionales sobre esta entidad..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  id="is_active_entity"
                  value="true"
                  defaultChecked={editingEntity?.is_active ?? true}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 mr-3"
                />
                <label htmlFor="is_active_entity" className="text-sm text-gray-700">
                  Entidad activa (disponible para integración automática)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEntityForm(false);
                    setEditingEntity(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingEntity ? 'Actualizar' : 'Crear'} Entidad
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}