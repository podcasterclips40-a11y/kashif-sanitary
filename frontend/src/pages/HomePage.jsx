import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import {
  Search,
  SlidersHorizontal,
  Truck,
  ShieldCheck,
  BadgePercent,
  PhoneCall,
  MessageCircle,
  Package,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Home as HomeIcon,
  FolderTree,
} from 'lucide-react';

export default function HomePage({ settings = {}, products = [], categories = [], loading = false }) {
  const { lang, t, isRtl } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const businessName = lang === 'ur'
    ? (settings.business_name_ur || 'کاشف سینیٹری سپلائیز')
    : (settings.business_name_en || 'Kashif Sanitary Supplies');

  const tagline = lang === 'ur'
    ? (settings.tagline_ur || 'اعلیٰ معیار کی مصنوعات، قابل اعتماد سپلائی')
    : (settings.tagline_en || 'Quality Products. Reliable Supply.');

  const heroTitle = lang === 'ur'
    ? (settings.hero_title_ur || 'ہول سیل سینیٹری ویئر، پائپ اور باتھ روم فٹنگز')
    : (settings.hero_title_en || 'Wholesale Sanitary Ware, Pipes & Bathroom Fittings');

  const heroDesc = lang === 'ur'
    ? (settings.hero_desc_ur || 'ریٹیلرز، پلمبروں اور کنٹریکٹرز کے لیے پائیدار پی پی آر سی، پی وی سی پائپس، براس فٹنگز اور پرتعیش سینیٹری کا قابل اعتماد سپلائر۔')
    : (settings.hero_desc_en || 'Direct wholesale supplier of premium PPRC & PVC pipes, brass fittings, luxury faucets, and modern bathroom sanitary ware.');

  const whatsapp = settings.whatsapp || '+92 300 1234567';
  const rawWhatsApp = whatsapp.replace(/[^0-9]/g, '');

  // Separate top-level categories and subcategories
  const topLevelCategories = useMemo(() => {
    return categories
      .filter((c) => !c.parent_id)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }, [categories]);

  // Find active category object if not 'all'
  const activeCategoryObj = useMemo(() => {
    if (selectedCategory === 'all') return null;
    return categories.find((c) => String(c.id) === String(selectedCategory) || c.slug === selectedCategory) || null;
  }, [selectedCategory, categories]);

  // Compute breadcrumb path: [Root, Sublevel 1, Sublevel 2, ...]
  const breadcrumbTrail = useMemo(() => {
    if (!activeCategoryObj) return [];
    const trail = [activeCategoryObj];
    let curr = activeCategoryObj;
    while (curr.parent_id) {
      const parent = categories.find((c) => c.id === curr.parent_id);
      if (parent) {
        trail.unshift(parent);
        curr = parent;
      } else {
        break;
      }
    }
    return trail;
  }, [activeCategoryObj, categories]);

  // Find direct child subcategories for current selection
  // If selected category has children, show them.
  // If selected category is a child with no subcategories, show its siblings (sharing same parent).
  const visibleSubcategories = useMemo(() => {
    if (!activeCategoryObj) return [];

    // Direct children
    const directChildren = categories
      .filter((c) => c.parent_id === activeCategoryObj.id)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    if (directChildren.length > 0) {
      return directChildren;
    }

    // If it has no children, but has a parent, show siblings
    if (activeCategoryObj.parent_id) {
      return categories
        .filter((c) => c.parent_id === activeCategoryObj.parent_id)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    return [];
  }, [activeCategoryObj, categories]);

  // Helper to recursively collect category ID + all descendant IDs
  const activeDescendantIds = useMemo(() => {
    if (selectedCategory === 'all' || !activeCategoryObj) return null;
    const ids = new Set([activeCategoryObj.id]);
    const queue = [activeCategoryObj.id];

    while (queue.length > 0) {
      const parentId = queue.shift();
      categories.forEach((c) => {
        if (c.parent_id === parentId && !ids.has(c.id)) {
          ids.add(c.id);
          queue.push(c.id);
        }
      });
    }
    return ids;
  }, [selectedCategory, activeCategoryObj, categories]);

  // Filter products by selected category (recursive) and search term
  const filteredProducts = products.filter((p) => {
    // Category match: either 'all' or matches active category / descendants
    const categoryMatch =
      selectedCategory === 'all' ||
      (activeDescendantIds && activeDescendantIds.has(Number(p.category_id)));

    // Search match in EN, UR, SKU, or variants
    const searchMatch =
      !searchTerm.trim() ||
      p.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name_ur.includes(searchTerm) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.description_en && p.description_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.description_ur && p.description_ur.includes(searchTerm));

    return categoryMatch && searchMatch;
  });

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const BreadcrumbChevron = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-slate-50 pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-800 text-xs sm:text-sm font-bold border border-brand-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping"></span>
              <span>{businessName}</span>
              <span className="text-brand-400">•</span>
              <span>{tagline}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              {heroTitle}
            </h1>

            {/* Sub-headline / Intro */}
            <p className="text-sm sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              {heroDesc}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="#catalog"
                className="px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-brand-600/30 inline-flex items-center gap-2 transition-all active:scale-95"
              >
                <span>{t('heroCtaOrder')}</span>
                <ArrowIcon className="w-4 h-4" />
              </a>

              <a
                href={`https://wa.me/${rawWhatsApp}?text=${encodeURIComponent('Assalam-o-Alaikum, I need wholesale price catalog from Kashif Sanitary Supplies.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/30 inline-flex items-center gap-2 transition-all active:scale-95"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{t('heroCtaWhatsApp')}</span>
              </a>
            </div>

            {/* Value Highlights */}
            <div className="pt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200/80 mt-10">
              <div className="flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl bg-white/70 border border-slate-200/60 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                  <BadgePercent className="w-5 h-5" />
                </div>
                <div className="text-start">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{t('wholesaleRates')}</h4>
                  <p className="text-[11px] text-slate-500">{lang === 'ur' ? 'براہ راست ڈیلر اور مارکیٹ ریٹ' : 'Best margins for retailers'}</p>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl bg-white/70 border border-slate-200/60 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-start">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{t('authenticQuality')}</h4>
                  <p className="text-[11px] text-slate-500">{lang === 'ur' ? 'مضبوط اور پائیدار میٹریل' : 'Leak-proof virgin material'}</p>
                </div>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3 p-3 rounded-xl bg-white/70 border border-slate-200/60 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="text-start">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{t('quickDelivery')}</h4>
                  <p className="text-[11px] text-slate-500">{lang === 'ur' ? 'تمام شہروں کے لیے تیز ترسیل' : 'Fast cargo dispatch daily'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog & Order Section */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Section Heading & Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 uppercase tracking-wider mb-1">
                <Package className="w-4 h-4" />
                <span>{businessName}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {t('catalogTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                {t('catalogSubtitle')}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full ps-9 pe-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Breadcrumb Navigation (when a category/subcategory is chosen) */}
          {breadcrumbTrail.length > 0 && (
            <nav className="flex items-center flex-wrap gap-1.5 py-2 px-3.5 bg-slate-100/80 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-600">
              <button
                onClick={() => setSelectedCategory('all')}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-600 transition-colors"
              >
                <HomeIcon className="w-3.5 h-3.5" />
                <span>{t('breadcrumbHome')}</span>
              </button>

              {breadcrumbTrail.map((crumb, idx) => {
                const isLast = idx === breadcrumbTrail.length - 1;
                const crumbName = lang === 'ur' ? crumb.name_ur : crumb.name_en;

                return (
                  <React.Fragment key={crumb.id}>
                    <BreadcrumbChevron className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {isLast ? (
                      <span className="font-bold text-brand-700">{crumbName}</span>
                    ) : (
                      <button
                        onClick={() => setSelectedCategory(crumb.id)}
                        className="hover:text-brand-600 transition-colors"
                      >
                        {crumbName}
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          )}

          {/* Primary Top-Level Category Navigation Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t('allCategories')}
            </button>

            {topLevelCategories.map((cat) => {
              const catName = lang === 'ur' ? cat.name_ur : cat.name_en;
              // Is active if directly selected OR if current breadcrumb starts with this category
              const isActive =
                String(selectedCategory) === String(cat.id) ||
                selectedCategory === cat.slug ||
                (breadcrumbTrail.length > 0 && breadcrumbTrail[0].id === cat.id);

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {catName}
                </button>
              );
            })}
          </div>

          {/* Secondary Nested Subcategory Filter Pills (If current category has subcategories) */}
          {visibleSubcategories.length > 0 && (
            <div className="p-3 bg-brand-50/50 rounded-2xl border border-brand-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-xs font-bold text-brand-900 whitespace-nowrap ps-1 flex items-center gap-1">
                <FolderTree className="w-3.5 h-3.5" />
                <span>{t('subcategories')}:</span>
              </span>

              {/* Pill to view all items under the parent */}
              {breadcrumbTrail.length > 0 && (
                <button
                  onClick={() => {
                    // Jump to parent of visible subcategories
                    const parentNode = visibleSubcategories[0].parent_id;
                    if (parentNode) setSelectedCategory(parentNode);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    activeCategoryObj && visibleSubcategories.some((s) => s.id === activeCategoryObj.id) === false
                      ? 'bg-brand-700 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {lang === 'ur' ? 'تمام ذیلی اقسام' : 'All in this section'}
                </button>
              )}

              {visibleSubcategories.map((sub) => {
                const subName = lang === 'ur' ? sub.name_ur : sub.name_en;
                const isSelected = String(selectedCategory) === String(sub.id) || selectedCategory === sub.slug;

                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedCategory(sub.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-brand-700 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {subName}
                  </button>
                );
              })}
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-4">
                  <div className="aspect-[4/3] bg-slate-200 rounded-xl"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-8 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center my-8">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">{t('noProductsFound')}</h3>
              <p className="text-xs text-slate-500 mt-1">Try searching with a different term or clear filters.</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                }}
                className="mt-4 px-4 py-2 bg-brand-50 text-brand-700 rounded-lg text-xs font-bold hover:bg-brand-100"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-2">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Wholesale & Project Supply Callout Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-8 sm:p-12 shadow-xl border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl text-center lg:text-start">
            <span className="inline-block px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold border border-brand-500/30">
              {businessName} • {tagline}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {lang === 'ur'
                ? 'پروجیکٹس اور ہول سیل سپلائی کے لیے خصوصی رعایت'
                : 'Bulk Construction & Wholesale Sanitary Procurement'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {lang === 'ur'
                ? 'اگر آپ پلازہ، ہاؤسنگ سوسائٹی یا ریٹیل دکان کے لیے بلک کوانٹٹی میں پائپ، فٹنگز یا سینیٹری سامان خریدنا چاہتے ہیں تو ہم سے براہ راست ہول سیل ریٹس حاصل کریں۔'
                : 'Contractors, retail stores, and commercial builders: contact our wholesale desk for special volume pricing, project schedules, and direct factory freight.'}
            </p>
          </div>

          <a
            href={`https://wa.me/${rawWhatsApp}?text=${encodeURIComponent('Hello Kashif Sanitary Supplies, I need bulk project wholesale quote.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm shrink-0 shadow-lg flex items-center gap-2 transition-all active:scale-95"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>{t('chatWhatsApp')}</span>
          </a>
        </div>
      </section>
    </div>
  );
}
