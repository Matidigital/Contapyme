import React from 'react';

interface LiquidationPDFTemplateProps {
  liquidationData: any;
  employeeName: string;
  period: string;
  companyName?: string;
  companyRut?: string;
  companyAddress?: string;
  companyPhone?: string;
  employeeRut?: string;
  employeePosition?: string;
  employeeStartDate?: string;
}

export const LiquidationPDFTemplate: React.FC<LiquidationPDFTemplateProps> = ({
  liquidationData,
  employeeName,
  period,
  companyName = "CONTAPYME SPA",
  companyRut = "12.345.678-9",
  companyAddress = "Dirección no especificada",
  companyPhone = "No especificado",
  employeeRut = liquidationData.employee?.rut || "No especificado",
  employeePosition = "Empleado",
  employeeStartDate = "01-01-2024"
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calcular gratificación legal (25% del sueldo base si corresponde)
  const calculateLegalGratification = () => {
    const baseSalary = liquidationData.base_salary || 0;
    // Solo si el sueldo base es mayor a 2 sueldos mínimos (aprox)
    if (baseSalary > 1000000) {
      return Math.round(baseSalary * 0.25 / 12); // 25% anual dividido en 12 meses
    }
    return 0;
  };

  const legalGratification = calculateLegalGratification();
  
  // Convertir número a palabras (simplificado)
  const numberToWords = (num: number): string => {
    if (num === 0) return 'cero pesos';
    // Implementación simplificada - en producción usar librería completa
    const units = ['', 'mil', 'millón', 'mil millones'];
    let result = '';
    
    if (num >= 1000000) {
      const millions = Math.floor(num / 1000000);
      result += `${millions} ${millions === 1 ? 'millón' : 'millones'} `;
      num %= 1000000;
    }
    
    if (num >= 1000) {
      const thousands = Math.floor(num / 1000);
      result += `${thousands} mil `;
      num %= 1000;
    }
    
    if (num > 0) {
      result += `${num}`;
    }
    
    return result.trim() + ' pesos';
  };

  const totalImponible = (liquidationData.base_salary || 0) + 
                      legalGratification + 
                      (liquidationData.bonuses || 0) + 
                      (liquidationData.overtime_amount || 0) + 
                      (liquidationData.commissions || 0);

  const totalDescuentos = (liquidationData.afp_amount || 0) + 
                         (liquidationData.health_amount || 0) + 
                         (liquidationData.sis_amount || 0) + 
                         (liquidationData.income_tax_amount || 0);

  const liquidoAPagar = totalImponible - totalDescuentos;

  return (
    <div 
      id="liquidation-pdf-content"
      style={{
        fontFamily: 'Courier New, monospace',
        width: '794px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: 'white',
        color: '#000',
        fontSize: '11px',
        lineHeight: '1.3'
      }}
    >
      {/* Company Header */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <tr>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>EMPRESA</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>{companyName}</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}></td>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>Nro. Interno</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>001</td>
        </tr>
        <tr>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>R.U.T.</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>{companyRut}</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}></td>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>Fecha Ingreso</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>{employeeStartDate}</td>
        </tr>
        <tr>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>DIRECCION</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>{companyAddress}</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}></td>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>Dias Trab.</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>30</td>
        </tr>
        <tr>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>FONO</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>{companyPhone}</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}></td>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>Dias Licencia</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>0</td>
        </tr>
      </table>

      {/* Title */}
      <div style={{ textAlign: 'center', margin: '20px 0', fontSize: '14px', fontWeight: 'bold' }}>
        LIQUIDACION DE SUELDO
      </div>

      {/* Employee Info */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
        <tr>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>TRABAJADOR</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>{employeeName.toUpperCase()}</td>
        </tr>
        <tr>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>RUT</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>{employeeRut}</td>
        </tr>
        <tr>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>MES</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>{period.toUpperCase()}</td>
        </tr>
        <tr>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>CARGO</td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>{employeePosition.toUpperCase()}</td>
        </tr>
      </table>

      {/* Main Table - Haberes y Descuentos */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tr>
          <td style={{ padding: '5px 0', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>HABERES</td>
          <td style={{ padding: '5px 0', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>DESCUENTOS</td>
        </tr>
        
        <tr style={{ height: '10px' }}><td colSpan={2}></td></tr>

        {/* Sueldo Base */}
        <tr>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>
            SUELDO BASE &nbsp;&nbsp;&nbsp; $ {(liquidationData.base_salary || 0).toLocaleString('es-CL')}
          </td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>
            AFP &nbsp; HABITAT &nbsp; 10,00% &nbsp; {(liquidationData.afp_amount || 0).toLocaleString('es-CL')}
          </td>
        </tr>

        {/* Gratificación Legal */}
        {legalGratification > 0 && (
          <tr>
            <td style={{ padding: '2px 0', fontSize: '11px' }}>
              GRATIFICACION LEGAL &nbsp;&nbsp;&nbsp; $ {legalGratification.toLocaleString('es-CL')}
            </td>
            <td></td>
          </tr>
        )}

        {/* Otros haberes */}
        {(liquidationData.bonuses || 0) > 0 && (
          <tr>
            <td style={{ padding: '2px 0', fontSize: '11px' }}>
              BONO &nbsp;&nbsp;&nbsp; $ {(liquidationData.bonuses || 0).toLocaleString('es-CL')}
            </td>
            <td></td>
          </tr>
        )}

        {(liquidationData.overtime_amount || 0) > 0 && (
          <tr>
            <td style={{ padding: '2px 0', fontSize: '11px' }}>
              HORAS EXTRAS &nbsp;&nbsp;&nbsp; $ {(liquidationData.overtime_amount || 0).toLocaleString('es-CL')}
            </td>
            <td></td>
          </tr>
        )}

        {/* Salud */}
        <tr>
          <td></td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>
            FONASA O ISAPRE &nbsp;&nbsp; 7,00% &nbsp; {(liquidationData.health_amount || 0).toLocaleString('es-CL')}
          </td>
        </tr>

        <tr style={{ height: '10px' }}><td colSpan={2}></td></tr>

        {/* Totales Imponibles */}
        <tr>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>
            TOTAL IMPONIBLE &nbsp;&nbsp;&nbsp; {totalImponible.toLocaleString('es-CL')}
          </td>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>
            DESCTOS. LEGALES &nbsp;&nbsp;&nbsp; {totalDescuentos.toLocaleString('es-CL')}
          </td>
        </tr>

        <tr style={{ height: '15px' }}><td colSpan={2}></td></tr>

        {/* No imponibles */}
        <tr>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>
            ASIG. DE CAJA &nbsp;&nbsp;&nbsp; $ {(liquidationData.family_allowance || 0).toLocaleString('es-CL')}
          </td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>
            IMPUESTO UNICO &nbsp;&nbsp; $ {(liquidationData.income_tax_amount || 0).toLocaleString('es-CL')}
          </td>
        </tr>

        <tr>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>
            MOVILIZACION &nbsp;&nbsp;&nbsp; $ {(liquidationData.transport_allowance || 0).toLocaleString('es-CL')}
          </td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>
            ADICIONAL SALUD &nbsp;&nbsp; $ 0
          </td>
        </tr>

        <tr>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>
            COLACION &nbsp;&nbsp;&nbsp; $ {(liquidationData.food_allowance || 0).toLocaleString('es-CL')}
          </td>
          <td style={{ padding: '2px 0', fontSize: '11px' }}>
            OTROS DESCUENTOS &nbsp;&nbsp; $ {(liquidationData.total_other_deductions || 0).toLocaleString('es-CL')}
          </td>
        </tr>

        <tr style={{ height: '10px' }}><td colSpan={2}></td></tr>

        {/* Totales finales */}
        <tr>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>
            TOTAL HABER &nbsp;&nbsp; $ {totalImponible.toLocaleString('es-CL')}
          </td>
          <td style={{ padding: '2px 0', fontSize: '11px', fontWeight: 'bold' }}>
            TOTAL DESCUENTOS &nbsp;&nbsp; $ {totalDescuentos.toLocaleString('es-CL')}
          </td>
        </tr>
      </table>

      {/* Resumen Final */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <tr>
          <td style={{ padding: '5px 0', fontSize: '11px', fontWeight: 'bold' }}>
            RENTA IMPONIBLE &nbsp;&nbsp; $ {totalImponible.toLocaleString('es-CL')}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '5px 0', fontSize: '11px', fontWeight: 'bold' }}>
            DESCTOS &nbsp;&nbsp; $ {totalDescuentos.toLocaleString('es-CL')}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '5px 0', fontSize: '14px', fontWeight: 'bold' }}>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {liquidoAPagar.toLocaleString('es-CL')}
          </td>
        </tr>
      </table>

      <div style={{ margin: '30px 0' }}></div>

      {/* Sueldo Líquido */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tr>
          <td style={{ padding: '5px 0', fontSize: '11px' }}>son:</td>
          <td style={{ padding: '5px 0', fontSize: '12px', fontWeight: 'bold' }}>
            SUELDO LIQUIDO &nbsp;&nbsp; $ {liquidoAPagar.toLocaleString('es-CL')}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '5px 0', fontSize: '10px' }}>
            {numberToWords(liquidoAPagar)}
          </td>
          <td style={{ padding: '5px 0', fontSize: '12px', fontWeight: 'bold' }}>
            ANTICIPOS &nbsp;&nbsp; $ 0
          </td>
        </tr>
        <tr>
          <td></td>
          <td style={{ padding: '5px 0', fontSize: '12px', fontWeight: 'bold' }}>
            LIQUIDO A PAGAR &nbsp;&nbsp; $ {liquidoAPagar.toLocaleString('es-CL')}
          </td>
        </tr>
      </table>

      <div style={{ margin: '40px 0' }}></div>

      {/* Firmas */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tr>
          <td style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid #000', width: '40%' }}>
            FIRMA REPRESENTANTE LEGAL
          </td>
          <td style={{ width: '20%' }}></td>
          <td style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid #000', width: '40%' }}>
            RECIBO Y FIRMO CONFORME
          </td>
        </tr>
        <tr>
          <td style={{ textAlign: 'center', fontSize: '10px', padding: '5px 0' }}>
            {companyName}
          </td>
          <td></td>
          <td style={{ textAlign: 'center', fontSize: '10px', padding: '5px 0' }}>
            {employeeName.toUpperCase()}
          </td>
        </tr>
        <tr>
          <td style={{ textAlign: 'center', fontSize: '10px', padding: '5px 0' }}>
            {companyRut}
          </td>
          <td></td>
          <td style={{ textAlign: 'center', fontSize: '10px', padding: '5px 0' }}>
            {employeeRut}
          </td>
        </tr>
      </table>
    </div>
  );
};