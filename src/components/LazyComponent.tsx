import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import LoadingSpinner from './LoadingSpinner';

interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

const DefaultErrorFallback: React.FC<{ error: Error; resetErrorBoundary: () => void }> = ({ 
  error, 
  resetErrorBoundary 
}) => (
  <div className="flex flex-col items-center justify-center p-4 text-center">
    <div className="text-red-600 mb-2">
      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold mb-2">Algo salió mal</h3>
    <p className="text-gray-600 mb-4 text-sm">{error.message}</p>
    <button
      onClick={resetErrorBoundary}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      Intentar de nuevo
    </button>
  </div>
);

export const LazyComponent: React.FC<LazyComponentProps> = ({ 
  children, 
  fallback = <LoadingSpinner size="lg" text="Cargando componente..." />,
  errorFallback = DefaultErrorFallback
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={errorFallback}
      onError={(error, errorInfo) => {
        console.error('Lazy component error:', error, errorInfo);
      }}
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

export default LazyComponent; 