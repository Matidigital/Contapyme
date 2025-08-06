'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Header } from '@/components/layout/Header';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useChartOfAccountsCache } from '@/hooks/useChartOfAccountsCache';
import { Account } from '@/types';

interface JournalEntryLine {
  id: string;
  line_number: number;
  account_code: string;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
}

interface JournalEntry {
  jbid: string;
  entry_number: number;
  date: string;
  description: string;
  document_number?: string;
  reference_type: string;
  reference_id?: string;
  status: string;
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  created_at: string;
  journal_book_details?: JournalEntryLine[];
}

interface JournalStats {
  total_debit: number;
  total_credit: number;
  total_entries: number;
  by_type: Record<string, { count: number; debit: number; credit: number }>;
}

interface NewJournalEntryLine {
  account_code: string;
  account_name: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
}

interface NewJournalEntry {
  date: string;
  description: string;
  document_number: string;
  entry_lines: NewJournalEntryLine[];
}

// Componente selector de cuentas contables
function AccountSelector({ 
  value, 
  onChange,
  compact = false
}: {
  value: string;
  onChange: (code: string, name: string) => void;
  compact?: boolean;
}) {
  const { accounts, loading } = useChartOfAccountsCache();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtrar solo cuentas imputables (nivel 4) y activas
  const availableAccounts = useMemo(() => {
    return accounts.filter(acc => 
      (acc.is_detail || acc.isDetail || acc.level === 4) && 
      (acc.is_active !== false && acc.isActive !== false)
    );
  }, [accounts]);
  
  // Filtrar cuentas por término de búsqueda
  const filteredAccounts = useMemo(() => {
    if (!searchTerm) return availableAccounts;
    
    const term = searchTerm.toLowerCase();
    return availableAccounts.filter(acc => 
      acc.code.toLowerCase().includes(term) || 
      acc.name.toLowerCase().includes(term)
    );
  }, [availableAccounts, searchTerm]);
  
  // Encontrar la cuenta seleccionada
  const selectedAccount = availableAccounts.find(acc => acc.code === value);
  
  const handleSelect = (account: Account) => {
    onChange(account.code, account.name);
    setIsOpen(false);
    setSearchTerm('');
  };
  
  return (
    <div className="relative">
      {!compact && (
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Cuenta Contable *
        </label>
      )}
      
      {/* Campo de selección */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-left bg-white flex justify-between items-center"
      >
        <span className={selectedAccount ? 'text-gray-900' : 'text-gray-500'}>
          {selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : 'Seleccionar cuenta...'}
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Campo de búsqueda */}
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
          
          {/* Lista de cuentas */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Cargando cuentas...
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {searchTerm ? 'No se encontraron cuentas' : 'No hay cuentas disponibles'}
              </div>
            ) : (
              filteredAccounts.map((account) => (
                <button
                  key={account.code}
                  type="button"
                  onClick={() => handleSelect(account)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${
                    account.code === value ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                  }`}
                >
                  <div className="font-medium">{account.code}</div>
                  <div className="text-xs text-gray-600 truncate">{account.name}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Overlay para cerrar dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Hook optimizado para el libro diario
function useOptimizedJournalBook() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [stats, setStats] = useState<JournalStats>({
    total_debit: 0,
    total_credit: 0,
    total_entries: 0,
    by_type: {}
  });
  const [loading, setLoading] = useState(true);
  
  // Refs estables para evitar dependency loops
  const fetchEntriesRef = useRef<((period?: string, type?: string) => Promise<void>) | null>(null);
  const lastFetchRef = useRef<number>(0);
  
  // Función de fetch con throttling
  const fetchEntries = useCallback(async (period?: string, type?: string) => {
    const now = Date.now();
    // Throttling: máximo 1 request cada 1.5 segundos
    if (now - lastFetchRef.current < 1500) {
      return;
    }
    
    lastFetchRef.current = now;
    
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (period) {
        const [year, month] = period.split('-');
        params.append('date_from', `${year}-${month}-01`);
        params.append('date_to', `${year}-${month}-31`);
      }
      if (type) {
        params.append('entry_type', type.toLowerCase());
      }
      params.append('limit', '100');

      const response = await fetch(`/api/accounting/journal?${params}&include_lines=false`);
      const data = await response.json();

      if (data.success) {
        // Adaptar formato de journal a journal-book
        const adaptedEntries = data.data.entries.map(entry => ({
          jbid: entry.id,
          entry_number: entry.entry_number,
          date: entry.entry_date,
          description: entry.description,
          document_number: entry.reference,
          reference_type: entry.entry_type.toUpperCase(),
          reference_id: entry.source_id,
          status: entry.status === 'draft' ? 'active' : entry.status,
          total_debit: entry.total_debit,
          total_credit: entry.total_credit,
          is_balanced: Math.abs(entry.total_debit - entry.total_credit) < 0.01,
          created_at: entry.created_at
        }));
        
        setEntries(adaptedEntries);
        
        // Adaptar estadísticas
        const adaptedStats = {
          total_debit: data.data.statistics.total_debit,
          total_credit: data.data.statistics.total_credit,
          total_entries: data.data.statistics.total_entries,
          by_type: Object.entries(data.data.statistics.entries_by_type || {}).reduce((acc, [key, value]) => {
            acc[key.toUpperCase()] = { count: value as number, debit: 0, credit: 0 };
            return acc;
          }, {} as Record<string, { count: number; debit: number; credit: number }>)
        };
        
        setStats(adaptedStats);
      } else {
        console.error('Error fetching entries:', data.error);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Asignar la función al ref
  useEffect(() => {
    fetchEntriesRef.current = fetchEntries;
  }, [fetchEntries]);
  
  // Método público para refrescar
  const refreshEntries = useCallback((period?: string, type?: string) => {
    if (fetchEntriesRef.current) {
      fetchEntriesRef.current(period, type);
    }
  }, []);
  
  return {
    entries,
    stats,
    loading,
    refreshEntries
  };
}

export default function JournalBookPage() {
  const { entries, stats, loading, refreshEntries } = useOptimizedJournalBook();
  
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState<NewJournalEntry>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    document_number: '',
    entry_lines: [
      { account_code: '', account_name: '', debit_amount: 0, credit_amount: 0, description: '' },
      { account_code: '', account_name: '', debit_amount: 0, credit_amount: 0, description: '' }
    ]
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Validador memoizado para las líneas del asiento
  const entryValidation = useMemo(() => {
    if (newEntry.entry_lines.length < 2) {
      return { isValid: false, message: 'Error: Un asiento debe tener al menos 2 líneas' };
    }

    for (let i = 0; i < newEntry.entry_lines.length; i++) {
      const line = newEntry.entry_lines[i];
      if (!line.account_code || !line.account_name) {
        return { isValid: false, message: `Error: Línea ${i + 1} debe tener código y nombre de cuenta` };
      }
      if (line.debit_amount === 0 && line.credit_amount === 0) {
        return { isValid: false, message: `Error: Línea ${i + 1} debe tener un monto mayor a 0` };
      }
      if (line.debit_amount > 0 && line.credit_amount > 0) {
        return { isValid: false, message: `Error: Línea ${i + 1} debe tener SOLO débito O SOLO crédito` };
      }
    }

    const totalDebit = newEntry.entry_lines.reduce((sum, line) => sum + line.debit_amount, 0);
    const totalCredit = newEntry.entry_lines.reduce((sum, line) => sum + line.credit_amount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return { 
        isValid: false, 
        message: `Error: Asiento desbalanceado - Débito: ${formatCurrency(totalDebit)}, Crédito: ${formatCurrency(totalCredit)}`,
        totalDebit,
        totalCredit
      };
    }

    return { isValid: true, message: '', totalDebit, totalCredit };
  }, [newEntry.entry_lines]);

  // Crear nuevo asiento manual multi-línea
  const handleCreateEntry = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!entryValidation.isValid) {
      setMessage(entryValidation.message);
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      // Convertir formato de journal-book a formato journal
      const journalData = {
        entry_date: newEntry.date,
        description: newEntry.description,
        reference: newEntry.document_number,
        entry_type: 'manual',
        lines: newEntry.entry_lines.map((line, index) => ({
          account_code: line.account_code,
          account_name: line.account_name,
          line_number: index + 1,
          debit_amount: line.debit_amount,
          credit_amount: line.credit_amount,
          line_description: line.description
        }))
      };

      const response = await fetch('/api/accounting/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(journalData),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Asiento creado exitosamente');
        setShowAddModal(false);
        resetNewEntry();
        // Usar refreshEntries optimizado
        setTimeout(() => {
          refreshEntries(selectedPeriod, selectedType);
        }, 500);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Error al crear asiento');
      console.error('Error creating entry:', error);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, entryValidation, newEntry, refreshEntries, selectedPeriod, selectedType]);

  // Función memoizada para resetear el formulario
  const resetNewEntry = useCallback(() => {
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      description: '',
      document_number: '',
      entry_lines: [
        { account_code: '', account_name: '', debit_amount: 0, credit_amount: 0, description: '' },
        { account_code: '', account_name: '', debit_amount: 0, credit_amount: 0, description: '' }
      ]
    });
  }, []);

  // Agregar nueva línea de asiento
  const addEntryLine = useCallback(() => {
    setNewEntry(prev => ({
      ...prev,
      entry_lines: [
        ...prev.entry_lines,
        { account_code: '', account_name: '', debit_amount: 0, credit_amount: 0, description: '' }
      ]
    }));
  }, []);

  // Eliminar línea de asiento
  const removeEntryLine = useCallback((index: number) => {
    if (newEntry.entry_lines.length <= 2) {
      setMessage('Error: Un asiento debe tener al menos 2 líneas');
      return;
    }
    setNewEntry(prev => ({
      ...prev,
      entry_lines: prev.entry_lines.filter((_, i) => i !== index)
    }));
  }, [newEntry.entry_lines.length]);

  // Actualizar línea específica
  const updateEntryLine = useCallback((index: number, field: keyof NewJournalEntryLine, value: any) => {
    setNewEntry(prev => ({
      ...prev,
      entry_lines: prev.entry_lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }));
  }, []);

  // Generar asientos desde remuneraciones
  const generatePayrollEntries = useCallback(async () => {
    if (!selectedPeriod) {
      setMessage('Error: Selecciona un período para generar asientos de remuneraciones');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const [year, month] = selectedPeriod.split('-');
      const response = await fetch('/api/accounting/payroll-journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          period_year: parseInt(year),
          period_month: parseInt(month)
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`${data.data.summary.entries_created} asientos de remuneraciones creados para ${data.data.summary.period}`);
        // Usar refreshEntries optimizado
        setTimeout(() => {
          refreshEntries(selectedPeriod, selectedType);
        }, 500);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Error al generar asientos de remuneraciones');
      console.error('Error generating payroll entries:', error);
    } finally {
      setSubmitting(false);
    }
  }, [selectedPeriod, refreshEntries, selectedType]);

  // Funciones memoizadas para formateo
  const getTypeColor = useMemo(() => {
    return (type: string) => {
      switch (type) {
        case 'COMPRA': return 'bg-blue-100 text-blue-800';
        case 'VENTA': return 'bg-green-100 text-green-800';
        case 'REMUNERACION': return 'bg-purple-100 text-purple-800';
        case 'ACTIVO_FIJO': return 'bg-yellow-100 text-yellow-800';
        case 'MANUAL': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
  }, []);

  const getTypeName = useMemo(() => {
    return (type: string) => {
      switch (type) {
        case 'COMPRA': return 'Compra';
        case 'VENTA': return 'Venta';
        case 'REMUNERACION': return 'Remuneración';
        case 'ACTIVO_FIJO': return 'Activo Fijo';
        case 'MANUAL': return 'Manual';
        default: return type;
      }
    };
  }, []);

  // Handlers memoizados para filtros
  const handlePeriodChange = useCallback((period: string) => {
    setSelectedPeriod(period);
    setTimeout(() => {
      refreshEntries(period, selectedType);
    }, 300);
  }, [refreshEntries, selectedType]);
  
  const handleTypeChange = useCallback((type: string) => {
    setSelectedType(type);
    setTimeout(() => {
      refreshEntries(selectedPeriod, type);
    }, 300);
  }, [refreshEntries, selectedPeriod]);
  
  const handleClearFilters = useCallback(() => {
    setSelectedPeriod('');
    setSelectedType('');
    setTimeout(() => {
      refreshEntries('', '');
    }, 300);
  }, [refreshEntries]);
  
  // Carga inicial solo una vez
  useEffect(() => {
    let mounted = true;
    const loadInitialData = async () => {
      if (mounted) {
        refreshEntries();
      }
    };
    loadInitialData();
    return () => { mounted = false; };
  }, []); // Sin dependencias para evitar loops

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Libro Diario"
        subtitle="Registro centralizado de todos los asientos contables"
        showBackButton={true}
        actions={
          <div className="flex gap-2">
            <Button 
              onClick={generatePayrollEntries}
              variant="outline"
              disabled={submitting || !selectedPeriod}
              loading={submitting}
            >
              Generar desde Remuneraciones
            </Button>
            <Button 
              onClick={() => setShowAddModal(true)}
              leftIcon="+"
            >
              Nuevo Asiento
            </Button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Mensaje de estado */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1">
                <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <input
                  type="month"
                  id="period"
                  value={selectedPeriod}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Operación
                </label>
                <select
                  id="type"
                  value={selectedType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los tipos</option>
                  <option value="COMPRA">Compras</option>
                  <option value="VENTA">Ventas</option>
                  <option value="REMUNERACION">Remuneraciones</option>
                  <option value="ACTIVO_FIJO">Activos Fijos</option>
                  <option value="MANUAL">Asientos Manuales</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleClearFilters}
                >
                  Limpiar Filtros
                </Button>
                <Button onClick={() => refreshEntries(selectedPeriod, selectedType)}>
                  Actualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Asientos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_entries}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Débito</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.total_debit)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Crédito</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_credit)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumen por tipo */}
        {Object.keys(stats.by_type).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen por Tipo de Operación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(stats.by_type).map(([type, data]) => (
                  <div key={type} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(type)}`}>
                        {getTypeName(type)}
                      </span>
                      <span className="text-sm text-gray-600">{data.count} asientos</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Débito:</span>
                        <span className="font-medium">{formatCurrency(data.debit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Crédito:</span>
                        <span className="font-medium">{formatCurrency(data.credit)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de asientos */}
        <Card>
          <CardHeader>
            <CardTitle>Asientos Contables</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Cargando asientos...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay asientos contables registrados</p>
                {(selectedPeriod || selectedType) && (
                  <p className="text-sm mt-1">con los filtros aplicados</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 text-sm font-medium text-gray-700">Fecha</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">ID</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">Descripción</th>
                      <th className="text-left p-3 text-sm font-medium text-gray-700">Doc.</th>
                      <th className="text-center p-3 text-sm font-medium text-gray-700">Tipo</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-700">Débito</th>
                      <th className="text-right p-3 text-sm font-medium text-gray-700">Crédito</th>
                      <th className="text-center p-3 text-sm font-medium text-gray-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.jbid} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">{formatDate(entry.date)}</td>
                        <td className="p-3 text-sm font-mono text-xs">{entry.jbid}</td>
                        <td className="p-3 text-sm">
                          <p className="font-medium">{entry.description}</p>
                        </td>
                        <td className="p-3 text-sm text-gray-600">{entry.document_number || '-'}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(entry.reference_type)}`}>
                            {getTypeName(entry.reference_type)}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-right text-blue-600 font-medium">{formatCurrency(entry.total_debit)}</td>
                        <td className="p-3 text-sm text-right text-green-600 font-medium">{formatCurrency(entry.total_credit)}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            entry.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {entry.status === 'active' ? 'Activo' : 'Revertido'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para nuevo asiento manual */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Nuevo Asiento Manual</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={submitting}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateEntry} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    value={newEntry.description}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={3}
                    placeholder="Descripción del asiento contable"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Documento
                  </label>
                  <input
                    type="text"
                    value={newEntry.document_number}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, document_number: e.target.value }))}
                    placeholder="Número de documento de respaldo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Líneas de asiento */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Líneas de Asiento *
                    </label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addEntryLine}
                      leftIcon="+"
                    >
                      Agregar Línea
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Encabezados de tabla */}
                    <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 rounded-lg text-xs font-semibold text-gray-700">
                      <div className="col-span-1">#</div>
                      <div className="col-span-4">Cuenta</div>
                      <div className="col-span-2 text-center">Débito</div>
                      <div className="col-span-2 text-center">Crédito</div>
                      <div className="col-span-2">Descripción</div>
                      <div className="col-span-1"></div>
                    </div>
                    
                    {/* Líneas de asiento */}
                    <div className="max-h-80 overflow-y-auto space-y-2">
                      {newEntry.entry_lines.map((line, index) => {
                        const isDebit = line.debit_amount > 0;
                        const isCredit = line.credit_amount > 0;
                        
                        return (
                          <div key={index} className={`grid grid-cols-12 gap-2 p-3 border rounded-lg ${
                            isDebit ? 'bg-blue-50 border-blue-200' : 
                            isCredit ? 'bg-green-50 border-green-200' : 
                            'bg-white border-gray-200'
                          }`}>
                            {/* Número de línea */}
                            <div className="col-span-1 flex items-center">
                              <span className={`text-sm font-semibold px-2 py-1 rounded-full text-white ${
                                isDebit ? 'bg-blue-500' : 
                                isCredit ? 'bg-green-500' : 
                                'bg-gray-400'
                              }`}>
                                {index + 1}
                              </span>
                            </div>
                            
                            {/* Selector de cuenta */}
                            <div className="col-span-4">
                              <AccountSelector 
                                value={line.account_code}
                                onChange={(code: string, name: string) => {
                                  updateEntryLine(index, 'account_code', code);
                                  updateEntryLine(index, 'account_name', name);
                                }}
                                compact={true}
                              />
                            </div>
                            
                            {/* Débito */}
                            <div className="col-span-2">
                              <input
                                type="number"
                                value={line.debit_amount || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  updateEntryLine(index, 'debit_amount', value);
                                  if (value > 0) {
                                    updateEntryLine(index, 'credit_amount', 0);
                                  }
                                }}
                                min="0"
                                step="1"
                                placeholder="0"
                                className={`w-full px-2 py-1 text-sm border rounded text-center focus:outline-none focus:ring-1 ${
                                  isDebit ? 'border-blue-300 focus:ring-blue-500 bg-blue-50' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                              />
                            </div>
                            
                            {/* Crédito */}
                            <div className="col-span-2">
                              <input
                                type="number"
                                value={line.credit_amount || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  updateEntryLine(index, 'credit_amount', value);
                                  if (value > 0) {
                                    updateEntryLine(index, 'debit_amount', 0);
                                  }
                                }}
                                min="0"
                                step="1"
                                placeholder="0"
                                className={`w-full px-2 py-1 text-sm border rounded text-center focus:outline-none focus:ring-1 ${
                                  isCredit ? 'border-green-300 focus:ring-green-500 bg-green-50' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                              />
                            </div>
                            
                            {/* Descripción */}
                            <div className="col-span-2">
                              <input
                                type="text"
                                value={line.description}
                                onChange={(e) => updateEntryLine(index, 'description', e.target.value)}
                                placeholder="Descripción..."
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            
                            {/* Botón eliminar */}
                            <div className="col-span-1 flex items-center justify-center">
                              {newEntry.entry_lines.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeEntryLine(index)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded"
                                  title="Eliminar línea"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Resumen de totales */}
                    {(() => {
                      const totalDebit = newEntry.entry_lines.reduce((sum, line) => sum + line.debit_amount, 0);
                      const totalCredit = newEntry.entry_lines.reduce((sum, line) => sum + line.credit_amount, 0);
                      const difference = Math.abs(totalDebit - totalCredit);
                      const isBalanced = difference < 0.01;
                      
                      if (totalDebit === 0 && totalCredit === 0) return null;
                      
                      return (
                        <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 border-t border-gray-200 font-semibold">
                          <div className="col-span-5 text-right text-sm text-gray-600">TOTALES:</div>
                          <div className={`col-span-2 text-center text-sm ${
                            isBalanced ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(totalDebit)}
                          </div>
                          <div className={`col-span-2 text-center text-sm ${
                            isBalanced ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(totalCredit)}
                          </div>
                          <div className="col-span-2 text-xs text-center">
                            {isBalanced ? (
                              <span className="text-green-600 font-medium">✓ Balanceado</span>
                            ) : (
                              <span className="text-red-600 font-medium">Dif: {formatCurrency(difference)}</span>
                            )}
                          </div>
                          <div className="col-span-1"></div>
                        </div>
                      );
                    })()}
                  </div>
                </div>



                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowAddModal(false);
                      resetNewEntry();
                    }}
                    disabled={submitting}
                    fullWidth
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={submitting || (() => {
                      const totalDebit = newEntry.entry_lines.reduce((sum, line) => sum + line.debit_amount, 0);
                      const totalCredit = newEntry.entry_lines.reduce((sum, line) => sum + line.credit_amount, 0);
                      return Math.abs(totalDebit - totalCredit) > 0.01;
                    })()}
                    loading={submitting}
                    fullWidth
                  >
                    Crear Asiento
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}