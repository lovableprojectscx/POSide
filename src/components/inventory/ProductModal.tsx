import React, { useState, useEffect } from 'react';
import { X, Scale } from 'lucide-react';
import { Product, ProductBatch } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import Swal from 'sweetalert2';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  const { dispatch } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    category: '',
    description: '',
    taxable: true,
    active: true,
    isWeightBased: false,
    pricePerUnit: '',
    unit: 'kg',
    image: '',
    trackInventory: true,
  });
  
  const [batches, setBatches] = useState<ProductBatch[]>([]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        price: product.price.toString(),
        cost: product.cost.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
        category: product.category,
        description: product.description,
        taxable: product.taxable,
        active: product.active,
        isWeightBased: product.isWeightBased || false,
        pricePerUnit: product.pricePerUnit?.toString() || '',
        unit: product.unit || 'kg',
        image: product.image || '',
        trackInventory: product.trackInventory ?? true,
      });
      setBatches(product.batches || []);
    } else {
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        price: '',
        cost: '',
        stock: '',
        minStock: '',
        category: '',
        description: '',
        taxable: true,
        active: true,
        isWeightBased: false,
        pricePerUnit: '',
        unit: 'kg',
        image: '',
        trackInventory: true,
      });
      setBatches([]);
    }
  }, [product]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      await Swal.fire({
        title: '¡Error!',
        text: 'Por favor ingresa el nombre del producto',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    if (!formData.category.trim()) {
      await Swal.fire({
        title: '¡Error!',
        text: 'Por favor ingresa una categoría',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    if (!formData.sku.trim()) {
      await Swal.fire({
        title: '¡Error!',
        text: 'Por favor ingresa un código SKU',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    if (formData.isWeightBased) {
      if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) <= 0) {
        await Swal.fire({
          title: '¡Error!',
          text: 'Por favor ingresa un precio por unidad válido para producto por peso',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        return;
      }
    } else {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        await Swal.fire({
          title: '¡Error!',
          text: 'Por favor ingresa un precio de venta válido',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        return;
      }
    }

    if (!formData.cost || parseFloat(formData.cost) < 0) {
      await Swal.fire({
        title: '¡Error!',
        text: 'Por favor ingresa un precio de costo válido (o 0 si no aplica)',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    // Only validate stock fields if inventory tracking is enabled
    if (formData.trackInventory) {
      if (!formData.stock || parseInt(formData.stock) < 0) {
        await Swal.fire({
          title: '¡Error!',
          text: 'Por favor ingresa una cantidad de stock válida',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      if (!formData.minStock || parseInt(formData.minStock) < 0) {
        await Swal.fire({
          title: '¡Error!',
          text: 'Por favor ingresa un nivel mínimo de stock válido',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        return;
      }
    }

    const productData: Product = {
      id: product?.id || Date.now().toString(),
      name: formData.name,
      sku: formData.sku,
      barcode: formData.barcode || undefined,
      price: formData.isWeightBased ? 0 : parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      stock: formData.trackInventory ? parseInt(formData.stock) : 999999,
      minStock: formData.trackInventory ? parseInt(formData.minStock) : 0,
      category: formData.category,
      description: formData.description,
      taxable: formData.taxable,
      active: formData.active,
      isWeightBased: formData.isWeightBased,
      pricePerUnit: formData.isWeightBased ? parseFloat(formData.pricePerUnit) : undefined,
      unit: formData.isWeightBased ? formData.unit : undefined,
      image: formData.image || undefined,
      trackInventory: formData.trackInventory,
      batches,
      createdAt: product?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    try {
      const { productsService } = await import('../../lib/services');
      
      if (product) {
        await productsService.update(productData.id, productData);
        dispatch({ type: 'UPDATE_PRODUCT', payload: productData });
        await Swal.fire({
          title: '¡Éxito!',
          text: 'Producto actualizado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      } else {
        const newProduct = await productsService.create(productData);
        dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
        await Swal.fire({
          title: '¡Éxito!',
          text: 'Producto agregado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      await Swal.fire({
        title: '¡Error!',
        text: 'Error al guardar el producto. Inténtalo de nuevo.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          image: event.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addBatch = () => {
    const newBatch: ProductBatch = {
      id: Date.now().toString(),
      batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
      manufacturingDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      quantity: 0,
      costPrice: parseFloat(formData.cost) || 0,
      supplierInfo: '',
    };
    setBatches(prev => [...prev, newBatch]);
  };

  const updateBatch = (index: number, field: keyof ProductBatch, value: any) => {
    setBatches(prev => prev.map((batch, i) => 
      i === index ? { ...batch, [field]: value } : batch
    ));
  };

  const removeBatch = (index: number) => {
    setBatches(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="modal-overlay">
      <div className="modal max-w-4xl">
        <div className="modal-header">
          <h2 className="text-xl font-bold text-gray-900">
            {product ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="modal-body space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="Ej. Café Espresso"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="Ej. Bebidas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU *
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="Ej. BEB-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Barras
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="input"
                  placeholder="Escanee o ingrese código"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="textarea"
                  placeholder="Descripción detallada del producto"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Precios y Existencias</h3>
            
            <div className="mb-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isWeightBased"
                  checked={formData.isWeightBased}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <div className="flex items-center space-x-2">
                  <Scale className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Precio basado en peso / granel</span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.isWeightBased ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio por Unidad *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="pricePerUnit"
                      value={formData.pricePerUnit}
                      onChange={handleChange}
                      required
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad de Medida *
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="select"
                    >
                      <option value="kg">Kilogramo (kg)</option>
                      <option value="g">Gramo (g)</option>
                      <option value="lb">Libra (lb)</option>
                      <option value="oz">Onza (oz)</option>
                      <option value="l">Litro (l)</option>
                      <option value="ml">Mililitro (ml)</option>
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio de Venta *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Costo *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="mt-6 mb-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="trackInventory"
                  checked={formData.trackInventory}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Controlar inventario para este producto</span>
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-8">
                Al desactivar, no se controlará el nivel de existencias ni se descontará al vender
              </p>
            </div>

            {formData.trackInventory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Actual *
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel Mínimo de Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="minStock"
                    value={formData.minStock}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Imagen del Producto</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subir Imagen
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="input"
                />
              </div>
              
              {formData.image && (
                <div className="flex items-center space-x-4">
                  <img
                    src={formData.image}
                    alt="Vista previa del producto"
                    className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    className="btn btn-secondary btn-sm"
                  >
                    Eliminar Imagen
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Lotes</h3>
                <p className="text-sm text-gray-600">Controla fechas de fabricación y caducidad para un mejor inventario</p>
              </div>
              <button
                type="button"
                onClick={addBatch}
                className="btn btn-primary btn-sm"
              >
                Agregar Lote
              </button>
            </div>
            
            {batches.length > 0 && (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {batches.map((batch, index) => (
                  <div key={batch.id} className="card p-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de Lote
                        </label>
                        <input
                          type="text"
                          value={batch.batchNumber}
                          onChange={(e) => updateBatch(index, 'batchNumber', e.target.value)}
                          className="input input-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Fabricación
                        </label>
                        <input
                          type="date"
                          value={batch.manufacturingDate.toISOString().split('T')[0]}
                          onChange={(e) => updateBatch(index, 'manufacturingDate', new Date(e.target.value))}
                          className="input input-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Vencimiento
                        </label>
                        <input
                          type="date"
                          value={batch.expiryDate.toISOString().split('T')[0]}
                          onChange={(e) => updateBatch(index, 'expiryDate', new Date(e.target.value))}
                          className="input input-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={batch.quantity}
                          onChange={(e) => updateBatch(index, 'quantity', parseInt(e.target.value))}
                          className="input input-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Precio de Costo
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={batch.costPrice}
                          onChange={(e) => updateBatch(index, 'costPrice', parseFloat(e.target.value))}
                          className="input input-sm"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeBatch(index)}
                          className="btn btn-danger btn-sm w-full"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="taxable"
                  checked={formData.taxable}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <span className="ml-2 text-sm text-gray-700">Aplica Impuesto</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <span className="ml-2 text-sm text-gray-700">Activo</span>
              </label>
            </div>
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
            {product ? 'Actualizar Producto' : 'Guardar Producto'}
          </button>
        </div>
      </div>
    </div>
  );
}