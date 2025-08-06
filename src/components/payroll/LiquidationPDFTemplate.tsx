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

  // Calcular gratificación legal según configuración del empleado
  const calculateLegalGratification = () => {
    const baseSalary = liquidationData.base_salary || 0;
    const gratificationType = liquidationData.legal_gratification_type || 'none';
    
    if (gratificationType === 'none') return 0;
    
    const annualPercentage = gratificationType === 'code_47' ? 0.25 : // 25% código 47
                            gratificationType === 'code_50' ? 0.30 : // 30% código 50
                            0;
    
    return Math.round(baseSalary * annualPercentage / 12); // Anual dividido en 12 meses
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

  // ✅ CORREGIDO: Incluir cesantía con campo correcto
  const totalDescuentos = (liquidationData.afp_amount || 0) + 
                         (liquidationData.afp_commission_amount || 0) +
                         (liquidationData.health_amount || 0) + 
                         (liquidationData.additional_health_amount || 0) +
                         (liquidationData.sis_amount || 0) + 
                         (liquidationData.unemployment_amount || 0) + // ✅ Cesantía correcta
                         (liquidationData.income_tax_amount || 0) +
                         (liquidationData.total_other_deductions || 0);

  const liquidoAPagar = totalImponible - totalDescuentos;

  return (
    <div 
      id="liquidation-pdf-content"
      style={{
        fontFamily: 'Arial, sans-serif',
        width: '800px',
        margin: '0 auto',
        padding: '30px',
        backgroundColor: 'white',
        color: '#000',
        fontSize: '12px',
        lineHeight: '1.4',
        border: '2px solid #000',
        boxSizing: 'border-box'
      }}
    >
      {/* Header Empresa */}
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse', 
        marginBottom: '20px',
        border: '1px solid #000'
      }}>
        <tbody>
        <tr>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px', 
            fontWeight: 'bold',
            borderRight: '1px solid #000',
            width: '15%'
          }}>EMPRESA:</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderRight: '1px solid #000',
            width: '35%'
          }}>{companyName}</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px', 
            fontWeight: 'bold',
            borderRight: '1px solid #000',
            width: '15%'
          }}>Nro. Interno:</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            width: '35%'
          }}>001</td>
        </tr>
        <tr>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px', 
            fontWeight: 'bold',
            borderRight: '1px solid #000',
            borderTop: '1px solid #000'
          }}>R.U.T.:</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderRight: '1px solid #000',
            borderTop: '1px solid #000'
          }}>{companyRut}</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px', 
            fontWeight: 'bold',
            borderRight: '1px solid #000',
            borderTop: '1px solid #000'
          }}>Fecha Ingreso:</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderTop: '1px solid #000'
          }}>{employeeStartDate}</td>
        </tr>
        <tr>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px', 
            fontWeight: 'bold',
            borderRight: '1px solid #000',
            borderTop: '1px solid #000'
          }}>DIRECCIÓN:</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderRight: '1px solid #000',
            borderTop: '1px solid #000'
          }}>{companyAddress}</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px', 
            fontWeight: 'bold',
            borderRight: '1px solid #000',
            borderTop: '1px solid #000'
          }}>Días Trab.:</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderTop: '1px solid #000'
          }}>30</td>
        </tr>
        <tr>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px', 
            fontWeight: 'bold',
            borderRight: '1px solid #000',
            borderTop: '1px solid #000'
          }}>TELÉFONO:</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderRight: '1px solid #000',
            borderTop: '1px solid #000'
          }}>{companyPhone}</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px', 
            fontWeight: 'bold',
            borderRight: '1px solid #000',
            borderTop: '1px solid #000'
          }}>Días Licencia:</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderTop: '1px solid #000'
          }}>0</td>
        </tr>
        </tbody>
      </table>

      {/* Título */}
      <div style={{ 
        textAlign: 'center', 
        margin: '20px 0', 
        fontSize: '16px', 
        fontWeight: 'bold',
        border: '2px solid #000',
        padding: '10px'
      }}>
        LIQUIDACIÓN DE SUELDO
      </div>

      {/* Datos Empleado */}
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse', 
        marginBottom: '20px',
        border: '1px solid #000'
      }}>
        <tbody>
        <tr>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px', 
            fontWeight: 'bold',
            borderRight: '1px solid #000',
            width: '20%'
          }}>TRABAJADOR:</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderRight: '1px solid #000',
            width: '30%'
          }}>{employeeName.toUpperCase()}</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px', 
            fontWeight: 'bold',
            borderRight: '1px solid #000',
            width: '15%'
          }}>RUT:</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            width: '35%'
          }}>{employeeRut}</td>
        </tr>
        <tr>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px', 
            fontWeight: 'bold',
            borderRight: '1px solid #000',
            borderTop: '1px solid #000'
          }}>MES:</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderRight: '1px solid #000',
            borderTop: '1px solid #000'
          }}>{period.toUpperCase()}</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px', 
            fontWeight: 'bold',
            borderRight: '1px solid #000',
            borderTop: '1px solid #000'
          }}>CARGO:</td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderTop: '1px solid #000'
          }}>{employeePosition.toUpperCase()}</td>
        </tr>
        </tbody>
      </table>

      {/* Tabla Principal - Haberes y Descuentos */}
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse', 
        marginBottom: '20px',
        border: '2px solid #000'
      }}>
        <tbody>
        {/* Headers */}
        <tr>
          <td style={{ 
            padding: '12px', 
            fontSize: '13px', 
            fontWeight: 'bold', 
            textAlign: 'center',
            borderRight: '2px solid #000',
            borderBottom: '2px solid #000',
            width: '50%'
          }}>HABERES</td>
          <td style={{ 
            padding: '12px', 
            fontSize: '13px', 
            fontWeight: 'bold', 
            textAlign: 'center',
            borderBottom: '2px solid #000',
            width: '50%'
          }}>DESCUENTOS</td>
        </tr>

        {/* Sueldo Base y AFP */}
        <tr>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderRight: '2px solid #000',
            borderBottom: '1px solid #ccc'
          }}>
            SUELDO BASE: <span style={{ float: 'right', fontWeight: 'bold' }}>
              ${(liquidationData.base_salary || 0).toLocaleString('es-CL')}
            </span>
          </td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderBottom: '1px solid #ccc'
          }}>
            AFP {liquidationData.afp_code || 'HABITAT'} (10%): <span style={{ float: 'right', fontWeight: 'bold' }}>
              ${(liquidationData.afp_amount || 0).toLocaleString('es-CL')}
            </span>
          </td>
        </tr>

        {/* Comisión AFP */}
        {(liquidationData.afp_commission_amount || 0) > 0 && (
          <tr>
            <td style={{ 
              padding: '8px', 
              fontSize: '11px',
              borderRight: '2px solid #000',
              borderBottom: '1px solid #ccc'
            }}></td>
            <td style={{ 
              padding: '8px', 
              fontSize: '11px',
              borderBottom: '1px solid #ccc'
            }}>
              COMISIÓN AFP ({((liquidationData.afp_commission_percentage || 0)).toFixed(2)}%): <span style={{ float: 'right', fontWeight: 'bold' }}>
                ${(liquidationData.afp_commission_amount || 0).toLocaleString('es-CL')}
              </span>
            </td>
          </tr>
        )}

        {/* Gratificación Legal */}
        {legalGratification > 0 && (
          <tr>
            <td style={{ 
              padding: '8px', 
              fontSize: '11px',
              borderRight: '2px solid #000',
              borderBottom: '1px solid #ccc'
            }}>
              GRATIFICACIÓN LEGAL: <span style={{ float: 'right', fontWeight: 'bold' }}>
                ${legalGratification.toLocaleString('es-CL')}
              </span>
            </td>
            <td style={{ 
              padding: '8px', 
              fontSize: '11px',
              borderBottom: '1px solid #ccc'
            }}></td>
          </tr>
        )}

        {/* Bonos */}
        {(liquidationData.bonuses || 0) > 0 && (
          <tr>
            <td style={{ 
              padding: '8px', 
              fontSize: '11px',
              borderRight: '2px solid #000',
              borderBottom: '1px solid #ccc'
            }}>
              BONOS: <span style={{ float: 'right', fontWeight: 'bold' }}>
                ${(liquidationData.bonuses || 0).toLocaleString('es-CL')}
              </span>
            </td>
            <td style={{ 
              padding: '8px', 
              fontSize: '11px',
              borderBottom: '1px solid #ccc'
            }}></td>
          </tr>
        )}

        {/* Horas Extra */}
        {(liquidationData.overtime_amount || 0) > 0 && (
          <tr>
            <td style={{ 
              padding: '8px', 
              fontSize: '11px',
              borderRight: '2px solid #000',
              borderBottom: '1px solid #ccc'
            }}>
              HORAS EXTRAS: <span style={{ float: 'right', fontWeight: 'bold' }}>
                ${(liquidationData.overtime_amount || 0).toLocaleString('es-CL')}
              </span>
            </td>
            <td style={{ 
              padding: '8px', 
              fontSize: '11px',
              borderBottom: '1px solid #ccc'
            }}></td>
          </tr>
        )}

        {/* Salud - Siempre mostrar */}
        <tr>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderRight: '2px solid #000',
            borderBottom: '1px solid #ccc'
          }}></td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderBottom: '1px solid #ccc'
          }}>
            {liquidationData.health_institution_code === 'FONASA' ? 'FONASA' : 'ISAPRE'} (7%): <span style={{ float: 'right', fontWeight: 'bold' }}>
              ${(liquidationData.health_amount || 0).toLocaleString('es-CL')}
            </span>
          </td>
        </tr>

        {/* Adicional Salud ISAPRE si aplica */}
        {liquidationData.health_institution_code !== 'FONASA' && (liquidationData.additional_health_amount || 0) > 0 && (
          <tr>
            <td style={{ 
              padding: '8px', 
              fontSize: '11px',
              borderRight: '2px solid #000',
              borderBottom: '1px solid #ccc'
            }}></td>
            <td style={{ 
              padding: '8px', 
              fontSize: '11px',
              borderBottom: '1px solid #ccc'
            }}>
              ADICIONAL SALUD ISAPRE: <span style={{ float: 'right', fontWeight: 'bold' }}>
                ${(liquidationData.additional_health_amount || 0).toLocaleString('es-CL')}
              </span>
            </td>
          </tr>
        )}

        {/* ✅ Seguro de Cesantía - CORREGIDO para usar campo correcto */}
        {(liquidationData.unemployment_amount || 0) > 0 && (
          <tr>
            <td style={{ 
              padding: '8px', 
              fontSize: '11px',
              borderRight: '2px solid #000',
              borderBottom: '1px solid #ccc'
            }}></td>
            <td style={{ 
              padding: '8px', 
              fontSize: '11px',
              borderBottom: '1px solid #ccc'
            }}>
              SEGURO CESANTÍA ({liquidationData.unemployment_percentage || 0.6}%): <span style={{ float: 'right', fontWeight: 'bold' }}>
                ${(liquidationData.unemployment_amount || 0).toLocaleString('es-CL')}
              </span>
            </td>
          </tr>
        )}

        {/* Línea de separación */}
        <tr>
          <td style={{ 
            padding: '10px', 
            fontSize: '12px', 
            fontWeight: 'bold',
            borderRight: '2px solid #000',
            borderTop: '2px solid #000',
            borderBottom: '2px solid #000',
            textAlign: 'center'
          }}>
            TOTAL IMPONIBLE: ${totalImponible.toLocaleString('es-CL')}
          </td>
          <td style={{ 
            padding: '10px', 
            fontSize: '12px', 
            fontWeight: 'bold',
            borderTop: '2px solid #000',
            borderBottom: '2px solid #000',
            textAlign: 'center'
          }}>
            TOTAL DESCUENTOS: ${totalDescuentos.toLocaleString('es-CL')}
          </td>
        </tr>

        {/* Asignaciones no imponibles */}
        <tr>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderRight: '2px solid #000',
            borderBottom: '1px solid #ccc'
          }}>
            COLACIÓN: <span style={{ float: 'right', fontWeight: 'bold' }}>
              ${(liquidationData.food_allowance || 0).toLocaleString('es-CL')}
            </span>
          </td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderBottom: '1px solid #ccc'
          }}>
            IMPUESTO ÚNICO: <span style={{ float: 'right', fontWeight: 'bold' }}>
              ${(liquidationData.income_tax_amount || 0).toLocaleString('es-CL')}
            </span>
          </td>
        </tr>

        <tr>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderRight: '2px solid #000',
            borderBottom: '1px solid #ccc'
          }}>
            MOVILIZACIÓN: <span style={{ float: 'right', fontWeight: 'bold' }}>
              ${(liquidationData.transport_allowance || 0).toLocaleString('es-CL')}
            </span>
          </td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderBottom: '1px solid #ccc'
          }}>
            OTROS DESCUENTOS: <span style={{ float: 'right', fontWeight: 'bold' }}>
              ${(liquidationData.total_other_deductions || 0).toLocaleString('es-CL')}
            </span>
          </td>
        </tr>

        <tr>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px',
            borderRight: '2px solid #000'
          }}>
            ASIG. FAMILIAR: <span style={{ float: 'right', fontWeight: 'bold' }}>
              ${(liquidationData.family_allowance || 0).toLocaleString('es-CL')}
            </span>
          </td>
          <td style={{ 
            padding: '8px', 
            fontSize: '11px'
          }}></td>
        </tr>
        </tbody>
      </table>

      {/* Resumen Final */}
      <div style={{ 
        border: '3px solid #000', 
        padding: '20px', 
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
          RESUMEN FINAL
        </div>
        <div style={{ fontSize: '12px', marginBottom: '5px' }}>
          <strong>TOTAL HABERES:</strong> ${(totalImponible + (liquidationData.food_allowance || 0) + (liquidationData.transport_allowance || 0) + (liquidationData.family_allowance || 0)).toLocaleString('es-CL')}
        </div>
        <div style={{ fontSize: '12px', marginBottom: '15px' }}>
          <strong>TOTAL DESCUENTOS:</strong> ${totalDescuentos.toLocaleString('es-CL')}
        </div>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          border: '2px solid #000',
          padding: '10px'
        }}>
          SUELDO LÍQUIDO: ${liquidoAPagar.toLocaleString('es-CL')}
        </div>
        <div style={{ fontSize: '10px', marginTop: '10px', fontStyle: 'italic' }}>
          Son: {numberToWords(liquidoAPagar)}
        </div>
      </div>

      {/* Firmas */}
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        border: '1px solid #000'
      }}>
        <tbody>
        <tr>
          <td style={{ 
            textAlign: 'center', 
            padding: '30px 10px 10px 10px',
            borderRight: '1px solid #000',
            width: '50%'
          }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>
              FIRMA REPRESENTANTE LEGAL
            </div>
            <div style={{ fontSize: '10px', marginTop: '10px' }}>
              {companyName}
            </div>
            <div style={{ fontSize: '10px' }}>
              {companyRut}
            </div>
          </td>
          <td style={{ 
            textAlign: 'center', 
            padding: '30px 10px 10px 10px',
            width: '50%'
          }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>
              RECIBO Y FIRMO CONFORME
            </div>
            <div style={{ fontSize: '10px', marginTop: '10px' }}>
              {employeeName.toUpperCase()}
            </div>
            <div style={{ fontSize: '10px' }}>
              {employeeRut}
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  );
};