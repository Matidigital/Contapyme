'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MinimalHeader } from './MinimalHeader'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface PayrollHeaderProps {
  title: string
  subtitle?: string
  showBackButton?: boolean
  actions?: React.ReactNode
  className?: string
}

const PayrollHeader: React.FC<PayrollHeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  actions,
  className
}) => {
  return (
    <>
      {/* MinimalHeader con logo prominente */}
      <MinimalHeader variant="premium" showNavigation={true} />
      
      {/* Context Header con información de la página */}
      <div className={cn("bg-white border-b border-gray-200", className)}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            
            {/* Información de la página */}
            <div className="flex items-center gap-4">
              {showBackButton && (
                <Link href="/payroll">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                )}
              </div>
            </div>
            
            {/* Actions */}
            {actions && (
              <div className="flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export { PayrollHeader }