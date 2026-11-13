import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { api } from '../../api.js';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  X,
  Check,
  AlertCircle,
  Tag,
  Layers,
  Image as ImageIcon,
  Palette,
  Boxes,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function ProductsManager() {
  const { lang, t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name_en: '',
    name_ur: '',
    sku: '',
    category_id: '',
    price: 0,
    is_price_on_request: 0,
    unit: 'Piece',
    track_stock: 0,
    is_available: 1,
    is_featured: 0,
    image_url: '',
    description_en: '',
    description_ur: '',
  });

  // Dynamic Rich Variants List State
  const [variantsList, setVariantsList] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.getAdminProducts(),
        api.getAdminCategories(),
      ]);

      if (prodRes.success) setProducts(prodRes.products || []);
      if (catRes.success) setCategories(catRes.categories || []);
    } catch (err) {
      console.error('Failed to load products/categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to convert legacy variants or rich variants into editable array of objects
  const normalizeVariantsForForm = (rawVariants, basePrice, isPriceOnReq) => {
    if (!rawVariants || !Array.isArray(rawVariants) || rawVariants.length === 0) {
      return [];
    }

    return rawVariants.map((item, idx) => {
      if (typeof item === 'string') {
        return {
          id: `var-${Date.now()}-${idx}`,
          name: item,
          color: '',
          color_code: '',
          size: item,
          sku: '',
          price: basePrice || 0,
          is_price_on_request: isPriceOnReq ? 1 : 0,
          stock_quantity: 0,
          image_url: '',
          is_available: 1,
        };
      }
      return {
        id: item.id || `var-${Date.now()}-${idx}`,
        name: item.name || item.size || item.color || `Variant ${idx + 1}`,
        color: item.color || '',
        color_code: item.color_code || '',
        size: item.size || '',
        material: item.material || '',
        model: item.model || '',
        sku: item.sku || '',
        price: item.price !== undefined ? item.price : (basePrice || 0),
        is_price_on_request: item.is_price_on_request ? 1 : 0,
        stock_quantity: item.stock_quantity || 0,
        image_url: item.image_url || '',
        is_available: item.is_available ?? 1,
      };
    });
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name_en: '',
      name_ur: '',
      sku: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      price: 0,
      is_price_on_request: 0,
      unit: 'Piece',
      track_stock: 0,
      is_available: 1,
      is_featured: 0,
      image_url: '',
      description_en: '',
      description_ur: '',
    });
    setVariantsList([
      {
        id: `var-${Date.now()}-1`,
        name: 'Standard',
        color: '',
        color_code: '',
        size: '',
        sku: '',
        price: 0,
        is_price_on_request: 0,
        stock_quantity: 0,
        image_url: '',
        is_available: 1,
      },
    ]);
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name_en: prod.name_en || '',
      name_ur: prod.name_ur || '',
      sku: prod.sku || '',
      category_id: prod.category_id || '',
      price: prod.price || 0,
      is_price_on_request: prod.is_price_on_request ? 1 : 0,
      unit: prod.unit || 'Piece',
      track_stock: prod.track_stock ? 1 : 0,
      is_available: prod.is_available ?? 1,
      is_featured: prod.is_featured ? 1 : 0,
      image_url: prod.image_url || '',
      description_en: prod.description_en || '',
      description_ur: prod.description_ur || '',
    });
    setVariantsList(normalizeVariantsForForm(prod.variants, prod.price, prod.is_price_on_request));
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleAddVariantRow = () => {
    setVariantsList((prev) => [
      ...prev,
      {
        id: `var-${Date.now()}-${prev.length}`,
        name: '',
        color: '',
        color_code: '',
        size: '',
        sku: '',
        price: formData.price || 0,
        is_price_on_request: formData.is_price_on_request ? 1 : 0,
        stock_quantity: 0,
        image_url: '',
        is_available: 1,
      },
    ]);
  };

  const handleUpdateVariant = (index, field, value) => {
    setVariantsList((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveVariant = (index) => {
    setVariantsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await api.deleteProduct(id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name_en.trim() || !formData.name_ur.trim()) {
      setErrorMsg('Product name in both English and Urdu is required');
      return;
    }

    try {
      setSubmitting(true);

      // Clean up variants list: ensure name is populated
      const cleanedVariants = variantsList
        .filter((v) => v.name?.trim() || v.color?.trim() || v.size?.trim())
        .map((v) => {
          const finalName =
            v.name?.trim() ||
            [v.size, v.color].filter(Boolean).join(' - ') ||
            'Standard';
          return {
            ...v,
            name: finalName,
            color: v.color?.trim() || '',
            color_code: v.color_code?.trim() || '',
            size: v.size?.trim() || '',
            sku: v.sku?.trim() || '',
            price: v.is_price_on_request ? 0 : parseFloat(v.price) || parseFloat(formData.price) || 0,
            is_price_on_request: v.is_price_on_request ? 1 : 0,
            stock_quantity: parseInt(v.stock_quantity, 10) || 0,
            image_url: v.image_url?.trim() || '',
            is_available: Number(v.is_available ?? 1),
          };
        });

      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        track_stock: formData.track_stock ? 1 : 0,
        variants: cleanedVariants,
      };

      if (editingProduct) {
        const res = await api.updateProduct(editingProduct.id, payload);
        if (res.success) {
          setModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.createProduct(payload);
        if (res.success) {
          setModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  // Build hierarchical categories list for selection & filtering
  const buildCategoryOptions = (cats) => {
    const map = new Map();
    const roots = [];

    cats.forEach((c) => {
      map.set(c.id, { ...c, children: [] });
    });

    cats.forEach((c) => {
      const node = map.get(c.id);
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    const options = [];
    const traverse = (nodes, prefix = '') => {
      nodes.forEach((node) => {
        options.push({
          id: node.id,
          label: prefix ? `${prefix} ↳ ${node.name_en}` : node.name_en,
          name_ur: node.name_ur,
        });
        if (node.children && node.children.length > 0) {
          traverse(node.children, prefix ? `${prefix}    ` : '  ');
        }
      });
    };
    traverse(roots);
    return options;
  };

  const categoryOptions = buildCategoryOptions(categories);

  // Filtered products
  const filtered = products.filter((p) => {
    const catMatch =
      filterCategory === 'all' || String(p.category_id) === String(filterCategory);
    const searchMatch =
      !searchTerm.trim() ||
      p.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name_ur.includes(searchTerm) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    return catMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by name or SKU..."
              className="w-full ps-9 pe-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-700 max-w-xs"
          >
            <option value="all">All Categories</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-brand-600/25 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addProduct')}</span>
        </button>
      </div>

      {/* Products Grid / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No products found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left rtl:text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                  <th className="p-3 sm:p-4">Product & Variants</th>
                  <th className="p-3 sm:p-4">Category</th>
                  <th className="p-3 sm:p-4">SKU / Code</th>
                  <th className="p-3 sm:p-4 text-center">Unit</th>
                  <th className="p-3 sm:p-4 text-right">Base Price</th>
                  <th className="p-3 sm:p-4 text-center">Availability</th>
                  <th className="p-3 sm:p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((prod) => {
                  const variants = Array.isArray(prod.variants) ? prod.variants : [];
                  const variantCount = variants.length;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={prod.image_url || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=150&q=80'}
                            alt={prod.name_en}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{prod.name_en}</div>
                            <div className="text-xs text-slate-500 font-urdu">{prod.name_ur}</div>

                            {/* Variants Badges */}
                            {variantCount > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {variants.slice(0, 4).map((v, vIdx) => {
                                  const vLabel = typeof v === 'string' ? v : (v.name || [v.size, v.color].filter(Boolean).join(' '));
                                  const colorCode = typeof v === 'object' ? v.color_code : null;
                                  return (
                                    <span
                                      key={vIdx}
                                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                                    >
                                      {colorCode && (
                                        <span
                                          className="w-2 h-2 rounded-full border border-black/20"
                                          style={{ backgroundColor: colorCode }}
                                        />
                                      )}
                                      <span>{vLabel}</span>
                                    </span>
                                  );
                                })}
                                {variantCount > 4 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                                    +{variantCount - 4} more
                                  </span>
                                )}
                              </div>
                            )}

                            {prod.track_stock === 1 && (
                              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                                <Boxes className="w-3 h-3" />
                                <span>Stock Tracking Active</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3 sm:p-4">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-brand-50 text-brand-800 border border-brand-200">
                          {prod.category_name_en || 'Uncategorized'}
                        </span>
                      </td>

                      <td className="p-3 sm:p-4 font-mono text-slate-700 text-xs">
                        {prod.sku || '-'}
                      </td>

                      <td className="p-3 sm:p-4 text-center text-slate-600">
                        {prod.unit}
                      </td>

                      <td className="p-3 sm:p-4 text-right font-mono font-bold text-slate-900">
                        {prod.is_price_on_request ? (
                          <span className="text-brand-600 text-xs font-sans font-bold">Request</span>
                        ) : (
                          `PKR ${Number(prod.price).toLocaleString()}`
                        )}
                      </td>

                      <td className="p-3 sm:p-4 text-center">
                        {prod.is_available === 1 ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            In Stock
                          </span>
                        ) : prod.is_available === 2 ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            On Order
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Out of Stock
                          </span>
                        )}
                      </td>

                      <td className="p-3 sm:p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingProduct ? t('editProduct') : t('addProduct')}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure product details, category, pricing, colors, and variant options.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 mt-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-5">
              {/* Product Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('productNameEn')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    placeholder="e.g. Luxury Brass Basin Mixer Faucet"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('productNameUr')} *
                  </label>
                  <input
                    type="text"
                    required
                    dir="rtl"
                    value={formData.name_ur}
                    onChange={(e) => setFormData({ ...formData, name_ur: e.target.value })}
                    placeholder="مثلاً: براس بیسن مکسر نلکا"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 font-urdu"
                  />
                </div>
              </div>

              {/* Category, SKU, Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('category')}
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">No Category (Uncategorized)</option>
                    {categoryOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('sku')}
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. MIX-BR-01"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('productUnit')}
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Piece, Bundle, Meter, Carton"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Price & Availability & Tracking */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('pricePkr')}
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    disabled={formData.is_price_on_request === 1}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg font-mono disabled:opacity-50"
                  />
                  <label className="inline-flex items-center gap-2 mt-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_price_on_request === 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_price_on_request: e.target.checked ? 1 : 0,
                        })
                      }
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>{t('isPriceOnRequest')}</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('availability')}
                  </label>
                  <select
                    value={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: Number(e.target.value) })}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={1}>In Stock</option>
                    <option value={2}>Available on Order</option>
                    <option value={0}>Out of Stock</option>
                  </select>

                  <label className="inline-flex items-center gap-2 mt-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured === 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_featured: e.target.checked ? 1 : 0,
                        })
                      }
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>{t('featuredOnHome')}</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stock Inventory
                  </label>
                  <label className="inline-flex items-center gap-2 mt-1 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.track_stock === 1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          track_stock: e.target.checked ? 1 : 0,
                        })
                      }
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>{t('trackStockLabel')}</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enable to keep track of available quantity per color / variant.
                  </p>
                </div>
              </div>

              {/* Main Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('imageUrl')}
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('descriptionEn')}
                  </label>
                  <textarea
                    rows="2"
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t('descriptionUr')}
                  </label>
                  <textarea
                    rows="2"
                    dir="rtl"
                    value={formData.description_ur}
                    onChange={(e) => setFormData({ ...formData, description_ur: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg font-urdu"
                  ></textarea>
                </div>
              </div>

              {/* PRODUCT VARIANTS, COLORS & OPTIONS SECTION */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-brand-600" />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {t('productVariantsTitle')}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {t('productVariantsSubtitle')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('addVariantRow')}</span>
                  </button>
                </div>

                {variantsList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No custom variants specified. This product will be added as a single standard item.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {variantsList.map((v, idx) => (
                      <div
                        key={v.id || idx}
                        className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 relative shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">
                            Variant #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Remove this variant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              {t('variantName')} *
                            </label>
                            <input
                              type="text"
                              value={v.name}
                              onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                              placeholder="e.g. Chrome / 1/2 inch"
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              {t('variantColor')}
                            </label>
                            <input
                              type="text"
                              value={v.color || ''}
                              onChange={(e) => handleUpdateVariant(idx, 'color', e.target.value)}
                              placeholder="e.g. Chrome / Black / Gold"
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              {t('variantColorCode')}
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={v.color_code || '#cccccc'}
                                onChange={(e) => handleUpdateVariant(idx, 'color_code', e.target.value)}
                                className="w-7 h-7 p-0 border border-slate-200 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={v.color_code || ''}
                                onChange={(e) => handleUpdateVariant(idx, 'color_code', e.target.value)}
                                placeholder="#RRGGBB"
                                className="flex-1 text-xs px-2 py-1.5 border border-slate-200 rounded-lg font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              {t('variantSize')}
                            </label>
                            <input
                              type="text"
                              value={v.size || ''}
                              onChange={(e) => handleUpdateVariant(idx, 'size', e.target.value)}
                              placeholder="e.g. 1/2 inch, 3/4 inch"
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              {t('variantSku')}
                            </label>
                            <input
                              type="text"
                              value={v.sku || ''}
                              onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value)}
                              placeholder="e.g. FAU-CHR-01"
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              Price (PKR)
                            </label>
                            <input
                              type="number"
                              value={v.price !== undefined ? v.price : formData.price}
                              onChange={(e) => handleUpdateVariant(idx, 'price', e.target.value)}
                              placeholder={String(formData.price)}
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              {t('variantStock')}
                            </label>
                            <input
                              type="number"
                              value={v.stock_quantity || 0}
                              onChange={(e) => handleUpdateVariant(idx, 'stock_quantity', e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              Variant Image URL (Optional)
                            </label>
                            <input
                              type="url"
                              value={v.image_url || ''}
                              onChange={(e) => handleUpdateVariant(idx, 'image_url', e.target.value)}
                              placeholder="https://..."
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : t('saveProduct')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
