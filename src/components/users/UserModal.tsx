import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Shield, Crown } from 'lucide-react';
import { User as UserType } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import { usersService } from '../../lib/services';
import { supabaseAdmin, isSupabaseConfigured } from '../../lib/supabase';
import { swalConfig } from '../../lib/sweetAlert';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserType | null;
}

export function UserModal({ isOpen, onClose, user }: UserModalProps) {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'cashier' as 'admin' | 'manager' | 'cashier',
    active: true,
    avatar: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        name: user.name,
        email: user.email,
        password: '', // Don't pre-fill password for existing users
        role: user.role,
        active: user.active,
        avatar: user.avatar || ''
      });
    } else {
      setFormData({
        username: '',
        name: '',
        email: '',
        password: '',
        role: 'cashier',
        active: true,
        avatar: ''
      });
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        // Update existing user
        const updatedUser = await usersService.update(user.id, {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          active: formData.active,
          avatar: formData.avatar || undefined
        });
        
        dispatch({ 
          type: 'SET_USERS', 
          payload: state.users.map(u => u.id === user.id ? updatedUser : u)
        });
      } else {
        // Create new user
        if (!formData.password || formData.password.length < 6) {
          swalConfig.error('La contraseña debe tener al menos 6 caracteres');
          return;
        }

        if (!isSupabaseConfigured) {
          const newUser = await usersService.create({
            username: formData.username,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            permissions: [],
            active: formData.active,
            avatar: formData.avatar || undefined
          });

          dispatch({ 
            type: 'SET_USERS', 
            payload: [...state.users, newUser]
          });
          swalConfig.success('¡Usuario creado correctamente!');
          onClose();
          return;
        }
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true
        });

        if (authError) throw authError;

        // Then create the user profile directly in the database
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            username: formData.username,
            name: formData.name,
            email: formData.email,
            role: formData.role,
            permissions: [],
            active: formData.active,
            avatar: formData.avatar || null
          })
          .select()
          .single();

        if (profileError) throw profileError;

        const newUser: UserType = {
          id: profileData.id,
          username: profileData.username,
          name: profileData.name,
          email: profileData.email,
          role: profileData.role,
          permissions: profileData.permissions || [],
          active: profileData.active,
          avatar: profileData.avatar || undefined
        };

        dispatch({ 
          type: 'SET_USERS', 
          payload: [...state.users, newUser]
        });
      }

      onClose();
    } catch (error: any) {
      swalConfig.error(`Error al ${user ? 'actualizar' : 'crear'} usuario: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const rolePermissions = {
    admin: ['Acceso total al sistema', 'Gestión de usuarios', 'Configuración del sistema', 'Todos los reportes'],
    manager: ['Gestión de ventas', 'Control de inventario', 'Gestión de clientes', 'Reportes básicos'],
    cashier: ['Operaciones de POS', 'Ventas básicas', 'Búsqueda de clientes', 'Impresión de recibos']
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <User className="h-6 w-6 text-blue-600" />
            <span>{user ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input pl-10"
                  placeholder="Ingresa el nombre completo"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de Usuario *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="input"
                placeholder="Ingresa nombre de usuario"
                disabled={!!user} // Disable editing username for existing users
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input pl-10"
                  placeholder="correo@ejemplo.com"
                  disabled={!!user} // Disable editing email for existing users
                />
              </div>
            </div>

            {/* Password Field - Only show for new users */}
            {!user && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!user}
                    minLength={6}
                    className="input pl-10"
                    placeholder="Ingresa contraseña (mínimo 6 caracteres)"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol *
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="select pl-10"
                  disabled={user?.id === state.currentUser?.id} // Prevent self-role change
                >
                  <option value="cashier">Cajero</option>
                  <option value="manager">Gerente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>
          </div>

          {/* Role Permissions Display */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              {formData.role === 'admin' && <Crown className="h-4 w-4 text-amber-500" />}
              {formData.role === 'manager' && <Shield className="h-4 w-4 text-blue-500" />}
              {formData.role === 'cashier' && <User className="h-4 w-4 text-gray-500" />}
              <span>Permisos de {formData.role === 'admin' ? 'Administrador' : formData.role === 'manager' ? 'Gerente' : 'Cajero'}</span>
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              {rolePermissions[formData.role].map((permission, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <span>{permission}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL de Avatar (Opcional)
            </label>
            <input
              type="url"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              className="input"
              placeholder="https://ejemplo.com/avatar.jpg"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="active"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={user?.id === state.currentUser?.id} // Prevent self-deactivation
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Usuario Activo
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-md"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-md"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (user ? 'Actualizar Usuario' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
