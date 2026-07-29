import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';

export const AddEditProductModal = ({ isOpen, onClose, productToEdit = null }) => {
  const { addProduct, updateProduct } = useData();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [costPrice, setCostPrice] = useState('');
  const [unitSellingPrice, setUnitSellingPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setCategory(productToEdit.category || 'General');
      setCostPrice(productToEdit.costPrice || '');
      setUnitSellingPrice(productToEdit.unitSellingPrice || '');
      setStockQuantity(productToEdit.stockQuantity || 0);
    } else {
      setName('');
      setCategory('General');
      setCostPrice('');
      setUnitSellingPrice('');
      setStockQuantity('');
    }
    setError('');
  }, [productToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    const cost = parseFloat(costPrice);
    if (isNaN(cost) || cost < 0) {
      setError('Please enter a valid cost price.');
      return;
    }

    const selling = parseFloat(unitSellingPrice);
    if (isNaN(selling) || selling < 0) {
      setError('Please enter a valid unit selling price.');
      return;
    }

    const stock = parseInt(stockQuantity, 10);
    if (isNaN(stock) || stock < 0) {
      setError('Please enter a valid stock quantity.');
      return;
    }

    setSubmitting(true);
    try {
      if (productToEdit) {
        await updateProduct(productToEdit.id, {
          name,
          category,
          costPrice: cost,
          unitSellingPrice: selling,
          stockQuantity: stock
        });
      } else {
        await addProduct({
          name,
          category,
          costPrice: cost,
          unitSellingPrice: selling,
          stockQuantity: stock
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={productToEdit ? 'Edit Product Item' : 'Add New Inventory Item'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Product Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dhuxul (Charcoal 25kg)"
            className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-semibold"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Category *
          </label>
          <input
            type="text"
            list="categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Dhuxul, Baggage, General"
            className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
            required
          />
          <datalist id="categories">
            <option value="Dhuxul" />
            <option value="Baggage" />
            <option value="General" />
            <option value="Groceries" />
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Base Cost Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="e.g. 12.00"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Default Selling Price ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={unitSellingPrice}
              onChange={(e) => setUnitSellingPrice(e.target.value)}
              placeholder="e.g. 15.00"
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-bold text-emerald-400"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
            Initial Stock Quantity *
          </label>
          <input
            type="number"
            min="0"
            value={stockQuantity}
            onChange={(e) => setStockQuantity(e.target.value)}
            placeholder="e.g. 50"
            className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-bold"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md"
          >
            {submitting ? 'Saving...' : productToEdit ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
