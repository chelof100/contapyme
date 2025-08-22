import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
// Cliente admin eliminado por seguridad - usar solo en scripts de backend
import { toast } from 'sonner';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Shield, 
  UserPlus, 
  X,
  Key,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'contador' | 'usuario' | 'developer';
  empresa_id: string;
  created_at: string;
  last_login?: string;
}

const UsuariosAdmin = () => {
  const { isAdmin, user } = useAuth();
  

  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newUser, setNewUser] = useState<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'contador' | 'usuario' | 'developer';
  }>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'usuario',
  });

  // Verificar permisos
  if (!isAdmin()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Acceso denegado</h3>
          <p className="text-gray-500">Solo los administradores pueden acceder a esta página.</p>
        </div>
      </div>
    );
  }

  // Cargar usuarios
  const fetchUsers = async () => {
    try {
      console.log('🔍 [Usuarios] Starting to fetch users...');
      
      // ✅ CORRECCIÓN: Usar query directamente sin timeout personalizado
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🔍 [Usuarios] Query result:', { data, error });

      if (error) {
        console.error('❌ [Usuarios] Supabase error:', error);
        throw error;
      }
      
      console.log('✅ [Usuarios] Users loaded:', data?.length || 0);
      setUsers(data || []);
      
    } catch (error) {
      console.error('❌ [Usuarios] Error fetching users:', error);
      toast.error('Error al cargar usuarios: ' + (error.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Reset password de usuario
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserForReset) return;
    
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setResettingPassword(true);
    
    try {
      // Debug: Verificar datos del usuario
      console.log('🔍 Usuario a resetear:', selectedUserForReset);
      console.log('🔒 Función de reset deshabilitada por seguridad');
      
      // Función de reset de password movida a script de backend por seguridad
      toast.error('Función de reset de password no disponible en frontend por seguridad');
      return;

      // Función deshabilitada por seguridad
      console.log('✅ Función de reset deshabilitada por seguridad');
    } catch (error) {
      console.error('💥 Error inesperado:', error);
      toast.error('Error inesperado: ' + (error as Error).message);
    } finally {
      setResettingPassword(false);
    }
  };

  // Actualizar rol de usuario
  const updateUserRole = async (userId: string, newRole: 'admin' | 'contador' | 'usuario' | 'developer') => {
    if (userId === user?.id && newRole !== 'admin' && newRole !== 'developer') {
      toast.error('No puedes cambiar tu propio rol de administrador o desarrollador');
      return;
    }

    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      toast.success('Rol actualizado exitosamente');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Error al actualizar el rol');
    } finally {
      setUpdating(null);
    }
  };

  // Eliminar usuario
  const deleteUser = async () => {
    if (!selectedUserForDelete) return;

    // Prevenir que el usuario se elimine a sí mismo
    if (selectedUserForDelete.id === user?.id) {
      toast.error('No puedes eliminar tu propia cuenta');
      return;
    }

    // Prevenir eliminar el último admin/developer
    const adminDevCount = users.filter(u => u.role === 'admin' || u.role === 'developer').length;
    if ((selectedUserForDelete.role === 'admin' || selectedUserForDelete.role === 'developer') && adminDevCount <= 1) {
      toast.error('No puedes eliminar el último administrador del sistema');
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUserForDelete.id);

      if (error) throw error;

      setUsers(users.filter(u => u.id !== selectedUserForDelete.id));
      toast.success('Usuario eliminado exitosamente');
      
      // Cerrar modal
      setShowDeleteConfirm(false);
      setSelectedUserForDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error al eliminar el usuario');
    } finally {
      setDeleting(false);
    }
  };

  // Crear nuevo usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            first_name: newUser.firstName,
            last_name: newUser.lastName,
            role: newUser.role,
          },
        },
      });

      if (error) throw error;

      toast.success('Usuario creado exitosamente!');
      setShowCreateUser(false);
      setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'usuario' });
      fetchUsers(); // Refresh users after creation
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error al crear usuario');
    } finally {
      setCreating(false);
    }
  };

  // Obtener badge de rol
  const getRoleBadge = (role: string) => {
    const styles = {
      developer: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      contador: 'bg-blue-100 text-blue-800',
      usuario: 'bg-gray-100 text-gray-800'
    };
    return styles[role as keyof typeof styles] || styles.usuario;
  };

  // Obtener permisos del rol
  const getRolePermissions = (role: string) => {
    const permissions = {
      developer: ['Super Administrador', 'Configuración del sistema', 'Gestión completa', 'Acceso a base de datos', 'Gestión de API', 'Configuración avanzada'],
      admin: ['Gestión completa', 'Configuración del sistema', 'Gestión de usuarios'],
      contador: ['Ver todos los datos', 'Editar facturas', 'Reportes contables'],
      usuario: ['Ver sus propios datos', 'Crear facturas básicas']
    };
    return permissions[role as keyof typeof permissions] || [];
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500">Administra roles y permisos de usuarios</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setShowCreateUser(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Crear Usuario
          </Button>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">{users.length} usuarios</span>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Administradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'admin' || u.role === 'developer').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Contadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'contador').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'usuario').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de usuarios */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead>Fecha de registro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.username || 'Sin nombre'
                        }
                      </div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadge(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {getRolePermissions(user.role).map((perm, idx) => (
                        <div key={idx}>• {perm}</div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Select
                        value={user.role}
                        onValueChange={(newRole: 'admin' | 'contador' | 'usuario' | 'developer') => 
                          updateUserRole(user.id, newRole)
                        }
                        disabled={updating === user.id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usuario">Usuario</SelectItem>
                          <SelectItem value="contador">Contador</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="developer">Developer</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserForReset(user);
                          setShowResetPassword(true);
                        }}
                        className="flex items-center space-x-1"
                      >
                        <Key className="h-4 w-4" />
                        <span>Reset</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserForDelete(user);
                          setShowDeleteConfirm(true);
                        }}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={user.id === user?.id || ((user.role === 'admin' || user.role === 'developer') && users.filter(u => u.role === 'admin' || u.role === 'developer').length <= 1)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Eliminar</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Crear Usuario */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Crear Nuevo Usuario</h2>
              <button
                onClick={() => setShowCreateUser(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                  placeholder="usuario@empresa.com"
                />
              </div>
               
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                  placeholder="Contraseña segura"
                />
              </div>
               
              <div>
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                  placeholder="Nombre del usuario"
                />
              </div>
               
              <div>
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                  placeholder="Apellido del usuario"
                />
              </div>
               
              <div>
                <Label htmlFor="role">Rol</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: 'admin' | 'contador' | 'usuario' | 'developer') => 
                    setNewUser({...newUser, role: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usuario">Usuario</SelectItem>
                    <SelectItem value="contador">Contador</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               
              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {creating ? 'Creando...' : 'Crear Usuario'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateUser(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Reset Password */}
      {showResetPassword && selectedUserForReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Resetear Password</h2>
              <button
                onClick={() => {
                  setShowResetPassword(false);
                  setSelectedUserForReset(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Usuario:</strong> {selectedUserForReset.email}
              </p>
            </div>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Nueva contraseña"
                  minLength={8}
                />
              </div>
               
              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirmar contraseña"
                  minLength={8}
                />
              </div>
               
              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  disabled={resettingPassword}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {resettingPassword ? 'Reseteando...' : 'Resetear Password'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowResetPassword(false);
                    setSelectedUserForReset(null);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && selectedUserForDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-red-600">Confirmar Eliminación</h2>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedUserForDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center mb-2">
                <Trash2 className="h-5 w-5 text-red-600 mr-2" />
                <p className="font-medium text-red-800">¿Estás seguro?</p>
              </div>
              <p className="text-sm text-red-700 mb-2">
                Esta acción eliminará permanentemente al usuario:
              </p>
              <p className="text-sm font-medium text-red-800">
                <strong>{selectedUserForDelete.first_name} {selectedUserForDelete.last_name}</strong>
                <br />
                <span className="text-red-600">{selectedUserForDelete.email}</span>
              </p>
              <p className="text-xs text-red-600 mt-2">
                Esta acción no se puede deshacer.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={deleteUser}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? 'Eliminando...' : 'Sí, Eliminar Usuario'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedUserForDelete(null);
                }}
                className="flex-1"
                disabled={deleting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosAdmin;
