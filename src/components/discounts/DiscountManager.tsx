import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Percent, Gift, Calendar, Users } from 'lucide-react';
import { Discount } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import { DiscountModal } from './DiscountModal';
import { format } from 'date-fns';
import { swalConfig } from '../../lib/sweetAlert';

export function DiscountManager() {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  const filteredDiscounts = state.discounts.filter(discount =>
    discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditDiscount = (discount: Discount) => {
    setEditingDiscount(discount);
    setShowDiscountModal(true);
  };

  const handleDeleteDiscount = async (discountId: string) => {
    const result = await swalConfig.deleteConfirm('discount');
    if (result.isConfirmed) {
      try {
        swalConfig.loading('Eliminando descuento...');
        const { discountsService } = await import('../../lib/services');
        await discountsService.delete(discountId);
        dispatch({ type: 'DELETE_DISCOUNT', payload: discountId });
        swalConfig.success('¡Descuento eliminado correctamente!');
      } catch (error) {
        console.error('Error deleting discount:', error);
        swalConfig.error('Error al eliminar el descuento. Intente nuevamente.');
      }
    }
  };

  const handleAddDiscount = () => {
    setEditingDiscount(null);
    setShowDiscountModal(true);
  };

  const toggleDiscountStatus = async (discount: Discount) => {
    try {
      swalConfig.loading(`${discount.active ? 'Desactivando' : 'Activando'} descuento...`);
      const updatedDiscount = { ...discount, active: !discount.active };
      const { discountsService } = await import('../../lib/services');
      await discountsService.update(discount.id, updatedDiscount);
      dispatch({
        type: 'UPDATE_DISCOUNT',
        payload: updatedDiscount
      });
      swalConfig.success(`¡Descuento ${discount.active ? 'desactivado' : 'activado'} correctamente!`);
    } catch (error) {
      console.error('Error updating discount:', error);
      swalConfig.error('Error al actualizar el descuento. Intente nuevamente.');
    }
  };

  const getDiscountTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage':
      case 'fixed':
        return <Percent className="h-4 w-4" />;
      case 'free_gift':
        return <Gift className="h-4 w-4" />;
      default:
        return <Percent className="h-4 w-4" />;
    }
  };

  const getDiscountTypeColor = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'bg-blue-100 text-blue-800';
      case 'fixed':
        return 'bg-green-100 text-green-800';
      case 'free_gift':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Descuentos y Promociones</h1>
          <p className="text-gray-600 mt-1">Administra descuentos automáticos y ofertas promocionales</p>
        </div>
        
        <button
          onClick={handleAddDiscount}
          className="btn btn-primary btn-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Agregar Descuento</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="stat-card bg-gradient-to-br from-blue-500 to-blue-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Descuentos</p>
              <p className="text-2xl lg:text-3xl font-bold">{state.discounts.length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Percent className="h-6 w-6 lg:h-8 lg:w-8" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-green-500 to-green-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-green-100 text-sm font-medium">Descuentos Activos</p>
              <p className="text-2xl lg:text-3xl font-bold">
                {state.discounts.filter(d => d.active).length}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Gift className="h-6 w-6 lg:h-8 lg:w-8" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-purple-500 to-purple-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-purple-100 text-sm font-medium">Descuentos Porcentuales</p>
              <p className="text-2xl lg:text-3xl font-bold">
                {state.discounts.filter(d => d.type === 'percentage').length}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Percent className="h-6 w-6 lg:h-8 lg:w-8" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-orange-500 to-orange-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-orange-100 text-sm font-medium">Ofertas de Regalo</p>
              <p className="text-2xl lg:text-3xl font-bold">
                {state.discounts.filter(d => d.type === 'free_gift').length}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Gift className="h-6 w-6 lg:h-8 lg:w-8" />
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
              placeholder="Buscar descuentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Discounts Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Descuento</th>
                <th className="table-header-cell">Tipo</th>
                <th className="table-header-cell">Valor</th>
                <th className="table-header-cell">Condiciones</th>
                <th className="table-header-cell">Período de Validez</th>
                <th className="table-header-cell">Estado</th>
                <th className="table-header-cell text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDiscounts.map((discount) => (
                <tr key={discount.id} className="table-row">
                  <td className="table-cell">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{discount.name}</div>
                      <div className="text-xs text-gray-500">{discount.description}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${getDiscountTypeColor(discount.type)} flex items-center space-x-1`}>
                      {getDiscountTypeIcon(discount.type)}
                      <span>{discount.type === 'percentage' ? 'Porcentaje' : discount.type === 'fixed' ? 'Monto Fijo' : discount.type === 'free_gift' ? 'Regalo' : discount.type}</span>
                    </span>
                  </td>
                  <td className="table-cell font-semibold">
                    {discount.type === 'percentage' && `${discount.value}%`}
                    {discount.type === 'fixed' && `${state.settings.currency} ${discount.value}`}
                    {discount.type === 'free_gift' && 'Regalo Gratis'}
                  </td>
                  <td className="table-cell">
                    <div className="text-xs text-gray-600">
                      {discount.conditions.length} condición(es)
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-xs">
                      <div>{format(new Date(discount.validFrom), 'dd/MM/yyyy')}</div>
                      <div className="text-gray-500">al {format(new Date(discount.validTo), 'dd/MM/yyyy')}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => toggleDiscountStatus(discount)}
                      className={`badge ${
                        discount.active ? 'badge-success' : 'badge-danger'
                      } cursor-pointer hover:opacity-80`}
                    >
                      {discount.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditDiscount(discount)}
                        title="Editar descuento"
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDiscount(discount.id)}
                        title="Eliminar descuento"
                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        discount={editingDiscount}
      />
    </div>
  );
}