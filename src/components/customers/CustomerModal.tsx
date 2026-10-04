import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Customer } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import { swalConfig } from '../../lib/sweetAlert';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function CustomerModal({ isOpen, onClose, customer }: CustomerModalProps) {
  const { dispatch } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    creditLimit: '',
    priceTier: 'Standard',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        creditLimit: customer.creditLimit.toString(),
        priceTier: customer.priceTier,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        creditLimit: '0',
        priceTier: 'Standard',
      });
    }
  }, [customer]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      swalConfig.warning('Por favor ingresa el nombre del cliente');
      return;
    }

    if (!formData.email.trim()) {
      swalConfig.warning('Por favor ingresa el correo electrónico');
      return;
    }

    if (!formData.phone.trim()) {
      swalConfig.warning('Por favor ingresa el número de teléfono');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      swalConfig.warning('Por favor ingresa un correo electrónico válido');
      return;
    }

    const customerData: Customer = {
      id: customer?.id || Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      creditLimit: parseFloat(formData.creditLimit) || 0,
      creditUsed: customer?.creditUsed || 0,
      priceTier: formData.priceTier,
      totalPurchases: customer?.totalPurchases || 0,
      lastPurchase: customer?.lastPurchase,
      createdAt: customer?.createdAt || new Date(),
    };

    try {
      swalConfig.loading(`${customer ? 'Actualizando' : 'Creando'} cliente...`);
      const { customersService } = await import('../../lib/services');
      
      if (customer) {
        await customersService.update(customerData.id, customerData);
        dispatch({ type: 'UPDATE_CUSTOMER', payload: customerData });
        swalConfig.success('¡Cliente actualizado correctamente!');
      } else {
        const newCustomer = await customersService.create(customerData);
        dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
        swalConfig.success('¡Cliente registrado correctamente!');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      swalConfig.error('Error al guardar el cliente. Intente nuevamente.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal max-w-md">
        <div className="modal-header">
          <h2 className="text-xl font-bold text-gray-900">
            {customer ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="modal-body space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input"
              placeholder="Ingresa el nombre completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Teléfono *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="input"
              placeholder="Ej. +51 987654321"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="textarea"
              placeholder="Dirección del cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Límite de Crédito
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="creditLimit"
              value={formData.creditLimit}
              onChange={handleChange}
              className="input"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nivel de Precio
            </label>
            <select
              name="priceTier"
              value={formData.priceTier}
              onChange={handleChange}
              className="select"
            >
              <option value="Standard">Estándar</option>
              <option value="Premium">Premium</option>
              <option value="VIP">VIP</option>
              <option value="Wholesale">Mayorista</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-md"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary btn-md"
          >
            {customer ? 'Actualizar Cliente' : 'Guardar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}