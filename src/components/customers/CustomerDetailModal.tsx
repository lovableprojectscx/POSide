import React, { useState, useMemo } from 'react';
import { X, User, Mail, Phone, MapPin, CreditCard, Calendar, ShoppingBag, Receipt } from 'lucide-react';
import { Customer, Sale } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import { format } from 'date-fns';

interface CustomerDetailModalProps {
  customer: Customer;
  onClose: () => void;
}

export function CustomerDetailModal({ customer, onClose }: CustomerDetailModalProps) {
  const { state } = useApp();
  const [activeTab, setActiveTab] = useState<'details' | 'transactions'>('details');

  // Get customer transactions
  const customerTransactions = useMemo(() => {
    return state.sales
      .filter(sale => sale.customerId === customer.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [state.sales, customer.id]);

  const totalTransactions = customerTransactions.length;
  const totalSpent = customerTransactions.reduce((sum, sale) => sum + sale.total, 0);
  const averageTransaction = totalTransactions > 0 ? totalSpent / totalTransactions : 0;
  const creditAvailable = customer.creditLimit - customer.creditUsed;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      case 'credit': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{customer.name}</h2>
                <p className="text-blue-100">ID de Cliente: {customer.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-6">
            {[
              { id: 'details', label: 'Detalles del Cliente', icon: User },
              { id: 'transactions', label: 'Historial de Transacciones', icon: Receipt },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'details' | 'transactions')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'details' && (
            <div className="space-y-8">
              {/* Customer Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-2xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Gasto Total</p>
                      <p className="text-2xl font-bold">{state.settings.currency} {totalSpent.toFixed(2)}</p>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-2xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Transacciones</p>
                      <p className="text-2xl font-bold">{totalTransactions}</p>
                    </div>
                    <Receipt className="h-8 w-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-2xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Ticket Promedio</p>
                      <p className="text-2xl font-bold">{state.settings.currency} {averageTransaction.toFixed(2)}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-2xl text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Crédito Disponible</p>
                      <p className="text-2xl font-bold">{state.settings.currency} {creditAvailable.toFixed(2)}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Información de Contacto</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Correo Electrónico</p>
                        <p className="text-gray-900">{customer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Teléfono</p>
                        <p className="text-gray-900">{customer.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Dirección</p>
                        <p className="text-gray-900">{customer.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Información de la Cuenta</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Nivel de Precio</p>
                        <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                          {customer.priceTier}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Miembro Desde</p>
                        <p className="text-gray-900">{format(new Date(customer.createdAt), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Última Compra</p>
                        <p className="text-gray-900">
                          {customer.lastPurchase 
                            ? format(new Date(customer.lastPurchase), 'dd/MM/yyyy')
                            : 'Nunca'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Credit Information */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Información de Crédito</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Límite de Crédito</p>
                    <p className="text-xl font-bold text-gray-900">{state.settings.currency} {customer.creditLimit.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Crédito Usado</p>
                    <p className="text-xl font-bold text-red-600">{state.settings.currency} {customer.creditUsed.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Crédito Disponible</p>
                    <p className="text-xl font-bold text-green-600">{state.settings.currency} {creditAvailable.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="bg-white rounded-xl p-2">
                    <div className="bg-blue-500 h-3 rounded-lg" style={{ width: `${customer.creditLimit > 0 ? (customer.creditUsed / customer.creditLimit) * 100 : 0}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {customer.creditLimit > 0 ? ((customer.creditUsed / customer.creditLimit) * 100).toFixed(1) : 0}% del límite de crédito utilizado
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Historial de Transacciones</h3>
                <p className="text-gray-600">{totalTransactions} transacciones</p>
              </div>

              {customerTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No se encontraron transacciones</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customerTransactions.map((transaction) => (
                    <div key={transaction.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-gray-900">#{transaction.receiptNumber}</h4>
                          <p className="text-sm text-gray-600">
                            {format(new Date(transaction.timestamp), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {state.settings.currency} {transaction.total.toFixed(2)}
                          </p>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status === 'completed' ? 'Completada' : transaction.status === 'pending' ? 'Pendiente' : transaction.status === 'refunded' ? 'Reembolsada' : transaction.status === 'credit' ? 'A Crédito' : transaction.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Artículos</p>
                          <p className="font-medium">{transaction.items.length} artículos</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Método de Pago</p>
                          <p className="font-medium capitalize">
                            {transaction.paymentMethod === 'cash' ? 'Efectivo' : transaction.paymentMethod === 'card' ? 'Tarjeta' : transaction.paymentMethod === 'credit' ? 'Crédito' : transaction.paymentMethod === 'digital' ? 'Digital' : transaction.paymentMethod}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Cajero</p>
                          <p className="font-medium">{transaction.cashier}</p>
                        </div>
                      </div>

                      {transaction.items.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-600 mb-2">Artículos:</p>
                          <div className="space-y-1">
                            {transaction.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.product.name} × {item.quantity}</span>
                                <span>{state.settings.currency} {item.subtotal.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}