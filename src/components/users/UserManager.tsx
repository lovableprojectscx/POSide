import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Crown, Shield, User } from 'lucide-react';
import { User as UserType } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import { usersService } from '../../lib/services';
import { UserModal } from './UserModal';
import { swalConfig } from '../../lib/sweetAlert';

export function UserManager() {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredUsers = state.users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditUser = (user: UserType) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === state.currentUser?.id) {
      swalConfig.warning('No puedes eliminar tu propia cuenta');
      return;
    }

    const result = await swalConfig.deleteConfirm('user');
    if (result.isConfirmed) {
      setLoading(true);
      swalConfig.loading('Eliminando usuario...');
      try {
        await usersService.delete(userId);
        dispatch({ type: 'SET_USERS', payload: state.users.filter(u => u.id !== userId) });
        swalConfig.success('¡Usuario eliminado correctamente!');
      } catch (error: any) {
        swalConfig.error(`Error al eliminar usuario: ${error.message}`);
      } finally {
        setLoading(false);
        swalConfig.close();
      }
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowUserModal(true);
  };

  const toggleUserStatus = async (user: UserType) => {
    if (user.id === state.currentUser?.id) {
      swalConfig.warning('No puedes desactivar tu propia cuenta');
      return;
    }

    setLoading(true);
    swalConfig.loading(`${user.active ? 'Desactivando' : 'Activando'} usuario...`);
    try {
      const updatedUser = await usersService.update(user.id, { active: !user.active });
      dispatch({ 
        type: 'SET_USERS', 
        payload: state.users.map(u => u.id === user.id ? updatedUser : u)
      });
      swalConfig.success(`¡Usuario ${user.active ? 'desactivado' : 'activado'} correctamente!`);
    } catch (error: any) {
      swalConfig.error(`Error al actualizar usuario: ${error.message}`);
    } finally {
      setLoading(false);
      swalConfig.close();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'manager':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'badge-warning';
      case 'manager':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  };

  const activeUsers = state.users.filter(u => u.active).length;
  const adminUsers = state.users.filter(u => u.role === 'admin').length;
  const managerUsers = state.users.filter(u => u.role === 'manager').length;
  const cashierUsers = state.users.filter(u => u.role === 'cashier').length;

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra los usuarios del sistema y sus permisos</p>
        </div>
        
        <button
          onClick={handleAddUser}
          disabled={loading}
          className="btn btn-primary btn-lg disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
          <span>Agregar Usuario</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="stat-card bg-gradient-to-br from-blue-500 to-blue-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total de Usuarios</p>
              <p className="text-2xl lg:text-3xl font-bold text-white">{state.users.length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <User className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-green-500 to-green-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-green-100 text-sm font-medium">Usuarios Activos</p>
              <p className="text-2xl lg:text-3xl font-bold text-white">{activeUsers}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <UserCheck className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-purple-500 to-purple-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-purple-100 text-sm font-medium">Administradores</p>
              <p className="text-2xl lg:text-3xl font-bold text-white">{adminUsers}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Crown className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-orange-500 to-orange-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-orange-100 text-sm font-medium">Gerentes</p>
              <p className="text-2xl lg:text-3xl font-bold text-white">{managerUsers}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Shield className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Usuario</th>
                <th className="table-header-cell">Rol</th>
                <th className="table-header-cell">Último Acceso</th>
                <th className="table-header-cell">Estado</th>
                <th className="table-header-cell text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-sm">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${getRoleColor(user.role)} flex items-center space-x-1`}>
                      {getRoleIcon(user.role)}
                      <span>{user.role === 'admin' ? 'Administrador' : user.role === 'manager' ? 'Gerente' : 'Cajero'}</span>
                    </span>
                  </td>
                  <td className="table-cell">
                    {user.lastLogin ? (
                      <div className="text-xs">
                        <div>{new Date(user.lastLogin).toLocaleDateString()}</div>
                        <div className="text-gray-500">{new Date(user.lastLogin).toLocaleTimeString()}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Nunca</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => toggleUserStatus(user)}
                      disabled={loading || user.id === state.currentUser?.id}
                      className={`badge ${
                        user.active ? 'badge-success' : 'badge-danger'
                      } cursor-pointer hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {user.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        disabled={loading}
                        title="Editar usuario"
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {user.id !== state.currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={loading}
                          title="Eliminar usuario"
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        user={editingUser}
      />
    </div>
  );
}
