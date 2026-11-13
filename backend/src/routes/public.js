import express from 'express';
import crypto from 'crypto';
import { query, db } from '../db.js';

const router = express.Router();

function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = crypto.randomInt(1000, 9999);
  return `KSS-${dateStr}-${randomSuffix}`;
}

/**
 * Normalizes variants from variants_json so that legacy strings
 * and new rich variant objects (with color, size, sku, price, image, stock)
 * work seamlessly and consistently.
 */
export function normalizeVariants(variantsJson, defaultPrice = 0, defaultAvailable = 1, defaultImage = '') {
  if (!variantsJson) return [];
  let list = [];
  try {
    list = typeof variantsJson === 'string' ? JSON.parse(variantsJson) : variantsJson;
  } catch (e) {
    list = [];
  }
  if (!Array.isArray(list)) return [];

  return list.map((item, index) => {
    if (typeof item === 'string') {
      return {
        id: `v_${index}`,
        name: item,
        sku: '',
        color: '',
        color_code: '',
        size: item,
        material: '',
        model: '',
        price: defaultPrice || 0,
        is_price_on_request: 0,
        is_available: defaultAvailable ?? 1,
        stock_quantity: 0,
        image_url: defaultImage || '',
      };
    }
    return {
      id: item.id || `v_${index}`,
      name: item.name || [item.color, item.size, item.model, item.material].filter(Boolean).join(' - ') || 'Standard',
      sku: item.sku || '',
      color: item.color || '',
      color_code: item.color_code || '',
      size: item.size || '',
      material: item.material || '',
      model: item.model || '',
      price: item.price !== undefined && item.price !== null ? parseFloat(item.price) : (defaultPrice || 0),
      is_price_on_request: item.is_price_on_request ? 1 : 0,
      is_available: item.is_available !== undefined ? Number(item.is_available) : (defaultAvailable ?? 1),
      stock_quantity: parseInt(item.stock_quantity, 10) || 0,
      image_url: item.image_url || defaultImage || '',
    };
  });
}

/**
 * Helper to get a category ID and all its recursive descendant IDs
 */
async function getCategoryAndDescendantIds(catIdOrSlug) {
  let targetCat = null;
  if (!isNaN(catIdOrSlug)) {
    const res = await query('SELECT id FROM categories WHERE id = ?', [Number(catIdOrSlug)]);
    if (res.rows.length > 0) targetCat = res.rows[0];
  } else {
    const res = await query('SELECT id FROM categories WHERE slug = ?', [catIdOrSlug]);
    if (res.rows.length > 0) targetCat = res.rows[0];
  }
  if (!targetCat) return [];

  const allCats = await query('SELECT id, parent_id FROM categories WHERE is_active = 1');
  const resultIds = [targetCat.id];
  let added = true;
  while (added) {
    added = false;
    for (const c of allCats.rows) {
      if (c.parent_id && resultIds.includes(c.parent_id) && !resultIds.includes(c.id)) {
        resultIds.push(c.id);
        added = true;
      }
    }
  }
  return resultIds;
}

/**
 * GET /api/public/settings
 * Returns public website settings dictionary
 */
