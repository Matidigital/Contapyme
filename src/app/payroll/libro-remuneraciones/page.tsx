'use client';

import { useState, useEffect } from 'react';
import { PayrollHeader } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { FileSpreadsheet, Download, Plus, Calendar, Users, DollarSign, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';

interface PayrollBook {
  id: string;
  period: string;
  book_number: number;
  company_name: string;
  company_rut: string;
  generation_date: string;
  status: 'draft' | 'approved' | 'locked' | 'archived';
  total_employees: number;
  total_haberes: number;
  total_descuentos: number;
  total_liquido: number;
  payroll_book_details: any[];
}

export default function LibroRemuneracionesPage() {
  const [books, setBooks] = useState<PayrollBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingBook, setGeneratingBook] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [periodAvailability, setPeriodAvailability] = useState<any>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const companyId = '8033ee69-b420-4d91-ba0e-482f46cd6fce'; // ID empresa demo

  useEffect(() => {
    loadBooks();
  }, []);

  // Verificar disponibilidad cuando se selecciona un período
  useEffect(() => {
    if (selectedPeriod) {
      checkPeriodAvailability(selectedPeriod);
    } else {
      setPeriodAvailability(null);
    }
  }, [selectedPeriod]);

  const loadBooks = async () => {
    try {
      const response = await fetch(`/api/payroll/libro-remuneraciones?company_id=${companyId}`);
      const result = await response.json();
      
      if (result.success) {
        setBooks(result.data);
        // Mostrar fuente de datos al usuario
        if (result.source) {
          console.log(`📊 Datos cargados desde: ${result.source === 'database' ? 'Base de datos' : 'Demo'}`);
        }
      }
    } catch (error) {
      console.error('Error cargando libros:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPeriodAvailability = async (period: string) => {
    setCheckingAvailability(true);
    try {
      const response = await fetch(`/api/payroll/liquidations/available?company_id=${companyId}&period=${period}`);
      const result = await response.json();
      
      if (result.success) {
        setPeriodAvailability(result.data);
      }
    } catch (error) {
      console.error('Error checking period availability:', error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const generateBook = async () => {
    if (!selectedPeriod) {
      alert('Selecciona un período');
      return;
    }

    setGeneratingBook(true);
    try {
      const response = await fetch('/api/payroll/libro-remuneraciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          period: selectedPeriod,
          company_name: 'Empresa Demo ContaPyme',
          company_rut: '12.345.678-9'
        }),
      });

      const result = await response.json();

      if (result.success) {
        const message = result.message || 'Libro de remuneraciones generado exitosamente';
        alert(message);
        setSelectedPeriod('');
        loadBooks();
      } else {
        // Mostrar error más descriptivo
        const errorMessage = result.error || 'Error generando libro';
        if (errorMessage.includes('No se encontraron liquidaciones')) {
          alert('⚠️ No hay liquidaciones para este período.\n\nDebes generar liquidaciones primero en:\n"Generar Liquidación" → Seleccionar empleados → Calcular');
        } else {
          alert(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error generando libro:', error);
      alert('Error generando libro de remuneraciones');
    } finally {
      setGeneratingBook(false);
    }
  };

  const downloadCSV = async (book: PayrollBook) => {
    try {
      const response = await fetch(`/api/payroll/libro-remuneraciones?company_id=${companyId}&period=${book.period}&format=csv`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `libro_remuneraciones_${book.period}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error descargando archivo');
      }
    } catch (error) {
      console.error('Error descargando CSV:', error);
      alert('Error descargando archivo');
    }
  };

  const downloadPrevired = async (book: PayrollBook) => {
    try {
      const response = await fetch(`/api/payroll/previred?company_id=${companyId}&period=${book.period}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const [year, month] = book.period.split('-');
        a.download = `previred_${month}${year}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error descargando archivo Previred');
      }
    } catch (error) {
      console.error('Error descargando archivo Previred:', error);
      alert('Error descargando archivo Previred');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'draft':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'locked':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'draft':
        return 'Borrador';
      case 'locked':
        return 'Bloqueado';
      case 'archived':
        return 'Archivado';
      default:
        return status;
    }
  };

  // Generar opciones de período (últimos 12 meses)
  const generatePeriodOptions = () => {
    const options = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const period = `${year}-${month}`;
      const label = formatPeriod(period);
      
      options.push({ value: period, label });
    }
    
    return options;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PayrollHeader 
          title="Libro de Remuneraciones" 
          subtitle="Cargando libros de remuneraciones..."
          showBackButton 
        />
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando libros de remuneraciones...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PayrollHeader 
        title="Libro de Remuneraciones" 
        subtitle="Genera y gestiona libros de remuneraciones electrónicos"
        showBackButton
      />

      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          
          {/* Panel de generación */}
          <Card className="mb-6 bg-white border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                <Plus className="w-5 h-5 mr-2 text-blue-600" />
                Generar Nuevo Libro
              </CardTitle>
              <CardDescription className="text-gray-600">
                Crea un libro de remuneraciones para un período específico. Incluye exportación CSV y archivo TXT para Previred.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Período
                    </label>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    >
                      <option value="">Seleccionar período</option>
                      {generatePeriodOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:pt-0">
                    <Button
                      onClick={generateBook}
                      disabled={!selectedPeriod || generatingBook || (periodAvailability && !periodAvailability.can_generate_book)}
                      className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                    >
                      {generatingBook ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                      )}
                      {generatingBook ? 'Generando...' : 'Generar Libro'}
                    </Button>
                  </div>
                </div>

                {/* ✅ Información de Disponibilidad del Período */}
                {checkingAvailability && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      <span className="text-sm text-blue-700">Verificando liquidaciones disponibles...</span>
                    </div>
                  </div>
                )}

                {periodAvailability && (
                  <div className={`p-4 rounded-md border ${
                    periodAvailability.can_generate_book 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-start space-x-3">
                      {periodAvailability.can_generate_book ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          periodAvailability.can_generate_book ? 'text-green-800' : 'text-yellow-800'
                        }`}>
                          {periodAvailability.can_generate_book 
                            ? '✅ Listo para generar libro' 
                            : '⚠️ Faltan liquidaciones'
                          }
                        </h4>
                        <div className="mt-1 text-sm space-y-1">
                          <div className={periodAvailability.can_generate_book ? 'text-green-700' : 'text-yellow-700'}>
                            • <strong>{periodAvailability.liquidations_available}</strong> de <strong>{periodAvailability.total_employees}</strong> empleados con liquidación ({periodAvailability.coverage_percentage}%)
                          </div>
                          {periodAvailability.missing_liquidations > 0 && (
                            <div className="text-yellow-700">
                              • Faltan <strong>{periodAvailability.missing_liquidations}</strong> liquidaciones para completar
                            </div>
                          )}
                          {!periodAvailability.can_generate_book && (
                            <div className="text-yellow-700 mt-2">
                              → Genera liquidaciones faltantes en: <strong>"Generar Liquidación"</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de libros */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Libros Generados</h2>
              {books.length > 0 && (
                <span className="text-sm text-gray-500">{books.length} libro{books.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            
            {books.length === 0 ? (
              <Card className="bg-white border border-gray-200">
                <CardContent className="text-center py-12">
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay libros generados
                  </h3>
                  <p className="text-gray-600">
                    Genera tu primer libro de remuneraciones seleccionando un período arriba.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {books.map((book) => (
                  <Card key={book.id} className="bg-white border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                    <CardHeader className="border-b border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div>
                          <CardTitle className="flex items-center text-xl font-semibold text-gray-900">
                            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                            {formatPeriod(book.period)}
                            <span className="ml-2 text-sm font-normal text-gray-500">
                              (Libro #{book.book_number})
                            </span>
                          </CardTitle>
                          <CardDescription className="flex items-center mt-2 text-gray-600">
                            {getStatusIcon(book.status)}
                            <span className="ml-2">{getStatusText(book.status)}</span>
                            <span className="ml-4 text-xs text-gray-500">
                              Generado: {new Date(book.generation_date).toLocaleDateString('es-CL')}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadCSV(book)}
                            className="flex items-center bg-white border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Descargar CSV
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadPrevired(book)}
                            className="flex items-center bg-white border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors duration-200"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Archivo Previred
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <div className="flex items-center">
                            <Users className="w-5 h-5 text-blue-600 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Empleados</p>
                              <p className="text-xl font-bold text-blue-700">
                                {book.total_employees}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                          <div className="flex items-center">
                            <DollarSign className="w-5 h-5 text-green-600 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Total Haberes</p>
                              <p className="text-xl font-bold text-green-700">
                                {formatCurrency(book.total_haberes)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                          <div className="flex items-center">
                            <DollarSign className="w-5 h-5 text-red-600 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Total Descuentos</p>
                              <p className="text-xl font-bold text-red-700">
                                {formatCurrency(book.total_descuentos)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                          <div className="flex items-center">
                            <DollarSign className="w-5 h-5 text-purple-600 mr-3" />
                            <div>
                              <p className="text-sm font-medium text-gray-700">Líquido a Pagar</p>
                              <p className="text-xl font-bold text-purple-700">
                                {formatCurrency(book.total_liquido)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {book.payroll_book_details && book.payroll_book_details.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <strong>Empleados incluidos:</strong>{' '}
                            {book.payroll_book_details.slice(0, 3).map(detail => 
                              `${detail.nombres} ${detail.apellido_paterno}`
                            ).join(', ')}
                            {book.payroll_book_details.length > 3 && ` y ${book.payroll_book_details.length - 3} más`}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}