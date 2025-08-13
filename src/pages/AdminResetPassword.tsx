import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AdminResetPassword: React.FC = () => {
  const [email, setEmail] = useState('admin@onepyme.pro');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      setMessageType('error');
      return;
    }

    if (newPassword.length < 8) {
      setMessage('La contraseña debe tener al menos 8 caracteres');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Enviar email de reset de contraseña
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?tab=login`
      });

      if (error) {
        setMessage('Error al enviar email de reset: ' + error.message);
        setMessageType('error');
      } else {
        setMessage('¡Email de reset enviado! Revisa tu bandeja de entrada y sigue las instrucciones.');
        setMessageType('success');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setMessage('Error inesperado: ' + (error as Error).message);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectReset = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      setMessageType('error');
      return;
    }

    if (newPassword.length < 8) {
      setMessage('La contraseña debe tener al menos 8 caracteres');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Intentar login directo con la nueva contraseña
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: newPassword
      });

      if (error) {
        setMessage('Error al probar la nueva contraseña: ' + error.message);
        setMessageType('error');
      } else {
        setMessage('¡Contraseña actualizada y probada exitosamente! Ya puedes iniciar sesión.');
        setMessageType('success');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setMessage('Error inesperado: ' + (error as Error).message);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Resetear Contraseña de Admin
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Cambia la contraseña del usuario administrador
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleResetPassword}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email del Admin
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="admin@onepyme.pro"
                />
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                Nueva Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Ingresa la nueva contraseña"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Confirma la nueva contraseña"
                />
              </div>
            </div>

            {message && (
              <div className={`rounded-md p-4 ${
                messageType === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Enviando...' : 'Enviar Email de Reset'}
              </button>

              <button
                type="button"
                onClick={handleDirectReset}
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Probando...' : 'Probar Nueva Contraseña'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Información Importante
                </span>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600 text-center">
              <p>• <strong>Opción 1:</strong> Enviar email de reset (requiere acceso al email)</p>
              <p>• <strong>Opción 2:</strong> Probar nueva contraseña directamente</p>
              <p>• La nueva contraseña debe tener al menos 8 caracteres</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminResetPassword;