router.get('/settings', async (req, res) => {
  try {
    const result = await query('SELECT key, value FROM site_settings');
    const settings = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }
    return res.json({ success: true, settings });
  } catch (error) {
    console.error('[Public Settings Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

/**
 * GET /api/public/categories
 * Returns active categories with nested parent_id relationships
 */
router.get('/categories', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id, c.parent_id, c.slug, c.name_en, c.name_ur, c.description_en, c.description_ur, c.icon, c.display_order,
              p.name_en as parent_name_en, p.name_ur as parent_name_ur
       FROM categories c
       LEFT JOIN categories p ON c.parent_id = p.id
       WHERE c.is_active = 1
       ORDER BY c.display_order ASC, c.name_en ASC`
    );
    return res.json({ success: true, categories: result.rows });
  } catch (error) {
    console.error('[Public Categories Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

/**
 * GET /api/public/products
 * Query params: category (slug or id), search, featured
 */
router.get('/products', async (req, res) => {
  try {
    const { category, search, featured } = req.query;

    let sql = `
      SELECT p.*, c.name_en as category_name_en, c.name_ur as category_name_ur, c.slug as category_slug, c.parent_id as category_parent_id
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      const catIds = await getCategoryAndDescendantIds(category);
      if (catIds.length > 0) {
        const placeholders = catIds.map(() => '?').join(',');
        sql += ` AND p.category_id IN (${placeholders})`;
        params.push(...catIds);
      } else {
        sql += ' AND 1 = 0';
      }
    }

    if (featured === '1' || featured === 'true') {
      sql += ' AND p.is_featured = 1';
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      sql += ' AND (p.name_en LIKE ? OR p.name_ur LIKE ? OR p.description_en LIKE ? OR p.description_ur LIKE ? OR p.sku LIKE ? OR p.variants_json LIKE ?)';
      params.push(term, term, term, term, term, term);
    }

    sql += ' ORDER BY p.is_featured DESC, p.created_at DESC';

    const result = await query(sql, params);

    // Normalize rich variants array
    const products = result.rows.map((row) => {
      const variants = normalizeVariants(row.variants_json, row.price, row.is_available, row.image_url);
      return {
        ...row,
        variants,
      };
    });

    return res.json({ success: true, products });
  } catch (error) {
    console.error('[Public Products Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

/**
 * GET /api/public/products/:id
 */
router.get('/products/:id', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, c.name_en as category_name_en, c.name_ur as category_name_ur, c.slug as category_slug, c.parent_id as category_parent_id
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const row = result.rows[0];
    const variants = normalizeVariants(row.variants_json, row.price, row.is_available, row.image_url);

    return res.json({
      success: true,
      product: { ...row, variants },
    });
  } catch (error) {
    console.error('[Public Product Detail Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

/**
 * POST /api/public/orders
 * Body: {
 *   customer_name,
 *   shop_name,
 *   phone,
 *   city,
 *   address,
 *   notes,
 *   items: [ { product_id, product_name_en, product_name_ur, variant, color, sku, unit, quantity, unit_price, is_price_on_request } ]
 * }
 */
router.post('/orders', async (req, res) => {
  try {
    const {
      customer_name,
      shop_name = '',
      phone,
      city,
      address,
      notes = '',
      items,
    } = req.body;

    // Validate customer fields
    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ success: false, error: 'Customer name is required' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ success: false, error: 'City or area is required' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, error: 'Full address is required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order must contain at least one product item',
      });
    }

    // Clean and calculate items
    let totalItems = 0;
    let estimatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid quantity for item "${item.product_name_en || 'Product'}"`,
        });
      }

      const unitPrice = parseFloat(item.unit_price) || 0;
      const isPriceOnRequest = item.is_price_on_request ? 1 : 0;
      const lineTotal = isPriceOnRequest ? 0 : unitPrice * qty;

      totalItems += qty;
      estimatedTotal += lineTotal;

      validatedItems.push({
        product_id: item.product_id || null,
        product_name_en: item.product_name_en || 'Item',
        product_name_ur: item.product_name_ur || 'آئٹم',
        variant: item.variant || '',
        color: item.color || '',
        sku: item.sku || '',
        unit: item.unit || 'Piece',
        quantity: qty,
        unit_price: unitPrice,
        is_price_on_request: isPriceOnRequest,
        line_total: lineTotal,
      });
    }

    const orderNumber = generateOrderNumber();

    // Insert order
    const orderResult = await query(
      `INSERT INTO orders (
        order_number, customer_name, shop_name, phone, city, address, notes,
        status, total_items, estimated_total, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'New', ?, ?, datetime('now'), datetime('now'))
      RETURNING id, order_number, customer_name, shop_name, phone, city, address, notes, status, total_items, estimated_total, created_at`,
      [
        orderNumber,
        customer_name.trim(),
        shop_name.trim(),
        phone.trim(),
        city.trim(),
        address.trim(),
        notes.trim(),
        totalItems,
        estimatedTotal,
      ]
    );

    const createdOrder = orderResult.rows[0];
    const orderId = createdOrder.id;

    // Insert order items with variant and color
    for (const item of validatedItems) {
      await query(
        `INSERT INTO order_items (
          order_id, product_id, product_name_en, product_name_ur, variant, color, sku, unit,
          quantity, unit_price, is_price_on_request, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.product_name_en,
          item.product_name_ur,
          item.variant,
          item.color,
          item.sku,
          item.unit,
          item.quantity,
          item.unit_price,
          item.is_price_on_request,
          item.line_total,
        ]
      );
    }

    console.log(`[Order Created] Order #${orderNumber} received for ${customer_name} (${shop_name || 'Individual'})`);

    return res.status(201).json({
      success: true,
      order: {
        ...createdOrder,
        items: validatedItems,
      },
    });
  } catch (error) {
    console.error('[Create Order Error]:', error);
    return res.status(500).json({ success: false, error: 'Failed to submit order. Please try again.' });
  }
});

export default router;
