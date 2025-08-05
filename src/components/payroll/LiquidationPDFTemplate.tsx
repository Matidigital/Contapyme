import React from 'react';

interface LiquidationPDFTemplateProps {
  liquidationData: any;
  employeeName: string;
  period: string;
  companyName?: string;
}

export const LiquidationPDFTemplate: React.FC<LiquidationPDFTemplateProps> = ({
  liquidationData,
  employeeName,
  period,
  companyName = "ContaPyme"
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div 
      id="liquidation-pdf-content"
      style={{
        fontFamily: 'Arial, sans-serif',
        width: '794px', // A4 width in pixels at 96 DPI
        margin: '0 auto',
        padding: '40px',
        backgroundColor: 'white',
        color: '#000',
        fontSize: '12px',
        lineHeight: '1.4'
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
        <h1 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold', color: '#2563eb' }}>
          {companyName}
        </h1>
        <h2 style={{ margin: '10px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>
          LIQUIDACIÓN DE SUELDO
        </h2>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
          Período: {period}
        </p>
      </div>

      {/* Employee Info */}
      <div style={{ marginBottom: '25px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: '14px' }}>EMPLEADO: </strong>
            <span style={{ fontSize: '14px' }}>{employeeName}</span>
          </div>
          <div>
            <strong>RUT: </strong>
            <span>{liquidationData.employee?.rut || 'N/A'}</span>
          </div>
        </div>
        {liquidationData.employee?.contract_type && (
          <div style={{ marginTop: '8px' }}>
            <strong>TIPO CONTRATO: </strong>
            <span style={{ textTransform: 'capitalize' }}>
              {liquidationData.employee.contract_type.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', gap: '30px' }}>
        
        {/* Left Column - Haberes */}
        <div style={{ flex: '1' }}>
          <div style={{ backgroundColor: '#e8f5e8', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold', color: '#16a34a' }}>
              HABERES
            </h3>
            
            {/* Haberes Imponibles */}
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ fontSize: '12px', color: '#059669' }}>IMPONIBLES:</strong>
              <div style={{ marginLeft: '10px', marginTop: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                  <span>• Sueldo Base</span>
                  <span>{formatCurrency(liquidationData.base_salary || 0)}</span>
                </div>
                {liquidationData.overtime_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>• Horas Extra</span>
                    <span>{formatCurrency(liquidationData.overtime_amount)}</span>
                  </div>
                )}
                {liquidationData.bonuses > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>• Bonos</span>
                    <span>{formatCurrency(liquidationData.bonuses)}</span>
                  </div>
                )}
                {liquidationData.commissions > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>• Comisiones</span>
                    <span>{formatCurrency(liquidationData.commissions)}</span>
                  </div>
                )}
                {liquidationData.gratification > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>• Gratificación</span>
                    <span>{formatCurrency(liquidationData.gratification)}</span>
                  </div>
                )}
              </div>
              <div style={{ 
                borderTop: '1px solid #16a34a', 
                paddingTop: '8px', 
                marginTop: '8px',
                display: 'flex', 
                justifyContent: 'space-between',
                fontWeight: 'bold'
              }}>
                <span>TOTAL IMPONIBLE</span>
                <span>{formatCurrency(liquidationData.total_taxable_income || 0)}</span>
              </div>
            </div>

            {/* Haberes No Imponibles */}
            <div>
              <strong style={{ fontSize: '12px', color: '#059669' }}>NO IMPONIBLES:</strong>
              <div style={{ marginLeft: '10px', marginTop: '5px' }}>
                {liquidationData.food_allowance > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>• Colación</span>
                    <span>{formatCurrency(liquidationData.food_allowance)}</span>
                  </div>
                )}
                {liquidationData.transport_allowance > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>• Movilización</span>
                    <span>{formatCurrency(liquidationData.transport_allowance)}</span>
                  </div>
                )}
                {liquidationData.family_allowance > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>• Asignación Familiar</span>
                    <span>{formatCurrency(liquidationData.family_allowance)}</span>
                  </div>
                )}
              </div>
              <div style={{ 
                borderTop: '1px solid #16a34a', 
                paddingTop: '8px', 
                marginTop: '8px',
                display: 'flex', 
                justifyContent: 'space-between',
                fontWeight: 'bold'
              }}>
                <span>TOTAL NO IMPONIBLE</span>
                <span>{formatCurrency(liquidationData.total_non_taxable_income || 0)}</span>
              </div>
            </div>

            {/* Total Haberes */}
            <div style={{ 
              backgroundColor: '#16a34a', 
              color: 'white', 
              padding: '10px', 
              marginTop: '15px',
              borderRadius: '3px',
              display: 'flex', 
              justifyContent: 'space-between',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              <span>TOTAL HABERES</span>
              <span>{formatCurrency(liquidationData.total_gross_income || 0)}</span>
            </div>
          </div>
        </div>

        {/* Right Column - Descuentos */}
        <div style={{ flex: '1' }}>
          <div style={{ backgroundColor: '#fee8e8', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', fontWeight: 'bold', color: '#dc2626' }}>
              DESCUENTOS
            </h3>
            
            {/* Descuentos Previsionales */}
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ fontSize: '12px', color: '#b91c1c' }}>PREVISIONALES:</strong>
              <div style={{ marginLeft: '10px', marginTop: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                  <span>• AFP (10%)</span>
                  <span>{formatCurrency(liquidationData.afp_amount || 0)}</span>
                </div>
                {liquidationData.afp_commission_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>• Comisión AFP</span>
                    <span>{formatCurrency(liquidationData.afp_commission_amount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                  <span>• Salud (7%)</span>
                  <span>{formatCurrency(liquidationData.health_amount || 0)}</span>
                </div>
                {liquidationData.sis_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>• Seguro Cesantía</span>
                    <span>{formatCurrency(liquidationData.sis_amount)}</span>
                  </div>
                )}
                {liquidationData.income_tax_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <span>• Impuesto Renta</span>
                    <span>{formatCurrency(liquidationData.income_tax_amount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Otros Descuentos */}
            {(liquidationData.total_other_deductions > 0) && (
              <div>
                <strong style={{ fontSize: '12px', color: '#b91c1c' }}>OTROS:</strong>
                <div style={{ marginLeft: '10px', marginTop: '5px' }}>
                  {liquidationData.loan_deductions > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                      <span>• Préstamos</span>
                      <span>{formatCurrency(liquidationData.loan_deductions)}</span>
                    </div>
                  )}
                  {liquidationData.advance_payments > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                      <span>• Anticipos</span>
                      <span>{formatCurrency(liquidationData.advance_payments)}</span>
                    </div>
                  )}
                  {liquidationData.apv_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                      <span>• APV</span>
                      <span>{formatCurrency(liquidationData.apv_amount)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Total Descuentos */}
            <div style={{ 
              backgroundColor: '#dc2626', 
              color: 'white', 
              padding: '10px', 
              marginTop: '15px',
              borderRadius: '3px',
              display: 'flex', 
              justifyContent: 'space-between',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              <span>TOTAL DESCUENTOS</span>
              <span>{formatCurrency(liquidationData.total_deductions || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Final Result */}
      <div style={{ 
        backgroundColor: '#1e40af', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        textAlign: 'center',
        marginTop: '20px'
      }}>
        <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>
          SUELDO LÍQUIDO A PAGAR
        </h2>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '10px' }}>
          {formatCurrency(liquidationData.net_salary || 0)}
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        marginTop: '30px', 
        borderTop: '1px solid #ccc', 
        paddingTop: '15px',
        fontSize: '10px',
        color: '#666',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0' }}>
          Liquidación generada automáticamente por {companyName}
        </p>
        <p style={{ margin: '5px 0 0 0' }}>
          Fecha de generación: {new Date().toLocaleDateString('es-CL')}
        </p>
      </div>
    </div>
  );
};