import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import Recommendations from './components/Recommendations';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        {token && (
          <nav style={{
            backgroundColor: '#2c3e50',
            padding: '1rem 2rem',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h1>E-Commerce Store</h1>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <a href="/" style={{ color: 'white', textDecoration: 'none' }}>Products</a>
              <a href="/recommendations" style={{ color: 'white', textDecoration: 'none' }}>
                Recommendations
              </a>
              <span>Welcome, {user?.username}</span>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </nav>
        )}

        <Routes>
          <Route path="/login" element={
            token ? <Navigate to="/" /> : <Login setToken={setToken} />
          } />
          <Route path="/register" element={
            token ? <Navigate to="/" /> : <Register setToken={setToken} />
          } />
          <Route path="/" element={
            token ? <ProductList token={token} /> : <Navigate to="/login" />
          } />
          <Route path="/products/:id" element={
            token ? <ProductDetail token={token} /> : <Navigate to="/login" />
          } />
          <Route path="/recommendations" element={
            token ? <Recommendations token={token} /> : <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;