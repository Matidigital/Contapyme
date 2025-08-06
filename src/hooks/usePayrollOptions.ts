/**
 * Hook personalizado para obtener opciones dinámicas de AFP e ISAPRE
 * Conecta configuración de empresa con formularios de empleados
 */

import { useState, useEffect } from 'react';

interface AFPOption {
  code: string;
  name: string;
  commission_percentage: number;
  display_name: string;
}

interface HealthOption {
  code: string;
  name: string;
  base_percentage: number;
  display_name: string;
}

interface PayrollOptions {
  afp_options: AFPOption[];
  health_options: HealthOption[];
  has_custom_config: boolean;
  last_updated: string;
}

interface UsePayrollOptionsReturn {
  options: PayrollOptions | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePayrollOptions(companyId: string): UsePayrollOptionsReturn {
  const [options, setOptions] = useState<PayrollOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = async () => {
    if (!companyId) {
      setError('Company ID es requerido');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Obteniendo opciones dinámicas de configuración...');
      
      const response = await fetch(`/api/payroll/config/options?company_id=${companyId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }

      if (data.success) {
        setOptions(data.data);
        console.log(`✅ Opciones dinámicas obtenidas: ${data.data.afp_options.length} AFP, ${data.data.health_options.length} salud`);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar opciones';
      setError(errorMessage);
      console.error('❌ Error obteniendo opciones dinámicas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, [companyId]);

  return {
    options,
    loading,
    error,
    refetch: fetchOptions
  };
}

// Hook adicional para obtener opciones específicas de AFP
export function useAFPOptions(companyId: string) {
  const { options, loading, error, refetch } = usePayrollOptions(companyId);
  
  return {
    afpOptions: options?.afp_options || [],
    loading,
    error,
    refetch
  };
}

// Hook adicional para obtener opciones específicas de salud
export function useHealthOptions(companyId: string) {
  const { options, loading, error, refetch } = usePayrollOptions(companyId);
  
  return {
    healthOptions: options?.health_options || [],
    loading,
    error,
    refetch
  };
}