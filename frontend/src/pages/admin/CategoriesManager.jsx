import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { api } from '../../api.js';
import { Plus, Edit2, Trash2, Layers, X, AlertCircle, CornerDownRight, FolderTree, AlertTriangle } from 'lucide-react';

export default function CategoriesManager() {
  const { lang, t, isRtl } = useLanguage();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Safe Deletion Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [categoryUsage, setCategoryUsage] = useState(null);
  const [deleteAction, setDeleteAction] = useState('reassign'); // 'reassign' | 'detach'
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState({
    parent_id: '',
    name_en: '',
    name_ur: '',
    slug: '',
    description_en: '',
    description_ur: '',
    display_order: 0,
    is_active: 1,
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminCategories();
      if (res.success) {
        setCategories(res.categories || []);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = (defaultParentId = '') => {
    setEditingCategory(null);
    setFormData({
      parent_id: defaultParentId ? String(defaultParentId) : '',
      name_en: '',
      name_ur: '',
      slug: '',
      description_en: '',
      description_ur: '',
      display_order: categories.length + 1,
      is_active: 1,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      parent_id: cat.parent_id ? String(cat.parent_id) : '',
      name_en: cat.name_en || '',
      name_ur: cat.name_ur || '',
      slug: cat.slug || '',
      description_en: cat.description_en || '',
      description_ur: cat.description_ur || '',
      display_order: cat.display_order ?? 0,
      is_active: cat.is_active ?? 1,
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleDeleteClick = async (cat) => {
    try {
      setDeleteLoading(true);
      const usageRes = await api.getCategoryUsage(cat.id);
      if (usageRes.success) {
        setDeletingCategory(cat);
        setCategoryUsage(usageRes);
        // Default target category to the first available other category
        const others = usageRes.other_categories || [];
        setTargetCategoryId(others.length > 0 ? String(others[0].id) : '');
        setDeleteAction(others.length > 0 ? 'reassign' : 'detach');
        setDeleteModalOpen(true);
      } else {
        alert(usageRes.error || 'Failed to inspect category contents');
      }
    } catch (err) {
      alert(err.message || 'Failed to check category usage');
    } finally {
      setDeleteLoading(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      setDeleteLoading(true);
      const res = await api.deleteCategory(deletingCategory.id, {
        action: deleteAction,
        target_category_id: deleteAction === 'reassign' && targetCategoryId ? Number(targetCategoryId) : null,
      });

      if (res.success) {
        setDeleteModalOpen(false);
        setDeletingCategory(null);
        setCategoryUsage(null);
        fetchCategories();
      } else {
        alert(res.error || 'Failed to delete category');
      }
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name_en.trim() || !formData.name_ur.trim()) {
      setErrorMsg('Category name in both English and Urdu is required');
      return;
    }

    const payload = {
      ...formData,
      parent_id: formData.parent_id ? Number(formData.parent_id) : null,
    };

    try {
      setSubmitting(true);
      if (editingCategory) {
        const res = await api.updateCategory(editingCategory.id, payload);
        if (res.success) {
          setModalOpen(false);
          fetchCategories();
        }
      } else {
        const res = await api.createCategory(payload);
        if (res.success) {
          setModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  // Build a tree of categories for hierarchical display and parent selector
  const buildCategoryHierarchy = (cats) => {
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

    const sortNodes = (nodes) => {
      nodes.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
      nodes.forEach((n) => sortNodes(n.children));
    };
    sortNodes(roots);

    // Flatten tree with depth for table rendering
    const flattened = [];
    const traverse = (nodes, depth = 0, path = []) => {
      nodes.forEach((node) => {
        const currentPath = [...path, lang === 'ur' ? node.name_ur : node.name_en];
        flattened.push({
          ...node,
          depth,
          breadcrumb: currentPath.join(' → '),
        });
        if (node.children && node.children.length > 0) {
          traverse(node.children, depth + 1, currentPath);
        }
      });
    };
    traverse(roots);

    return { roots, flattened };
  };

  const { flattened: hierarchicalCategories } = buildCategoryHierarchy(categories);

  // Eligible parent options (prevent choosing self or descendants when editing)
  const getEligibleParents = () => {
    if (!editingCategory) return categories;
    // Helper to find all descendants
    const descendantIds = new Set();
    const collectDescendants = (parentId) => {
      categories.forEach((c) => {
        if (c.parent_id === parentId && !descendantIds.has(c.id)) {
          descendantIds.add(c.id);
          collectDescendants(c.id);
        }
      });
    };
    collectDescendants(editingCategory.id);
    return categories.filter((c) => c.id !== editingCategory.id && !descendantIds.has(c.id));
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">
            <FolderTree className="w-4 h-4" />
            <span>{t('categoryTree')}</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {lang === 'ur' ? 'پروڈکٹ کیٹیگریز اور ذیلی کیٹیگریز' : 'Product Categories & Subcategories'}
          </h3>
          <p className="text-xs text-slate-500">
            {lang === 'ur'
              ? 'سینیٹری پروڈکٹس کو کثیر سطحی کیٹیگریز اور ذیلی کیٹیگریز میں منظم کریں۔'
              : 'Organize sanitary products into multi-level nested categories with subcategories and breadcrumb navigation.'}
          </p>
        </div>

        <button
          onClick={() => openAddModal()}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-brand-600/25 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addCategory')}</span>
        </button>
      </div>

      {/* Categories Table with Hierarchy */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading categories...</div>
        ) : hierarchicalCategories.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No categories configured yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left rtl:text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                  <th className="p-3 sm:p-4 w-16 text-center">Order</th>
                  <th className="p-3 sm:p-4">Category / Subcategory Name</th>
                  <th className="p-3 sm:p-4">Level & Parent</th>
                  <th className="p-3 sm:p-4">Slug</th>
                  <th className="p-3 sm:p-4 text-center">Products</th>
                  <th className="p-3 sm:p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hierarchicalCategories.map((cat) => {
                  const isSub = cat.depth > 0;
                  return (
                    <tr
                      key={cat.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSub ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      <td className="p-3 sm:p-4 text-center font-mono font-bold text-slate-500">
                        {cat.display_order}
                      </td>

                      <td className="p-3 sm:p-4">
                        <div
                          className="flex items-center gap-2"
                          style={{
                            paddingInlineStart: `${cat.depth * 22}px`,
                          }}
                        >
                          {isSub && (
                            <CornerDownRight className="w-3.5 h-3.5 text-brand-500 shrink-0 rtl:scale-x-[-1]" />
                          )}
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{cat.name_en}</span>
                              {isSub && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 font-normal">
                                  L{cat.depth + 1} Sub
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-urdu">{cat.name_ur}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 sm:p-4">
                        {cat.parent_name_en ? (
                          <div className="text-xs text-slate-600">
                            <span className="text-slate-400">Child of: </span>
                            <span className="font-semibold text-brand-700">{cat.parent_name_en}</span>
                            <div className="text-[11px] text-slate-400 font-urdu">{cat.parent_name_ur}</div>
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-50 text-brand-800 border border-brand-200">
                            Top-Level Main
                          </span>
                        )}
                      </td>

                      <td className="p-3 sm:p-4 font-mono text-slate-600 text-xs">
                        {cat.slug}
                      </td>

                      <td className="p-3 sm:p-4 text-center">
                        <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                          {cat.product_count || 0}
                        </span>
                      </td>

                      <td className="p-3 sm:p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openAddModal(cat.id)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Add child subcategory under this category"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            title="Edit category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete category safely"
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

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 end-5 p-2 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingCategory ? t('editCategory') : t('addCategory')}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure name, parent category, slug, and display order.
            </p>

            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Parent Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('parentCategoryOptional')}
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium text-slate-800"
                >
                  <option value="">{t('topLevelNone')}</option>
                  {getEligibleParents().map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parent_name_en ? `  ↳ ${c.name_en} (under ${c.parent_name_en})` : `📁 ${c.name_en}`}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Leave as Top-Level for main sections (e.g. Sanitary Ware), or choose a parent to create a nested subcategory (e.g. Wash Basins → Wall Hung).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder="e.g. Wash Basins"
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name (Urdu) *
                </label>
                <input
                  type="text"
                  required
                  dir="rtl"
                  value={formData.name_ur}
                  onChange={(e) => setFormData({ ...formData, name_ur: e.target.value })}
                  placeholder="مثلاً: واش بیسن"
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg font-urdu"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="wash-basins"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
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
                  {submitting ? 'Saving...' : t('saveCategory')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Category Deletion Confirmation Modal */}
      {deleteModalOpen && deletingCategory && categoryUsage && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="absolute top-5 end-5 p-2 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {t('safeCategoryDeleteTitle')}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {deletingCategory.name_en} ({deletingCategory.name_ur})
                </p>
              </div>
            </div>

            {categoryUsage.product_count > 0 || categoryUsage.subcategory_count > 0 ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                  <p className="font-bold mb-1">
                    ⚠️ {t('safeCategoryDeleteWarning')}
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                    <li>
                      <strong>{categoryUsage.product_count}</strong> active products are currently in this category.
                    </li>
                    {categoryUsage.subcategory_count > 0 && (
                      <li>
                        <strong>{categoryUsage.subcategory_count}</strong> subcategories are nested under this category.
                      </li>
                    )}
                  </ul>
                </div>

                <div className="space-y-3">
                  {categoryUsage.other_categories && categoryUsage.other_categories.length > 0 && (
                    <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="radio"
                        name="delAction"
                        checked={deleteAction === 'reassign'}
                        onChange={() => setDeleteAction('reassign')}
                        className="mt-0.5 text-brand-600 focus:ring-brand-500"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-bold text-slate-900 block">
                          {t('reassignToCategory')}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Move all {categoryUsage.product_count} products and child subcategories to a different category safely.
                        </p>

                        {deleteAction === 'reassign' && (
                          <div className="mt-2">
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              {t('targetCategoryLabel')}:
                            </label>
                            <select
                              value={targetCategoryId}
                              onChange={(e) => setTargetCategoryId(e.target.value)}
                              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                            >
                              {categoryUsage.other_categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name_en} ({c.name_ur})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </label>
                  )}

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="delAction"
                      checked={deleteAction === 'detach'}
                      onChange={() => setDeleteAction('detach')}
                      className="mt-0.5 text-brand-600 focus:ring-brand-500"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-slate-900 block">
                        {t('detachProducts')}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Products will remain in the catalog as Uncategorized. Child subcategories become top-level categories. No products will be deleted.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteCategory}
                    disabled={deleteLoading || (deleteAction === 'reassign' && !targetCategoryId)}
                    className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md disabled:opacity-50"
                  >
                    {deleteLoading ? 'Processing...' : t('confirmCategoryDelete')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-slate-600">
                  Are you sure you want to delete category <strong>{deletingCategory.name_en}</strong>? This category currently contains no products.
                </p>

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteCategory}
                    disabled={deleteLoading}
                    className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md disabled:opacity-50"
                  >
                    {deleteLoading ? 'Deleting...' : t('deleteCategoryButton')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
