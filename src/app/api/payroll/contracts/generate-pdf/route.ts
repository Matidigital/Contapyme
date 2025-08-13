import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Función para formatear RUT chileno
function formatRut(rut: string): string {
  if (!rut) return '';
  // Limpiar el RUT de puntos y guiones existentes
  const cleanRut = rut.replace(/[.-]/g, '');
  // Separar número y dígito verificador
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  // Formatear con puntos
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
}

// Función para formatear fecha en español
function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
}

// Función para formatear moneda chilena
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Función para generar el HTML del contrato
function generateContractHTML(contractData: any): string {
  const {
    // Datos de la empresa
    company_name,
    company_rut,
    legal_representative_name,
    legal_representative_rut,
    company_address,
    company_city,
    
    // Datos del trabajador
    employee_full_name,
    employee_rut,
    employee_address,
    employee_city,
    employee_nationality,
    employee_marital_status,
    employee_birth_date,
    afp_name,
    health_insurance_name,
    
    // Datos del contrato
    position,
    department,
    start_date,
    end_date,
    contract_type,
    base_salary,
    gratification_amount,
    bonuses = [],
    allowances = {},
    workplace_address,
    schedule_details = {},
    job_functions = [],
    obligations = [],
    prohibitions = [],
    resignation_notice_days = 30,
    weekly_hours = 45
  } = contractData;

  // Calcular totales
  const totalBonuses = bonuses.reduce((sum: number, bonus: any) => sum + (bonus.amount || 0), 0);
  const totalAllowances = Object.values(allowances).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
  const totalGross = Number(base_salary) + Number(gratification_amount) + totalBonuses;

  // Formatear horarios
  const scheduleText = schedule_details.entry && schedule_details.exit
    ? `de lunes a sábado desde las ${schedule_details.entry} a las ${schedule_details.exit}`
    : 'de lunes a sábado en horario a convenir';
  
  const lunchText = schedule_details.lunch_start && schedule_details.lunch_end
    ? `desde las ${schedule_details.lunch_start} a ${schedule_details.lunch_end} hrs`
    : 'en horario a definir';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato de Trabajo - ${employee_full_name}</title>
    <style>
        @page {
            size: letter;
            margin: 2.5cm;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #000;
            margin: 0;
            padding: 0;
        }
        
        .contract-header {
            text-align: center;
            margin-bottom: 30px;
            font-weight: bold;
            font-size: 14pt;
        }
        
        .contract-content {
            text-align: justify;
            margin-bottom: 20px;
        }
        
        .clause {
            margin-bottom: 20px;
        }
        
        .clause-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        ul {
            margin: 10px 0;
            padding-left: 30px;
        }
        
        li {
            margin-bottom: 5px;
        }
        
        .salary-table {
            margin: 15px 0;
            padding-left: 40px;
        }
        
        .salary-row {
            display: flex;
            justify-content: space-between;
            max-width: 400px;
            margin-bottom: 5px;
        }
        
        .signatures {
            margin-top: 80px;
            display: flex;
            justify-content: space-between;
            text-align: center;
        }
        
        .signature-block {
            width: 40%;
        }
        
        .signature-line {
            border-top: 1px solid #000;
            margin-top: 60px;
            padding-top: 5px;
        }
        
        @media print {
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="contract-header">
        CONTRATO DE TRABAJO
    </div>
    
    <div class="contract-content">
        <p>
            En la ciudad de ${company_city || 'Punta Arenas'}, a ${formatDate(start_date)}, 
            entre <strong>${company_name}</strong> persona jurídica Rol Único Tributario 
            N°<strong>${formatRut(company_rut)}</strong>, representada en este acto por 
            ${legal_representative_name || 'su representante legal'}, Chileno(a), 
            Cédula Nacional de Identidad Nº ${formatRut(legal_representative_rut || '')}, 
            ambos domiciliados en ${company_address} en la ciudad de ${company_city || 'Punta Arenas'}, 
            en adelante el "EMPLEADOR", y don(ña):
        </p>
        
        <div style="margin: 20px 0; padding-left: 20px;">
            <table style="line-height: 1.8;">
                <tr>
                    <td style="width: 200px;"><strong>Nombre</strong></td>
                    <td>: ${employee_full_name}</td>
                </tr>
                <tr>
                    <td><strong>Cédula de Identidad</strong></td>
                    <td>: ${formatRut(employee_rut)}</td>
                </tr>
                <tr>
                    <td><strong>Domicilio</strong></td>
                    <td>: ${employee_address}</td>
                </tr>
                <tr>
                    <td><strong>Nacionalidad</strong></td>
                    <td>: ${employee_nationality || 'Chilena'}</td>
                </tr>
                <tr>
                    <td><strong>Estado Civil</strong></td>
                    <td>: ${employee_marital_status || 'No especificado'}</td>
                </tr>
                <tr>
                    <td><strong>Fecha de Nacimiento</strong></td>
                    <td>: ${formatDate(employee_birth_date)}</td>
                </tr>
                <tr>
                    <td><strong>Sistema Previsional</strong></td>
                    <td>: ${afp_name || 'AFP a definir'}</td>
                </tr>
                <tr>
                    <td><strong>Sistema de Salud</strong></td>
                    <td>: ${health_insurance_name || 'Fonasa'}</td>
                </tr>
            </table>
        </div>
        
        <p>En adelante el "TRABAJADOR"; expresan que vienen en celebrar el siguiente contrato laboral:</p>
    </div>
    
    <div class="clause">
        <div class="clause-title">PRIMERO:</div>
        <p>
            El trabajador se obliga a desarrollar la función de <strong>${position.toUpperCase()}</strong>
            ${department ? ` en el departamento de ${department}` : ''} y cualquier otra labor 
            relacionada con la función propiamente tal que le encomiende el empleador. 
            Además, consiente en ser cambiado de área de trabajo según las necesidades de la 
            empresa y alguna labor afín para la que fue contratado si fuere necesario y que 
            la alteración no produzca menoscabo para el Trabajador.
        </p>
    </div>
    
    ${job_functions.length > 0 ? `
    <div class="clause">
        <div class="clause-title">SEGUNDO:</div>
        <p>El trabajador se obliga a desarrollar las siguientes funciones específicas de ${position.toUpperCase()}:</p>
        <ul>
            ${job_functions.map(func => `<li>${func}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
    
    <div class="clause">
        <div class="clause-title">TERCERO:</div>
        <p>
            Los servicios del trabajador se deben prestar en ${workplace_address || company_address}. 
            Sin perjuicio de la facultad del empleador para modificar por causa justificada, 
            sea con consulta al trabajador y sin menoscabo de éste, el sitio en donde deban 
            prestarse los servicios, con la limitación de que el nuevo sitio o recinto quede 
            dentro de la misma localidad o ciudad.
        </p>
    </div>
    
    <div class="clause">
        <div class="clause-title">CUARTO:</div>
        <p>
            La jornada de trabajo ordinaria será distribuida ${scheduleText}, 
            total ${weekly_hours} horas semanales. 
            ${weekly_hours < 45 ? 'El trabajador será contratado como part-time, ' : ''}
            teniendo como horario de colación ${lunchText}.
        </p>
    </div>
    
    <div class="clause">
        <div class="clause-title">QUINTO:</div>
        <p>
            El trabajador percibirá una remuneración bruta mensual ${formatCurrency(totalGross)}, 
            que será afecto a los descuentos legales y pagada el último día hábil de cada mes, 
            que será distribuida de la siguiente manera:
        </p>
        
        <div class="salary-table">
            <div class="salary-row">
                <span>Sueldo Base:</span>
                <span>${formatCurrency(base_salary)}</span>
            </div>
            <div class="salary-row">
                <span>Gratificación Legal:</span>
                <span>${formatCurrency(gratification_amount)}</span>
            </div>
            ${bonuses.map((bonus: any) => `
            <div class="salary-row">
                <span>${bonus.description || 'Bono'}:</span>
                <span>${formatCurrency(bonus.amount)}</span>
            </div>
            `).join('')}
        </div>
        
        ${totalAllowances > 0 ? `
        <p>Además el trabajador recibirá remuneración no imponible por los siguientes conceptos:</p>
        <div class="salary-table">
            ${allowances.meal ? `
            <div class="salary-row">
                <span>Asignación de Colación:</span>
                <span>${formatCurrency(allowances.meal)}</span>
            </div>
            ` : ''}
            ${allowances.transport ? `
            <div class="salary-row">
                <span>Asignación de Movilización:</span>
                <span>${formatCurrency(allowances.transport)}</span>
            </div>
            ` : ''}
            ${allowances.cash ? `
            <div class="salary-row">
                <span>Asignación de Caja:</span>
                <span>${formatCurrency(allowances.cash)}</span>
            </div>
            ` : ''}
        </div>
        ` : ''}
    </div>
    
    ${obligations.length > 0 || prohibitions.length > 0 ? `
    <div class="clause">
        <div class="clause-title">SEXTO:</div>
        <p>
            De las obligaciones y prohibiciones. Son obligaciones y prohibiciones esenciales 
            del presente contrato de trabajo y cuya infracción se entenderá como infracción 
            grave a las obligaciones que impone el contrato, sin perjuicio de que esta causal 
            sea calificada por los tribunales de justicia, las siguientes:
        </p>
        
        ${obligations.length > 0 ? `
        <p><strong>Obligaciones:</strong></p>
        <ul>
            ${obligations.map(obl => `<li>${obl}</li>`).join('')}
        </ul>
        ` : ''}
        
        ${prohibitions.length > 0 ? `
        <p><strong>Prohibiciones:</strong></p>
        <ul>
            ${prohibitions.map(proh => `<li>${proh}</li>`).join('')}
        </ul>
        ` : ''}
    </div>
    ` : ''}
    
    <div class="clause">
        <div class="clause-title">SÉPTIMO:</div>
        <p>
            El trabajador se obliga a realizar todas las labores propias e inherentes del 
            cargo para el que se le contrata; además, se entiende que para el correcto 
            desempeño de este trabajo es indispensable que el trabajador cuente con la 
            iniciativa y conocimientos necesarios para atender los múltiples requerimientos 
            de su cargo.
        </p>
    </div>
    
    <div class="clause">
        <div class="clause-title">OCTAVO:</div>
        <p>
            En caso de renuncia voluntaria, se debe dar el aviso correspondiente con a lo 
            menos ${resignation_notice_days} días de anticipación como mínimo y deberá presentar 
            esta renuncia por escrito y firmarla ante Notario o en la Inspección del Trabajo. 
            En caso de que no se dé aviso de la renuncia por parte del trabajador en la forma 
            indicada, éste será responsable de los perjuicios causados por una renuncia intempestiva.
        </p>
    </div>
    
    <div class="clause">
        <div class="clause-title">NOVENO:</div>
        <p>
            El presente contrato comenzará a regir el <strong>${formatDate(start_date)}</strong>
            ${end_date 
              ? ` y tendrá una duración hasta el <strong>${formatDate(end_date)}</strong>.`
              : ' y tendrá duración indefinida.'}
        </p>
    </div>
    
    <div class="clause">
        <div class="clause-title">DÉCIMO:</div>
        <p>
            Para todos los efectos derivados del presente contrato, las partes fijan su 
            domicilio en la ciudad de ${company_city || 'Punta Arenas'} y se someten a la 
            jurisdicción de sus tribunales.
        </p>
    </div>
    
    <p style="margin-top: 30px;">
        El presente contrato se extiende en dos ejemplares, quedando uno en poder del 
        empleador y uno en poder del trabajador.
    </p>
    
    <p style="margin-top: 20px;">En comprobante firman.</p>
    
    <div class="signatures">
        <div class="signature-block">
            <div class="signature-line">
                <strong>${legal_representative_name || 'Representante Legal'}</strong><br>
                ${formatRut(legal_representative_rut || company_rut)}<br>
                EMPLEADOR(A)
            </div>
        </div>
        
        <div class="signature-block">
            <div class="signature-line">
                <strong>${employee_full_name}</strong><br>
                ${formatRut(employee_rut)}<br>
                TRABAJADOR(A)
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// POST: Generar PDF del contrato
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contract_id, format = 'html' } = body;

    if (!contract_id) {
      return NextResponse.json({ error: 'contract_id es requerido' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener los datos completos del contrato
    const { data: contractData, error: fetchError } = await supabase
      .from('contract_full_details')
      .select('*')
      .eq('id', contract_id)
      .single();

    if (fetchError) {
      console.error('Error fetching contract:', fetchError);
      return NextResponse.json({ 
        error: 'Contrato no encontrado',
        details: fetchError.message 
      }, { status: 404 });
    }

    // Generar el HTML del contrato
    const html = generateContractHTML(contractData);

    // Si el formato solicitado es HTML, devolver el HTML directamente
    if (format === 'html') {
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="contrato_${contractData.employee_rut}.html"`
        }
      });
    }

    // Si se solicita PDF, necesitamos una librería adicional
    // Por ahora devolvemos el HTML con instrucciones para convertir a PDF
    return NextResponse.json({
      success: true,
      message: 'HTML del contrato generado exitosamente',
      html,
      instructions: 'Para generar PDF, abra el HTML en el navegador y use Imprimir > Guardar como PDF'
    });

  } catch (error) {
    console.error('Error in POST /api/payroll/contracts/generate-pdf:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}