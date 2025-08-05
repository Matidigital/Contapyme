'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { FileSpreadsheet, Download, Plus, Calendar, Users, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

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

  const companyId = '8033ee69-b420-4d91-ba0e-482f46cd6fce'; // ID empresa demo

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const response = await fetch(`/api/payroll/libro-remuneraciones?company_id=${companyId}`);
      const result = await response.json();
      
      if (result.success) {
        setBooks(result.data);
      }
    } catch (error) {
      console.error('Error cargando libros:', error);
    } finally {
      setLoading(false);
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
        alert('Libro de remuneraciones generado exitosamente');
        setSelectedPeriod('');
        loadBooks();
      } else {
        alert(result.error || 'Error generando libro');
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
        <Header title="Libro de Remuneraciones" subtitle="Cargando..." />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Libro de Remuneraciones" 
        subtitle="Genera y gestiona libros de remuneraciones electrónicos"
        showBackButton
      />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          
          {/* Panel de generación */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Generar Nuevo Libro
              </CardTitle>
              <CardDescription>
                Crea un libro de remuneraciones para un período específico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período
                  </label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar período</option>
                    {generatePeriodOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pt-6">
                  <Button
                    onClick={generateBook}
                    loading={generatingBook}
                    disabled={!selectedPeriod || generatingBook}
                    className="px-6"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Generar Libro
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de libros */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Libros Generados</h2>
            
            {books.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
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
                  <Card key={book.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                            {formatPeriod(book.period)}
                            <span className="ml-2 text-sm font-normal text-gray-500">
                              (Libro #{book.book_number})
                            </span>
                          </CardTitle>
                          <CardDescription className="flex items-center mt-2">
                            {getStatusIcon(book.status)}
                            <span className="ml-2">{getStatusText(book.status)}</span>
                            <span className="ml-4 text-xs text-gray-500">
                              Generado: {new Date(book.generation_date).toLocaleDateString('es-CL')}
                            </span>
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadCSV(book)}
                          className="flex items-center"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Descargar CSV
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <Users className="w-5 h-5 text-blue-600 mr-2" />
                            <div>
                              <p className="text-sm text-gray-600">Empleados</p>
                              <p className="text-lg font-semibold text-blue-700">
                                {book.total_employees}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                            <div>
                              <p className="text-sm text-gray-600">Total Haberes</p>
                              <p className="text-lg font-semibold text-green-700">
                                {formatCurrency(book.total_haberes)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <DollarSign className="w-5 h-5 text-red-600 mr-2" />
                            <div>
                              <p className="text-sm text-gray-600">Total Descuentos</p>
                              <p className="text-lg font-semibold text-red-700">
                                {formatCurrency(book.total_descuentos)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <DollarSign className="w-5 h-5 text-purple-600 mr-2" />
                            <div>
                              <p className="text-sm text-gray-600">Líquido a Pagar</p>
                              <p className="text-lg font-semibold text-purple-700">
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