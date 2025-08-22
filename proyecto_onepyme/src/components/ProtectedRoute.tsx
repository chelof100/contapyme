
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  try {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  } catch (error) {
    console.error('❌ [ProtectedRoute] Error accessing auth context:', error);
    
    // Si hay error de contexto, mostrar loading hasta que se resuelva
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <div className="ml-3 text-red-600">Inicializando autenticación...</div>
      </div>
    );
  }
};

export default ProtectedRoute;
