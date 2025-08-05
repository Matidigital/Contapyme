'use client'

import { useState, useEffect, useCallback } from 'react'
import { IndicatorValue, IndicatorsDashboard } from '@/types'

interface UseIndicatorsOptions {
  autoUpdate?: boolean
  updateInterval?: number
  initialFetch?: boolean
}

interface UseIndicatorsReturn {
  indicators: IndicatorsDashboard
  loading: boolean
  error: string
  lastUpdated: string
  dataSource: string
  fetchIndicators: () => Promise<void>
  updateIndicators: () => Promise<void>
}

// Cache global para compartir datos entre componentes
let globalIndicators: IndicatorsDashboard = {
  monetary: [],
  currency: [],
  crypto: [],
  labor: []
}
let globalLastUpdated = ''
let globalDataSource = 'hybrid_system'
let lastFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export function useIndicators(options: UseIndicatorsOptions = {}): UseIndicatorsReturn {
  const {
    autoUpdate = false,
    updateInterval = 30 * 60 * 1000, // 30 minutos por defecto
    initialFetch = true
  } = options

  const [indicators, setIndicators] = useState<IndicatorsDashboard>(globalIndicators)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [lastUpdated, setLastUpdated] = useState<string>(globalLastUpdated)
  const [dataSource, setDataSource] = useState<string>(globalDataSource)

  const fetchIndicators = useCallback(async () => {
    try {
      // Usar caché si es reciente
      const now = Date.now()
      if (now - lastFetchTime < CACHE_DURATION && globalIndicators.monetary.length > 0) {
        console.log('📋 Usando indicadores desde caché')
        setIndicators(globalIndicators)
        setLastUpdated(globalLastUpdated)
        setDataSource(globalDataSource)
        setLoading(false)
        return
      }

      console.log('🔄 Obteniendo indicadores desde API híbrida...')
      setLoading(true)
      setError('')
      
      // Usar API híbrida que siempre funciona
      const response = await fetch('/api/indicators/hybrid')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar indicadores')
      }

      // Actualizar cache global
      globalIndicators = data.indicators
      globalLastUpdated = data.last_updated
      globalDataSource = data.source || 'hybrid_system'
      lastFetchTime = now

      // Actualizar estado local
      setIndicators(data.indicators)
      setLastUpdated(data.last_updated)
      setDataSource(data.source || 'hybrid_system')
      
      console.log(`✅ Indicadores actualizados desde: ${data.source}`)
    } catch (err) {
      console.error('❌ Error fetching indicators:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateIndicators = useCallback(async () => {
    try {
      console.log('🔄 Forzando actualización de indicadores...')
      setError('')

      // Usar API híbrida para actualización forzada
      const response = await fetch('/api/indicators/hybrid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar indicadores')
      }

      // Actualizar cache global inmediatamente
      globalIndicators = data.indicators
      globalLastUpdated = data.last_updated
      globalDataSource = data.source || 'hybrid_system'
      lastFetchTime = Date.now()

      // Actualizar estado local
      setIndicators(data.indicators)
      setLastUpdated(data.last_updated)
      setDataSource(data.source || 'hybrid_system')

      console.log(`✅ Indicadores actualizados forzadamente desde: ${data.source}`)
    } catch (err) {
      console.error('❌ Error updating indicators:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar')
    }
  }, [])

  // Fetch inicial
  useEffect(() => {
    if (initialFetch) {
      fetchIndicators()
    }
  }, [fetchIndicators, initialFetch])

  // Auto-actualización
  useEffect(() => {
    if (!autoUpdate) return

    const interval = setInterval(() => {
      console.log('🔄 Auto-actualización programada de indicadores')
      fetchIndicators()
    }, updateInterval)

    return () => clearInterval(interval)
  }, [autoUpdate, updateInterval, fetchIndicators])

  return {
    indicators,
    loading,
    error,
    lastUpdated,
    dataSource,
    fetchIndicators,
    updateIndicators
  }
}

// Hook específico para el ticker (optimizado para rendimiento)
export function useTickerIndicators() {
  return useIndicators({
    autoUpdate: true,
    updateInterval: 30 * 1000, // 30 segundos para el ticker
    initialFetch: true
  })
}

// Hook específico para la página principal (menos frecuente)
export function usePageIndicators() {
  return useIndicators({
    autoUpdate: true,
    updateInterval: 5 * 60 * 1000, // 5 minutos para la página
    initialFetch: true
  })
}