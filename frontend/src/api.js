// Clean and normalize API base URL (strips trailing slashes to prevent double-slash //api 404 errors)
const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const BASE_URL = RAW_BASE_URL.trim().replace(/\/+$/, '');

function getAuthHeaders() {
  const token = localStorage.getItem('kss_admin_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  // If payload is FormData (file upload), let browser set boundary header automatically
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Image URL Resolver (resolves relative backend endpoints to backend host)
  getImageUrl: (url) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    // Clean up legacy localhost:5000 URLs so images work properly on phones & Netlify
    if (url.includes('localhost:5000/api/public/images/')) {
      const path = url.split('localhost:5000')[1];
      return BASE_URL ? `${BASE_URL}${path}` : path;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    if (cleanUrl.startsWith('/api/')) {
      return BASE_URL ? `${BASE_URL}${cleanUrl}` : cleanUrl;
    }
    return url;
  },

  // Public APIs
  getSettings: () => request('/api/public/settings'),
  getCategories: () => request('/api/public/categories'),
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.featured) query.append('featured', '1');
    const qs = query.toString();
    return request(`/api/public/products${qs ? `?${qs}` : ''}`);
  },
  getProduct: (id) => request(`/api/public/products/${id}`),
  createOrder: (orderData) =>
    request('/api/public/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),

  // Auth APIs
  login: (identifier, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),
  getMe: () => request('/api/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  logout: () => {
    localStorage.removeItem('kss_admin_token');
    return request('/api/auth/logout', { method: 'POST' }).catch(() => {});
  },

  // Admin APIs
  getAdminStats: () => request('/api/admin/stats'),
  getAdminOrders: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.date_from) query.append('date_from', params.date_from);
    if (params.date_to) query.append('date_to', params.date_to);
    const qs = query.toString();
    return request(`/api/admin/orders${qs ? `?${qs}` : ''}`);
  },
  getAdminOrder: (id) => request(`/api/admin/orders/${id}`),
  updateOrderStatus: (id, status) =>
    request(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteOrder: (id) =>
    request(`/api/admin/orders/${id}`, {
      method: 'DELETE',
    }),
  getPurchasingSummary: (params = {}) => {
    const query = new URLSearchParams();
    if (params.order_ids) query.append('order_ids', params.order_ids);
    if (params.statuses) query.append('statuses', params.statuses);
    if (params.date_from) query.append('date_from', params.date_from);
    if (params.date_to) query.append('date_to', params.date_to);
    const qs = query.toString();
    return request(`/api/admin/purchasing-summary${qs ? `?${qs}` : ''}`);
  },

  // Admin Products
  getAdminProducts: () => request('/api/admin/products'),
  createProduct: (productData) =>
    request('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    }),
  updateProduct: (id, productData) =>
    request(`/api/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    }),
  deleteProduct: (id) =>
    request(`/api/admin/products/${id}`, {
      method: 'DELETE',
    }),

  // Admin Categories
  getAdminCategories: () => request('/api/admin/categories'),
  getCategoryUsage: (id) => request(`/api/admin/categories/${id}/usage`),
  createCategory: (catData) =>
    request('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(catData),
    }),
  updateCategory: (id, catData) =>
    request(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(catData),
    }),
  deleteCategory: (id, options = {}) =>
    request(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(options),
    }),

  // Admin Settings
  getAdminSettings: () => request('/api/admin/settings'),
  updateAdminSettings: (settingsData) =>
    request('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    }),

  // Admin Image Uploads & Storage
  uploadImage: (file, folder = 'products') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    return request('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });
  },
  getStorageStatus: () => request('/api/admin/storage/status'),
};
