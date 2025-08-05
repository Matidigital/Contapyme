'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FixedAsset } from '@/types';

// Cliente Supabase para real-time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface RealtimeAssetsHookReturn {
  isConnected: boolean;
  connectionError: string | null;
  lastUpdate: string | null;
}

export function useRealtimeAssets(
  onAssetInserted?: (asset: FixedAsset) => void,
  onAssetUpdated?: (asset: FixedAsset) => void,
  onAssetDeleted?: (assetId: string) => void,
  userId: string = 'demo-user'
): RealtimeAssetsHookReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    let channel: any = null;

    const setupRealtimeSubscription = async () => {
      try {
        console.log('🔄 Configurando subscripción real-time para activos fijos...');

        // Crear canal específico para el usuario
        channel = supabase
          .channel(`fixed_assets_user_${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'fixed_assets',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              console.log('🆕 Nuevo activo detectado (real-time):', payload.new);
              setLastUpdate(new Date().toISOString());
              onAssetInserted?.(payload.new as FixedAsset);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'fixed_assets',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              console.log('✏️ Activo actualizado (real-time):', payload.new);
              setLastUpdate(new Date().toISOString());
              onAssetUpdated?.(payload.new as FixedAsset);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'fixed_assets',
              filter: `user_id=eq.${userId}`
            },
            (payload) => {
              console.log('🗑️ Activo eliminado (real-time):', payload.old);
              setLastUpdate(new Date().toISOString());
              onAssetDeleted?.(payload.old.id);
            }
          )
          .subscribe((status) => {
            console.log('📡 Estado de subscripción real-time:', status);
            
            if (status === 'SUBSCRIBED') {
              setIsConnected(true);
              setConnectionError(null);
              console.log('✅ Subscripción real-time activa');
            } else if (status === 'CHANNEL_ERROR') {
              setIsConnected(false);
              setConnectionError('Error en el canal de comunicación');
              console.error('❌ Error en subscripción real-time');
            } else if (status === 'TIMED_OUT') {
              setIsConnected(false);
              setConnectionError('Timeout de conexión');
              console.error('⏰ Timeout en subscripción real-time');
            }
          });

      } catch (error: any) {
        console.error('❌ Error configurando real-time:', error);
        setConnectionError(error.message || 'Error desconocido');
        setIsConnected(false);
      }
    };

    setupRealtimeSubscription();

    // Cleanup al desmontar
    return () => {
      if (channel) {
        console.log('🔌 Desconectando subscripción real-time...');
        channel.unsubscribe();
        setIsConnected(false);
      }
    };
  }, [userId, onAssetInserted, onAssetUpdated, onAssetDeleted]);

  return {
    isConnected,
    connectionError,
    lastUpdate
  };
}

// Hook específico para indicadores real-time
export function useRealtimeIndicators(
  onIndicatorUpdated?: (indicator: any) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    let channel: any = null;

    const setupIndicatorsSubscription = async () => {
      try {
        console.log('🔄 Configurando subscripción real-time para indicadores...');

        channel = supabase
          .channel('economic_indicators_updates')
          .on(
            'postgres_changes',
            {
              event: '*', // Todos los eventos
              schema: 'public',
              table: 'economic_indicators'
            },
            (payload) => {
              console.log('📊 Indicador actualizado (real-time):', payload);
              setLastUpdate(new Date().toISOString());
              onIndicatorUpdated?.(payload.new || payload.old);
            }
          )
          .subscribe((status) => {
            console.log('📡 Estado subscripción indicadores:', status);
            setIsConnected(status === 'SUBSCRIBED');
          });

      } catch (error) {
        console.error('❌ Error en subscripción indicadores:', error);
        setIsConnected(false);
      }
    };

    setupIndicatorsSubscription();

    return () => {
      if (channel) {
        console.log('🔌 Desconectando subscripción indicadores...');
        channel.unsubscribe();
      }
    };
  }, [onIndicatorUpdated]);

  return {
    isConnected,
    lastUpdate
  };
}