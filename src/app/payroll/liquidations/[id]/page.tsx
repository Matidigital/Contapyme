'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import jsPDF from 'jspdf';
import { Header } from '@/components/layout';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Edit3, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  User,
  FileText,
  Calculator,
  Building
} from 'lucide-react';

interface LiquidationDetail {
  id: string;
  employee: {
    rut: string;
    first_name: string;
    last_name: string;
  };
  period_year: number;
  period_month: number;
  days_worked: number;
  
  // Haberes
  base_salary: number;
  overtime_amount: number;
  bonuses: number;
  commissions: number;
  gratification: number;
  food_allowance: number;
  transport_allowance: number;
  family_allowance: number;
  total_taxable_income: number;
  total_non_taxable_income: number;
  
  // Descuentos
  afp_percentage: number;
  afp_commission_percentage: number;
  afp_amount: number;
  afp_commission_amount: number;
  health_percentage: number;
  health_amount: number;
  unemployment_percentage: number;
  unemployment_amount: number;
  income_tax_amount: number;
  
  // Otros descuentos
  loan_deductions: number;
  advance_payments: number;
  apv_amount: number;
  other_deductions: number;
  total_other_deductions: number;
  
  // Totales
  total_gross_income: number;
  total_deductions: number;
  net_salary: number;
  
  status: string;
  created_at: string;
  updated_at: string;
}

