'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Header } from '@/components/layout/Header';
import { formatCurrency, formatDate } from '@/lib/utils';

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

export default function JournalBookPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [stats, setStats] = useState<JournalStats>({
    total_debit: 0,
    total_credit: 0,
    total_entries: 0,
    by_type: {}
  });
  const [loading, setLoading] = useState(true);
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

  // Cargar asientos del libro diario
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedPeriod) {
        params.append('period', selectedPeriod);
      }
      if (selectedType) {
        params.append('reference_type', selectedType);
      }
      params.append('limit', '100');

      const response = await fetch(`/api/accounting/journal-book?${params}`);
      const data = await response.json();

      if (data.success) {
        setEntries(data.data.entries);
        setStats(data.data.stats);
      } else {
        console.error('Error fetching entries:', data.error);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo asiento manual multi-línea
  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Validar líneas
    if (newEntry.entry_lines.length < 2) {
      setMessage('Error: Un asiento debe tener al menos 2 líneas');
      return;
    }

    // Validar que cada línea tenga datos
    for (let i = 0; i < newEntry.entry_lines.length; i++) {
      const line = newEntry.entry_lines[i];
      if (!line.account_code || !line.account_name) {
        setMessage(`Error: Línea ${i + 1} debe tener código y nombre de cuenta`);
        return;
      }
      if (line.debit_amount === 0 && line.credit_amount === 0) {
        setMessage(`Error: Línea ${i + 1} debe tener un monto mayor a 0`);
        return;
      }
      if (line.debit_amount > 0 && line.credit_amount > 0) {
        setMessage(`Error: Línea ${i + 1} debe tener SOLO débito O SOLO crédito`);
        return;
      }
    }

    // Calcular totales
    const totalDebit = newEntry.entry_lines.reduce((sum, line) => sum + line.debit_amount, 0);
    const totalCredit = newEntry.entry_lines.reduce((sum, line) => sum + line.credit_amount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      setMessage(`Error: Asiento desbalanceado - Débito: ${formatCurrency(totalDebit)}, Crédito: ${formatCurrency(totalCredit)}`);
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/accounting/journal-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntry),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Asiento creado exitosamente');
        setShowAddModal(false);
        resetNewEntry();
        await fetchEntries(); // Recargar la lista
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Error al crear asiento');
      console.error('Error creating entry:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Función para resetear el formulario
  const resetNewEntry = () => {
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      description: '',
      document_number: '',
      entry_lines: [
        { account_code: '', account_name: '', debit_amount: 0, credit_amount: 0, description: '' },
        { account_code: '', account_name: '', debit_amount: 0, credit_amount: 0, description: '' }
      ]
    });
  };

  // Agregar nueva línea de asiento
  const addEntryLine = () => {
    setNewEntry(prev => ({
      ...prev,
      entry_lines: [
        ...prev.entry_lines,
        { account_code: '', account_name: '', debit_amount: 0, credit_amount: 0, description: '' }
      ]
    }));
  };

  // Eliminar línea de asiento
  const removeEntryLine = (index: number) => {
    if (newEntry.entry_lines.length <= 2) {
      setMessage('Error: Un asiento debe tener al menos 2 líneas');
      return;
    }
    setNewEntry(prev => ({
      ...prev,
      entry_lines: prev.entry_lines.filter((_, i) => i !== index)
    }));
  };

  // Actualizar línea específica
  const updateEntryLine = (index: number, field: keyof NewJournalEntryLine, value: any) => {
    setNewEntry(prev => ({
      ...prev,
      entry_lines: prev.entry_lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }));
  };

  // Generar asientos desde remuneraciones
  const generatePayrollEntries = async () => {
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
        await fetchEntries(); // Recargar la lista
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Error al generar asientos de remuneraciones');
      console.error('Error generating payroll entries:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Obtener el color del badge según el tipo de referencia
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'COMPRA': return 'bg-blue-100 text-blue-800';
      case 'VENTA': return 'bg-green-100 text-green-800';
      case 'REMUNERACION': return 'bg-purple-100 text-purple-800';
      case 'ACTIVO_FIJO': return 'bg-yellow-100 text-yellow-800';
      case 'MANUAL': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener el nombre amigable del tipo
  const getTypeName = (type: string) => {
    switch (type) {
      case 'COMPRA': return 'Compra';
      case 'VENTA': return 'Venta';
      case 'REMUNERACION': return 'Remuneración';
      case 'ACTIVO_FIJO': return 'Activo Fijo';
      case 'MANUAL': return 'Manual';
      default: return type;
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [selectedPeriod, selectedType]);

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
                  onChange={(e) => setSelectedPeriod(e.target.value)}
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
                  onChange={(e) => setSelectedType(e.target.value)}
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
                  onClick={() => {
                    setSelectedPeriod('');
                    setSelectedType('');
                    fetchEntries();
                  }}
                >
                  Limpiar Filtros
                </Button>
                <Button onClick={fetchEntries}>
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
                  
                  <div className="space-y-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {newEntry.entry_lines.map((line, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg relative">
                        {newEntry.entry_lines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeEntryLine(index)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Código Cuenta *
                            </label>
                            <input
                              type="text"
                              value={line.account_code}
                              onChange={(e) => updateEntryLine(index, 'account_code', e.target.value)}
                              placeholder="ej: 1.1.1.001"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Nombre Cuenta *
                            </label>
                            <input
                              type="text"
                              value={line.account_name}
                              onChange={(e) => updateEntryLine(index, 'account_name', e.target.value)}
                              placeholder="ej: Caja"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Débito
                            </label>
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
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Crédito
                            </label>
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
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Descripción Línea
                          </label>
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => updateEntryLine(index, 'description', e.target.value)}
                            placeholder="Descripción específica de esta línea"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Validación de balance multi-línea */}
                {(() => {
                  const totalDebit = newEntry.entry_lines.reduce((sum, line) => sum + line.debit_amount, 0);
                  const totalCredit = newEntry.entry_lines.reduce((sum, line) => sum + line.credit_amount, 0);
                  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
                  const hasAmounts = totalDebit > 0 || totalCredit > 0;
                  
                  if (!hasAmounts) return null;
                  
                  if (!isBalanced) {
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="text-red-600 text-sm">
                          <strong>⚠️ Asiento desbalanceado:</strong>
                          <br />
                          Total Débito: {formatCurrency(totalDebit)}
                          <br />
                          Total Crédito: {formatCurrency(totalCredit)}
                          <br />
                          Diferencia: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                          <br />
                          <em>Los totales deben ser iguales</em>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="text-green-600 text-sm">
                        <strong>✓ Asiento balanceado:</strong> {formatCurrency(totalDebit)}
                        <br />
                        <em>{newEntry.entry_lines.length} líneas correctamente balanceadas</em>
                      </div>
                    </div>
                  );
                })()}

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