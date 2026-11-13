import React, { useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { ShoppingCart, Check, Plus, Minus, Tag, AlertCircle, Palette } from 'lucide-react';

export default function ProductCard({ product }) {
  const { lang, t } = useLanguage();
  const { addToCart } = useCart();

  // Normalize variants list to rich objects
  const normalizedVariants = useMemo(() => {
    if (!product.variants || !Array.isArray(product.variants) || product.variants.length === 0) {
      return [];
    }
    return product.variants.map((v, i) => {
      if (typeof v === 'string') {
        return {
          id: `var-${i}`,
          name: v,
          color: '',
          color_code: '',
          size: v,
          sku: product.sku || '',
          price: product.price || 0,
          is_price_on_request: product.is_price_on_request ? 1 : 0,
          stock_quantity: 0,
          image_url: '',
          is_available: product.is_available ?? 1,
        };
      }
      return {
        id: v.id || `var-${i}`,
        name: v.name || [v.size, v.color].filter(Boolean).join(' - ') || `Option ${i + 1}`,
        color: v.color || '',
        color_code: v.color_code || '',
        size: v.size || '',
        sku: v.sku || product.sku || '',
        price: v.price !== undefined ? v.price : product.price,
        is_price_on_request: v.is_price_on_request !== undefined ? (v.is_price_on_request ? 1 : 0) : (product.is_price_on_request ? 1 : 0),
        stock_quantity: v.stock_quantity || 0,
        image_url: v.image_url || '',
        is_available: v.is_available ?? (product.is_available ?? 1),
      };
    });
  }, [product.variants, product.price, product.is_price_on_request, product.is_available, product.sku]);

  // Extract unique colors if present
  const availableColors = useMemo(() => {
    const list = [];
    const seen = new Set();
    normalizedVariants.forEach((v) => {
      if (v.color && !seen.has(v.color.toLowerCase())) {
        seen.add(v.color.toLowerCase());
        list.push({
          name: v.color,
          code: v.color_code || '#cccccc',
        });
      }
    });
    return list;
  }, [normalizedVariants]);

  // Selected variant state
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(() => {
    return availableColors.length > 0 ? availableColors[0].name : '';
  });
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Active variant object
  const activeVariant = normalizedVariants[selectedIdx] || null;

  // Filter variants by chosen color if color selection is active
  const filteredVariantsByColor = useMemo(() => {
    if (!selectedColor) return normalizedVariants;
    const matched = normalizedVariants.filter(
      (v) => v.color && v.color.toLowerCase() === selectedColor.toLowerCase()
    );
    return matched.length > 0 ? matched : normalizedVariants;
  }, [normalizedVariants, selectedColor]);

  // Handle color change: auto switch to first variant of this color
  const handleColorSelect = (colorName) => {
    setSelectedColor(colorName);
    const targetIdx = normalizedVariants.findIndex(
      (v) => v.color && v.color.toLowerCase() === colorName.toLowerCase()
    );
    if (targetIdx > -1) {
      setSelectedIdx(targetIdx);
    }
  };

  const handleVariantChange = (idx) => {
    setSelectedIdx(idx);
    const v = normalizedVariants[idx];
    if (v && v.color) {
      setSelectedColor(v.color);
    }
  };

  const productName =
    lang === 'ur' ? (product.name_ur || product.name_en) : (product.name_en || product.name_ur);
  const secondaryName = lang === 'ur' ? product.name_en : product.name_ur;
  const description =
    lang === 'ur'
      ? (product.description_ur || product.description_en)
      : (product.description_en || product.description_ur);
  const categoryName =
    lang === 'ur'
      ? (product.category_name_ur || product.category_name_en)
      : (product.category_name_en || product.category_name_ur);

  // Active display image: variant image first, then product image, then fallback
  const fallbackImage =
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80';
  const displayImage =
    activeVariant?.image_url || product.image_url || fallbackImage;

  // Active pricing
  const isPriceOnRequest = activeVariant
    ? activeVariant.is_price_on_request === 1
    : product.is_price_on_request === 1;
  const displayPrice = activeVariant ? activeVariant.price : product.price;

  // Active availability
  const activeAvailability = activeVariant?.is_available ?? product.is_available ?? 1;

  const handleAdd = () => {
    const variantLabel = activeVariant ? activeVariant.name : '';
    const colorLabel = activeVariant?.color || selectedColor || '';
    const sku = activeVariant?.sku || product.sku || '';

    addToCart(product, variantLabel, quantity, {
      color: colorLabel,
      sku: sku,
      price: displayPrice,
      is_price_on_request: isPriceOnRequest ? 1 : 0,
      image_url: displayImage,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const getStockBadge = () => {
    if (activeAvailability === 1) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 me-1.5"></span>
          {t('inStock')}
        </span>
      );
    } else if (activeAvailability === 2) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 me-1.5"></span>
          {t('onOrder')}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 me-1.5"></span>
          {t('outOfStock')}
        </span>
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-brand-400 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
      {/* Product Image Area */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
        <img
          src={imgError ? fallbackImage : displayImage}
          alt={productName}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 start-3 end-3 flex items-center justify-between pointer-events-none">
          {categoryName && (
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-slate-900/80 text-white backdrop-blur-sm">
              {categoryName}
            </span>
          )}
          {getStockBadge()}
        </div>

        {/* SKU Badge */}
        {(activeVariant?.sku || product.sku) && (
          <div className="absolute bottom-2 start-3">
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white/90 text-slate-700 shadow-sm">
              {activeVariant?.sku || product.sku}
            </span>
          </div>
        )}
      </div>

      {/* Product Details Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug group-hover:text-brand-600 transition-colors">
            {productName}
          </h3>
          {secondaryName && secondaryName !== productName && (
            <p className="text-xs text-slate-400 font-medium mt-0.5 line-clamp-1">
              {secondaryName}
            </p>
          )}

          {description && (
            <p className="text-xs sm:text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
          {/* Color Swatches (if multiple colors defined) */}
          {availableColors.length > 0 && (
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5">
                <span>{t('selectColor')}</span>
                <span className="text-slate-800 font-bold capitalize">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {availableColors.map((c) => {
                  const isChosen = selectedColor.toLowerCase() === c.name.toLowerCase();
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleColorSelect(c.name)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        isChosen
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-brand-500/30'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                      title={c.name}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: c.code }}
                      />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Variant Selector Dropdown */}
          {normalizedVariants.length > 0 && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                {t('selectVariant')}
              </label>
              <select
                value={selectedIdx}
                onChange={(e) => handleVariantChange(Number(e.target.value))}
                className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-800"
              >
                {normalizedVariants.map((v, i) => (
                  <option key={i} value={i}>
                    {v.name} {v.size && v.size !== v.name ? `(${v.size})` : ''} {v.color ? `• ${v.color}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stock inventory note if tracking enabled */}
          {product.track_stock === 1 && activeVariant && activeVariant.stock_quantity > 0 && (
            <div className="text-[11px] text-emerald-700 font-medium">
              ✓ {activeVariant.stock_quantity} {product.unit || 'pcs'} {t('inStockCount')}
            </div>
          )}

          {/* Price & Unit Display */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                {product.unit ? `${t('unit')}: ${product.unit}` : ''}
              </span>
              {isPriceOnRequest || !displayPrice || displayPrice === 0 ? (
                <div className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
                  <Tag className="w-3 h-3" />
                  <span>{t('requestPrice')}</span>
                </div>
              ) : (
                <div className="text-lg font-extrabold text-slate-900 font-mono">
                  <span className="text-xs font-normal text-slate-500 me-1">PKR</span>
                  {Number(displayPrice).toLocaleString()}
                </div>
              )}
            </div>

            {/* Quantity Stepper */}
            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-xs font-bold text-slate-800 font-mono">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-7 h-7 flex items-center justify-center rounded text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Add to Order Button */}
          <button
            type="button"
            disabled={activeAvailability === 0}
            onClick={handleAdd}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 ${
              activeAvailability === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : added
                ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/25'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>{t('itemAdded')}</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span>{t('addToOrder')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