export default function LiquidationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const liquidationId = params.id as string;
  
  const [liquidation, setLiquidation] = useState<LiquidationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const COMPANY_ID = '8033ee69-b420-4d91-ba0e-482f46cd6fce';

  useEffect(() => {
    if (liquidationId) {
      fetchLiquidationDetail();
    }
  }, [liquidationId]);

  const fetchLiquidationDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/payroll/liquidations/${liquidationId}?company_id=${COMPANY_ID}`
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setLiquidation(data.data);
      } else {
        setError('Liquidación no encontrada');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error fetching liquidation:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPeriod = (year: number, month: number) => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return `${monthNames[month - 1]} ${year}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Borrador', class: 'bg-gray-100 text-gray-800' },
      approved: { label: 'Aprobada', class: 'bg-green-100 text-green-800' },
      paid: { label: 'Pagada', class: 'bg-blue-100 text-blue-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!liquidation) return;
    
    try {
      setDownloadingPDF(true);
      
      console.log('🔍 Iniciando descarga PDF para liquidación:', liquidationId);
      
      // Llamar a la API de exportación con la liquidación existente
      const response = await fetch(`/api/payroll/liquidations/export?company_id=${COMPANY_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          liquidation_id: liquidationId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Crear un blob con el contenido HTML y abrir en nueva ventana para imprimir/descargar
        const htmlContent = data.data.html;
        const filename = data.data.filename;
        
        console.log('✅ Liquidación HTML recibida. Generando archivo:', filename);
        
        const newWindow = window.open('', '_blank');
        
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          
          // Esperar a que se cargue el contenido y luego mostrar diálogo de impresión
          setTimeout(() => {
            newWindow.print();
          }, 1000);
          
          console.log('✅ PDF generado exitosamente con formato completo');
        } else {
          // Fallback: crear blob y descargar directamente
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename.replace('.pdf', '.html');
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          console.log('✅ HTML descargado como fallback');
        }
      } else {
        setError(data.error || 'Error al generar PDF');
        console.error('❌ Error en API export:', data.error);
      }
    } catch (error) {
      setError('Error de conexión al generar PDF');
      console.error('❌ Error downloading PDF:', error);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadDirectPDF = () => {
    if (!liquidation) return;
    
    try {
      setDownloadingPDF(true);
      
      console.log('🔍 Generando PDF directo para liquidación:', liquidationId);
      
      // Crear PDF usando jsPDF
      const pdf = new jsPDF();
      
      // Configuración
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      const lineHeight = 7;
      let yPosition = margin;
      
      // Helper para agregar texto
      const addText = (text: string, x = margin, fontSize = 12, style = 'normal') => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', style);
        pdf.text(text, x, yPosition);
        yPosition += lineHeight;
      };
      
      // Header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LIQUIDACIÓN DE SUELDO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 2;
      
      // Período
      pdf.setFontSize(14);
      pdf.text(formatPeriod(liquidation.period_year, liquidation.period_month), pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 2;
      
      // Datos del empleado
      addText('DATOS DEL TRABAJADOR', margin, 14, 'bold');
      addText(`Nombre: ${liquidation.employee.first_name} ${liquidation.employee.last_name}`);
      addText(`RUT: ${liquidation.employee.rut}`);
      addText(`Días Trabajados: ${liquidation.days_worked}`);
      yPosition += lineHeight;
      
      // Haberes
      addText('HABERES', margin, 14, 'bold');
      addText(`Sueldo Base: ${formatCurrency(liquidation.base_salary)}`);
      if (liquidation.overtime_amount > 0) addText(`Horas Extras: ${formatCurrency(liquidation.overtime_amount)}`);
      if (liquidation.bonuses > 0) addText(`Bonos: ${formatCurrency(liquidation.bonuses)}`);
      if (liquidation.commissions > 0) addText(`Comisiones: ${formatCurrency(liquidation.commissions)}`);
      if (liquidation.gratification > 0) addText(`Gratificación: ${formatCurrency(liquidation.gratification)}`);
      if (liquidation.food_allowance > 0) addText(`Colación: ${formatCurrency(liquidation.food_allowance)}`);
      if (liquidation.transport_allowance > 0) addText(`Movilización: ${formatCurrency(liquidation.transport_allowance)}`);
      if (liquidation.family_allowance > 0) addText(`Asignación Familiar: ${formatCurrency(liquidation.family_allowance)}`);
      
      addText(`TOTAL HABERES: ${formatCurrency(liquidation.total_gross_income)}`, margin, 12, 'bold');
      yPosition += lineHeight;
      
      // Descuentos
      addText('DESCUENTOS', margin, 14, 'bold');
      addText(`AFP (${liquidation.afp_percentage}%): ${formatCurrency(liquidation.afp_amount)}`);
      addText(`Comisión AFP (${liquidation.afp_commission_percentage}%): ${formatCurrency(liquidation.afp_commission_amount)}`);
      addText(`Salud (${liquidation.health_percentage}%): ${formatCurrency(liquidation.health_amount)}`);
      if (liquidation.unemployment_amount > 0) addText(`Cesantía (${liquidation.unemployment_percentage}%): ${formatCurrency(liquidation.unemployment_amount)}`);
      if (liquidation.income_tax_amount > 0) addText(`Impuesto Único: ${formatCurrency(liquidation.income_tax_amount)}`);
      if (liquidation.loan_deductions > 0) addText(`Préstamos: ${formatCurrency(liquidation.loan_deductions)}`);
      if (liquidation.advance_payments > 0) addText(`Anticipos: ${formatCurrency(liquidation.advance_payments)}`);
      if (liquidation.apv_amount > 0) addText(`APV: ${formatCurrency(liquidation.apv_amount)}`);
      if (liquidation.other_deductions > 0) addText(`Otros: ${formatCurrency(liquidation.other_deductions)}`);
      
      addText(`TOTAL DESCUENTOS: ${formatCurrency(liquidation.total_deductions)}`, margin, 12, 'bold');
      yPosition += lineHeight * 2;
      
      // Líquido a pagar
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`LÍQUIDO A PAGAR: ${formatCurrency(liquidation.net_salary)}`, pageWidth / 2, yPosition, { align: 'center' });
      
      // Descargar
      const fileName = `liquidacion_${liquidation.employee.rut}_${liquidation.period_year}_${String(liquidation.period_month).padStart(2, '0')}.pdf`;
      pdf.save(fileName);
      
      console.log('✅ PDF directo generado exitosamente:', fileName);
      
    } catch (error) {
      setError('Error al generar PDF directo');
      console.error('❌ Error generating direct PDF:', error);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleEdit = () => {
    router.push(`/payroll/liquidations/${liquidationId}/edit`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          title="Liquidación de Sueldo"
          subtitle="Cargando detalles..."
          showBackButton
          backHref="/payroll/liquidations"
        />
        <div className="max-w-4xl mx-auto py-6 px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando liquidación...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !liquidation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          title="Liquidación de Sueldo"
          subtitle="Error al cargar"
          showBackButton
          backHref="/payroll/liquidations"
        />
        <div className="max-w-4xl mx-auto py-6 px-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-900 mb-2">
                  {error || 'Liquidación no encontrada'}
                </h3>
                <p className="text-red-700 mb-6">
                  No se pudo cargar la información de la liquidación solicitada.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/payroll/liquidations')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Liquidaciones
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <div className="print:hidden">
        <Header 
          title="Liquidación de Sueldo"
          subtitle={`${liquidation.employee.first_name} ${liquidation.employee.last_name} - ${formatPeriod(liquidation.period_year, liquidation.period_month)}`}
          showBackButton
          backHref="/payroll/liquidations"
          actions={
            <div className="flex items-center space-x-2">
              {getStatusBadge(liquidation.status)}
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit3 className="h-4 w-4 mr-2" />
                Editar
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleDownloadPDF}
                disabled={downloadingPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                {downloadingPDF ? 'Generando PDF...' : 'Descargar PDF'}
              </Button>
            </div>
          }
        />
      </div>

      <div className="max-w-4xl mx-auto py-6 px-4 print:py-0 print:px-0 print:max-w-none">
        {/* Header de liquidación para impresión */}
        <div className="hidden print:block mb-8 border-b-2 border-gray-800 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LIQUIDACIÓN DE SUELDO</h1>
              <p className="text-lg text-gray-700 mt-1">
                {formatPeriod(liquidation.period_year, liquidation.period_month)}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-gray-600 mb-2">
                <Building className="h-4 w-4 mr-2" />
                <span>ContaPyme Demo</span>
              </div>
              <div className="text-sm text-gray-500">
                Fecha: {new Date().toLocaleDateString('es-CL')}
              </div>
            </div>
          </div>
        </div>

        {/* Información del empleado */}
        <Card className="mb-6 print:shadow-none print:border print:border-gray-300">
          <CardHeader className="bg-blue-50 print:bg-gray-50">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Información del Empleado
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nombre Completo</label>
                <p className="text-lg font-medium text-gray-900">
                  {liquidation.employee.first_name} {liquidation.employee.last_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">RUT</label>
                <p className="text-lg font-medium text-gray-900">{liquidation.employee.rut}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Período</label>
                <p className="text-lg font-medium text-gray-900">
                  {formatPeriod(liquidation.period_year, liquidation.period_month)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Días Trabajados</label>
                <p className="text-lg font-medium text-gray-900">{liquidation.days_worked} días</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Haberes */}
          <Card className="print:shadow-none print:border print:border-gray-300">
            <CardHeader className="bg-green-50 print:bg-gray-50">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Haberes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Haberes Imponibles */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3 border-b border-gray-200 pb-1">
                    Haberes Imponibles
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Sueldo Base</span>
                      <span className="font-medium">{formatCurrency(liquidation.base_salary)}</span>
                    </div>
                    {liquidation.overtime_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Horas Extras</span>
                        <span className="font-medium">{formatCurrency(liquidation.overtime_amount)}</span>
                      </div>
                    )}
                    {liquidation.bonuses > 0 && (
                      <div className="flex justify-between">
                        <span>Bonos</span>
                        <span className="font-medium">{formatCurrency(liquidation.bonuses)}</span>
                      </div>
                    )}
                    {liquidation.commissions > 0 && (
                      <div className="flex justify-between">
                        <span>Comisiones</span>
                        <span className="font-medium">{formatCurrency(liquidation.commissions)}</span>
                      </div>
                    )}
                    {liquidation.gratification > 0 && (
                      <div className="flex justify-between">
                        <span>Gratificación</span>
                        <span className="font-medium">{formatCurrency(liquidation.gratification)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 font-medium">
                    <span>Subtotal Imponible</span>
                    <span>{formatCurrency(liquidation.total_taxable_income)}</span>
                  </div>
                </div>

                {/* Haberes No Imponibles */}
                {(liquidation.food_allowance > 0 || liquidation.transport_allowance > 0 || liquidation.family_allowance > 0) && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3 border-b border-gray-200 pb-1">
                      Haberes No Imponibles
                    </h4>
                    <div className="space-y-2 text-sm">
                      {liquidation.food_allowance > 0 && (
                        <div className="flex justify-between">
                          <span>Colación</span>
                          <span className="font-medium">{formatCurrency(liquidation.food_allowance)}</span>
                        </div>
                      )}
                      {liquidation.transport_allowance > 0 && (
                        <div className="flex justify-between">
                          <span>Movilización</span>
                          <span className="font-medium">{formatCurrency(liquidation.transport_allowance)}</span>
                        </div>
                      )}
                      {liquidation.family_allowance > 0 && (
                        <div className="flex justify-between">
                          <span>Asignación Familiar</span>
                          <span className="font-medium">{formatCurrency(liquidation.family_allowance)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 font-medium">
                      <span>Subtotal No Imponible</span>
                      <span>{formatCurrency(liquidation.total_non_taxable_income)}</span>
                    </div>
                  </div>
                )}

                {/* Total Haberes */}
                <div className="bg-green-50 print:bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-green-800 print:text-gray-800">Total Haberes</span>
                    <span className="text-xl font-bold text-green-800 print:text-gray-800">
                      {formatCurrency(liquidation.total_gross_income)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Descuentos */}
          <Card className="print:shadow-none print:border print:border-gray-300">
            <CardHeader className="bg-red-50 print:bg-gray-50">
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                Descuentos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Descuentos Previsionales */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3 border-b border-gray-200 pb-1">
                    Descuentos Previsionales
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>AFP ({liquidation.afp_percentage}%)</span>
                      <span className="font-medium">{formatCurrency(liquidation.afp_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Comisión AFP ({liquidation.afp_commission_percentage}%)</span>
                      <span className="font-medium">{formatCurrency(liquidation.afp_commission_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Salud ({liquidation.health_percentage}%)</span>
                      <span className="font-medium">{formatCurrency(liquidation.health_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cesantía ({liquidation.unemployment_percentage}%)</span>
                      <span className="font-medium">{formatCurrency(liquidation.unemployment_amount)}</span>
                    </div>
                    {liquidation.income_tax_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Impuesto Segunda Categoría</span>
                        <span className="font-medium">{formatCurrency(liquidation.income_tax_amount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Otros Descuentos */}
                {liquidation.total_other_deductions > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3 border-b border-gray-200 pb-1">
                      Otros Descuentos
                    </h4>
                    <div className="space-y-2 text-sm">
                      {liquidation.loan_deductions > 0 && (
                        <div className="flex justify-between">
                          <span>Préstamos</span>
                          <span className="font-medium">{formatCurrency(liquidation.loan_deductions)}</span>
                        </div>
                      )}
                      {liquidation.advance_payments > 0 && (
                        <div className="flex justify-between">
                          <span>Anticipos</span>
                          <span className="font-medium">{formatCurrency(liquidation.advance_payments)}</span>
                        </div>
                      )}
                      {liquidation.apv_amount > 0 && (
                        <div className="flex justify-between">
                          <span>APV</span>
                          <span className="font-medium">{formatCurrency(liquidation.apv_amount)}</span>
                        </div>
                      )}
                      {liquidation.other_deductions > 0 && (
                        <div className="flex justify-between">
                          <span>Otros</span>
                          <span className="font-medium">{formatCurrency(liquidation.other_deductions)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 font-medium">
                      <span>Subtotal Otros</span>
                      <span>{formatCurrency(liquidation.total_other_deductions)}</span>
                    </div>
                  </div>
                )}

                {/* Total Descuentos */}
                <div className="bg-red-50 print:bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-red-800 print:text-gray-800">Total Descuentos</span>
                    <span className="text-xl font-bold text-red-800 print:text-gray-800">
                      {formatCurrency(liquidation.total_deductions)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumen Final */}
        <Card className="mb-6 print:shadow-none print:border-2 print:border-gray-800">
          <CardContent className="pt-6">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 print:bg-gray-100 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-6 w-6 text-green-600 mr-2" />
                    <span className="font-medium text-gray-700">Total Haberes</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 print:text-gray-800">
                    {formatCurrency(liquidation.total_gross_income)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-center mb-2">
                    <TrendingDown className="h-6 w-6 text-red-600 mr-2" />
                    <span className="font-medium text-gray-700">Total Descuentos</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600 print:text-gray-800">
                    {formatCurrency(liquidation.total_deductions)}
                  </p>
                </div>
                <div className="md:border-l-2 md:border-blue-300 print:border-gray-400">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-6 w-6 text-blue-600 mr-2" />
                    <span className="font-medium text-gray-700">Líquido a Pagar</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 print:text-gray-900">
                    {formatCurrency(liquidation.net_salary)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="print:hidden">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Estado</label>
                  <div>{getStatusBadge(liquidation.status)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Fecha de Creación</label>
                  <p className="text-gray-900">
                    {new Date(liquidation.created_at).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Última Actualización</label>
                  <p className="text-gray-900">
                    {new Date(liquidation.updated_at).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">ID de Liquidación</label>
                  <p className="text-gray-900 font-mono text-sm">{liquidation.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer para impresión */}
        <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
          <p>Este documento fue generado automáticamente por ContaPyme el {new Date().toLocaleDateString('es-CL')}</p>
        </div>
      </div>
    </div>
  );
}