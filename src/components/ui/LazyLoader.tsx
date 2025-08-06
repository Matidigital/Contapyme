import React, { Suspense } from 'react';
import { Preloader } from './Preloader';

interface LazyLoaderProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  errorFallback?: React.ComponentType<{ error: Error }>;
}

export const LazyLoader: React.FC<LazyLoaderProps> = ({ 
  children, 
  fallback: CustomFallback, 
  errorFallback: ErrorFallback 
}) => {
  const FallbackComponent = CustomFallback || (() => (
    <div className="flex items-center justify-center min-h-[400px]">
      <Preloader />
    </div>
  ));

  return (
    <Suspense fallback={<FallbackComponent />}>
      {children}
    </Suspense>
  );
};

// Hook para lazy loading de componentes pesados
export const useLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> => {
  return React.lazy(importFn);
};

// Componente para lazy loading de rutas
export const LazyRoute: React.FC<{
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  props?: Record<string, any>;
}> = ({ component: Component, props = {} }) => {
  return (
    <LazyLoader>
      <Component {...props} />
    </LazyLoader>
  );
};