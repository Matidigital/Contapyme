import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'CLP') {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(amount)
}

export function formatDate(date: string | Date, format: 'short' | 'long' = 'short') {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'long') {
    return dateObj.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return dateObj.toLocaleDateString('es-CL')
}

export function formatPeriod(period: string) {
  if (period.length !== 6) return period
  
  const year = period.substring(0, 4)
  const month = period.substring(4, 6)
  const monthNames = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  
  return `${monthNames[parseInt(month)]} ${year}`
}