const API_BASE_URL = '/api';

// Get auth token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Authentication API calls
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeaders()
    });
    return response.json();
  }
};

// Products API calls
export const productsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/products?${queryString}`);
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    return response.json();
  },

  create: async (productData) => {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    return response.json();
  },

  recordInteraction: async (productId, type, rating = null) => {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/interact`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ type, rating })
    });
    return response.json();
  },

  getCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/products/meta/categories`);
    return response.json();
  },

  search: async (searchTerm, category = null) => {
    const params = { search: searchTerm };
    if (category) params.category = category;
    return productsAPI.getAll(params);
  }
};

// Recommendations API calls
export const recommendationsAPI = {
  getPersonalized: async () => {
    const response = await fetch(`${API_BASE_URL}/recommendations`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  getHistory: async () => {
    const response = await fetch(`${API_BASE_URL}/recommendations/history`, {
      headers: getAuthHeaders()
    });
    return response.json();
  }
};

// Error handling wrapper
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error
    return error.response.data.message || 'An error occurred';
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};

// Export all APIs
export default {
  auth: authAPI,
  products: productsAPI,
  recommendations: recommendationsAPI,
  handleError: handleAPIError
};