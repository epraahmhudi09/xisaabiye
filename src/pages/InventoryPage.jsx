import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AddEditProductModal } from '../components/inventory/AddEditProductModal';
import { formatCurrency } from '../utils/formatters';
import { Badge } from '../components/common/Badge';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Filter
} from 'lucide-react';

export const InventoryPage = () => {
  const { products, deleteProduct } = useData();
  const { isAdmin, isManager } = useAuth();
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Extract distinct categories
  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category || 'General')))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || product.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleOpenAdd = () => {
    if (isManager) return;
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    if (isManager) return;
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (isManager) return;
    if (window.confirm(`Are you sure you want to delete product "${name}"?`)) {
      await deleteProduct(id, name);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{t('inventory.title')}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
            {t('inventory.subtitle')}
          </p>
        </div>
        {!isManager && (
          <button
            onClick={handleOpenAdd}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-950/60 flex items-center gap-2 self-start sm:self-auto transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>{t('inventory.addProduct')}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('inventory.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs font-semibold"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat === 'ALL' ? t('common.all') : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory List — Mobile Cards */}
      <div className="sm:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-medium glass-panel rounded-2xl border border-slate-200 dark:border-slate-800">
            {t('inventory.noProducts')}
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isLowStock = product.stockQuantity < 10;
            const totalValue = (product.costPrice || 0) * (product.stockQuantity || 0);
            return (
              <div key={product.id} className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl border shrink-0 ${
                      isLowStock
                        ? 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-700 dark:text-amber-400'
                        : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      <Package className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white truncate">{product.name}</h4>
                  </div>
                  <Badge variant="purple" className="shrink-0">{product.category}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">{t('inventory.cost')}</span>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-0.5">{formatCurrency(product.costPrice)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">{t('inventory.sellPrice')}</span>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{formatCurrency(product.unitSellingPrice || product.costPrice * 1.25)}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">{t('inventory.totalValue')}</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{formatCurrency(totalValue)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className={`font-extrabold text-sm ${isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {product.stockQuantity} {t('common.units')}
                    </span>
                    {isLowStock && (
                      <Badge variant="warning" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {t('inventory.lowStock')}
                      </Badge>
                    )}
                  </div>
                </div>

                {!isManager && (
                  <div className="flex items-center gap-2 mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => handleOpenEdit(product)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-bold active:scale-95 transition-transform"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> {t('common.edit')}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-800 text-xs font-bold active:scale-95 transition-transform"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Inventory Table — Desktop */}
      <div className="hidden sm:block glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-400 tracking-wider">
                <th className="py-4 px-6">{t('inventory.productItem')}</th>
                <th className="py-4 px-6">{t('common.category')}</th>
                <th className="py-4 px-6">{t('inventory.baseCostPrice')}</th>
                <th className="py-4 px-6">{t('inventory.defaultSellingPrice')}</th>
                <th className="py-4 px-6">{t('inventory.stockStatus')}</th>
                <th className="py-4 px-6">{t('inventory.totalValue')}</th>
                {!isManager && <th className="py-4 px-6 text-right">{t('common.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-sm font-semibold">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={isManager ? "6" : "7"} className="py-12 text-center text-slate-500 font-medium">
                    {t('inventory.noProducts')}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLowStock = product.stockQuantity < 10;
                  const totalValue = (product.costPrice || 0) * (product.stockQuantity || 0);

                  return (
                    <tr key={product.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl border ${
                            isLowStock 
                              ? 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 text-amber-700 dark:text-amber-400' 
                              : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}>
                            <Package className="w-4 h-4" />
                          </div>
                          <span>{product.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant="purple">{product.category}</Badge>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(product.costPrice)}
                      </td>
                      <td className="py-4 px-6 font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(product.unitSellingPrice || product.costPrice * 1.25)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`font-extrabold text-base ${
                            isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'
                          }`}>
                            {product.stockQuantity} {t('common.units')}
                          </span>
                          {isLowStock && (
                            <Badge variant="warning" className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {t('inventory.lowStock')}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(totalValue)}
                      </td>
                      {!isManager && (
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(product)}
                              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                              title={t('common.edit')}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(product.id, product.name)}
                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/60 border border-slate-200 dark:border-slate-700 transition-colors"
                                title={t('common.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AddEditProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={editingProduct}
      />
    </div>
  );
};
