import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  backHref?: string
  actions?: React.ReactNode
  className?: string
}

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => {
  return (
    <nav className={cn("flex text-sm text-gray-500", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="w-4 h-4 mx-2 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-gray-700 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  backHref = '/',
  actions,
  className
}) => {
  return (
    <header className={cn("bg-white border-b border-gray-200", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            {/* Back button */}
            {showBackButton && (
              <Link
                href={backHref}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Volver
              </Link>
            )}

            {/* Brand - Solo Logo */}
            <Link href="/" className="flex items-center">
              <img 
                src="/images/logo.png" 
                alt="ContaPymePuq" 
                className="h-20 w-auto drop-shadow-lg hover:scale-105 transition-transform duration-200" 
              />
            </Link>

            {/* Title and subtitle */}
            {title && (
              <div className="hidden md:block border-l border-gray-200 pl-4">
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-gray-600">{subtitle}</p>
                )}
              </div>
            )}
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {actions}
            
            {/* User menu placeholder */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">D</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">Usuario Demo</p>
                <p className="text-xs text-gray-500">Modo Demo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile title */}
        {title && (
          <div className="md:hidden pb-4">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export { Header, Breadcrumbs }