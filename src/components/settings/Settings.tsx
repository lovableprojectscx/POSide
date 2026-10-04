import React, { useState } from 'react';
import { Save, Store, DollarSign, Printer, Users, Globe, FileText, Lock } from 'lucide-react';
import { useApp, useInvoiceStats } from '../../context/SupabaseAppContext';
import { useAuth } from '../../context/AuthContext';
import { LogoUpload } from './LogoUpload';
import { swalConfig } from '../../lib/sweetAlert';

export function Settings() {
  const { state, dispatch } = useApp();
  const { profile } = useAuth();
  const getInvoiceStats = useInvoiceStats();
  const invoiceStats = getInvoiceStats();
  const [formData, setFormData] = useState({
    storeName: state.settings.storeName,
    storeAddress: state.settings.storeAddress,
    storePhone: state.settings.storePhone || '',
    storeEmail: state.settings.storeEmail || '',
    storeLogo: state.settings.storeLogo,
    taxRate: state.settings.taxRate.toString(),
    currency: state.settings.currency,
    receiptPrinter: state.settings.receiptPrinter,
    autoBackup: state.settings.autoBackup,
    theme: state.settings.theme || 'light',
    invoicePrefix: state.settings.invoicePrefix || 'INV',
    invoiceCounter: state.settings.invoiceCounter?.toString() || '1000',
  });

  // Check if user has permission to change settings
  const canEditSettings = profile?.role === 'admin' || profile?.role === 'manager';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!canEditSettings) return;
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleLogoChange = (logo: string | undefined) => {
    if (!canEditSettings) return;
    setFormData(prev => ({ ...prev, storeLogo: logo }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEditSettings) {
      swalConfig.error('No tienes permisos para modificar la configuración. Solo los administradores y gerentes pueden modificar la tienda.');
      return;
    }
    
    try {
      swalConfig.loading('Guardando configuración...');
      const { settingsService } = await import('../../lib/services');
      const updatedSettings = {
        ...formData,
        taxRate: parseFloat(formData.taxRate),
        invoiceCounter: parseInt(formData.invoiceCounter),
      };
      
      await settingsService.update(updatedSettings);
      dispatch({
        type: 'SET_SETTINGS',
        payload: updatedSettings
      });
      swalConfig.success('¡Configuración guardada exitosamente!');
    } catch (error) {
      console.error('Error saving settings:', error);
      swalConfig.error('Error al guardar la configuración. Intente nuevamente.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600 mt-2">Configura las preferencias de tu sistema POS e información de la tienda</p>
          {!canEditSettings && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center space-x-3">
              <Lock className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800 text-sm">
                <strong>Acceso de solo lectura:</strong> Solo los administradores y gerentes pueden modificar esta configuración.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          {/* Store Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-100 p-2 rounded-xl">
                <Store className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Información de la Tienda</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre de la Tienda *
                    </label>
                    <input
                      type="text"
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleChange}
                      disabled={!canEditSettings}
                      required
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!canEditSettings ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Número de Teléfono
                    </label>
                    <input
                      type="tel"
                      name="storePhone"
                      value={formData.storePhone}
                      onChange={handleChange}
                      disabled={!canEditSettings}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!canEditSettings ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      name="storeEmail"
                      value={formData.storeEmail}
                      onChange={handleChange}
                      disabled={!canEditSettings}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!canEditSettings ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Moneda
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      disabled={!canEditSettings}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!canEditSettings ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    >
                      <option value="S/">S/ - Sol Peruano (S/)</option>
                      <option value="PEN">PEN - Sol Peruano (PEN)</option>
                      <option value="USD">USD - Dólar Estadounidense ($)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="GBP">GBP - Libra Esterlina (£)</option>
                      <option value="CAD">CAD - Dólar Canadiense (C$)</option>
                      <option value="LKR">LKR - Rupia de Sri Lanka (Rs)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dirección de la Tienda
                  </label>
                  <textarea
                    name="storeAddress"
                    value={formData.storeAddress}
                    onChange={handleChange}
                    disabled={!canEditSettings}
                    rows={3}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!canEditSettings ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              <div>
                <LogoUpload
                  currentLogo={formData.storeLogo}
                  onLogoChange={handleLogoChange}
                  disabled={!canEditSettings}
                />
              </div>
            </div>
          </div>

          {/* Financial Settings */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-green-100 p-2 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Configuración Financiera</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tasa de Impuesto / IGV (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleChange}
                  disabled={!canEditSettings}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!canEditSettings ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Invoice Settings */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-purple-100 p-2 rounded-xl">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Configuración de Facturación</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prefijo de Factura / Boleta
                </label>
                <input
                  type="text"
                  name="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={handleChange}
                  disabled={!canEditSettings}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!canEditSettings ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="FAC"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Siguiente Número de Comprobante
                </label>
                <input
                  type="number"
                  name="invoiceCounter"
                  value={formData.invoiceCounter}
                  onChange={handleChange}
                  disabled={!canEditSettings}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!canEditSettings ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs text-blue-700">
                    <div className="font-medium mb-1">Vista Previa de Facturación:</div>
                    <div>Siguiente: <span className="font-mono font-bold">{invoiceStats.nextInvoiceNumber}</span></div>
                    <div>Total Generadas: {invoiceStats.totalInvoices}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Preferences */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-purple-100 p-2 rounded-xl">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Preferencias del Sistema</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tema de Interfaz
                </label>
                <select
                  name="theme"
                  value={formData.theme}
                  onChange={handleChange}
                  disabled={!canEditSettings}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!canEditSettings ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                  <option value="auto">Automático</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hardware Settings */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-orange-100 p-2 rounded-xl">
                <Printer className="h-6 w-6 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Configuración de Hardware</h2>
            </div>
            
            <div className="space-y-4">
              <label className={`flex items-center p-4 border border-gray-200 rounded-xl transition-colors ${!canEditSettings ? 'bg-gray-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                <input
                  type="checkbox"
                  name="receiptPrinter"
                  checked={formData.receiptPrinter}
                  onChange={handleChange}
                  disabled={!canEditSettings}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <div className="ml-4">
                  <span className="text-sm font-semibold text-gray-900">Habilitar Impresora de Recibos</span>
                  <p className="text-xs text-gray-600">Imprimir recibos automáticamente después de cada venta</p>
                </div>
              </label>

              <label className={`flex items-center p-4 border border-gray-200 rounded-xl transition-colors ${!canEditSettings ? 'bg-gray-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                <input
                  type="checkbox"
                  name="autoBackup"
                  checked={formData.autoBackup}
                  onChange={handleChange}
                  disabled={!canEditSettings}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <div className="ml-4">
                  <span className="text-sm font-semibold text-gray-900">Habilitar Copia de Seguridad Automática</span>
                  <p className="text-xs text-gray-600">Respaldar datos automáticamente en el almacenamiento local</p>
                </div>
              </label>
            </div>
          </div>

          {/* Current User Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-red-100 p-2 rounded-xl">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Usuario Actual</h2>
            </div>
            
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{state.currentUser?.name}</h3>
                    <p className="text-sm text-gray-600">Rol: {state.currentUser?.role === 'admin' ? 'Administrador' : state.currentUser?.role === 'manager' ? 'Gerente' : 'Cajero'}</p>
                    <p className="text-sm text-gray-600">Correo: {state.currentUser?.email}</p>
                  </div>
                </div>
                <span className="inline-flex px-4 py-2 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                  Activo
                </span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-8 border-t border-gray-200">
            <button
              type="submit"
              disabled={!canEditSettings}
              className={`flex items-center space-x-3 px-8 py-4 rounded-xl transition-all duration-200 font-semibold shadow-lg ${
                canEditSettings 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Save className="h-5 w-5" />
              <span>{canEditSettings ? 'Guardar Configuración' : 'Acceso Denegado'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}