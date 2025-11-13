import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Cart({ token }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setCart(data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const response = await fetch(`/api/cart/update/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
      });
      
      if (response.ok) {
        await fetchCart();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      alert('Failed to update quantity');
    }
  };

  const removeItem = async (productId) => {
    try {
      const response = await fetch(`/api/cart/remove/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) {
      return;
    }

    try {
      const response = await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchCart();
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  const checkout = async () => {
    if (cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!window.confirm(`Proceed with checkout? Total: $${cart.total}`)) {
      return;
    }

    try {
      const response = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`${data.message}! Total: $${data.total}`);
        await fetchCart();
        navigate('/');
      } else {
        const error = await response.json();
        alert(error.message || 'Checkout failed');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading cart...
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1>Shopping Cart</h1>
        {cart.items.length > 0 && (
          <button
            onClick={clearCart}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Cart
          </button>
        )}
      </div>

      {cart.items.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '1rem' }}>
            Your cart is empty
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '2rem' }}>
            {cart.items.map(item => (
              item.productId && (
                <div
                  key={item._id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    padding: '1.5rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    gap: '1.5rem',
                    alignItems: 'center'
                  }}
                >
                  <img
                    src={item.productId.imageUrl}
                    alt={item.productId.name}
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/products/${item.productId._id}`)}
                  />
                  
                  <div style={{ flex: 1 }}>
                    <h3 
                      style={{ 
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                        color: '#2c3e50'
                      }}
                      onClick={() => navigate(`/products/${item.productId._id}`)}
                    >
                      {item.productId.name}
                    </h3>
                    <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                      {item.productId.description.substring(0, 100)}...
                    </p>
                    <p style={{ 
                      fontSize: '1.2rem', 
                      fontWeight: 'bold',
                      color: '#2c3e50' 
                    }}>
                      ${item.productId.price}
                    </p>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => updateQuantity(item.productId._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: item.quantity <= 1 ? '#ccc' : '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        -
                      </button>
                      <span style={{ 
                        minWidth: '40px', 
                        textAlign: 'center',
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                      }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId._id, item.quantity + 1)}
                        disabled={item.quantity >= item.productId.stock}
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: item.quantity >= item.productId.stock ? '#ccc' : '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: item.quantity >= item.productId.stock ? 'not-allowed' : 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        +
                      </button>
                    </div>

                    <p style={{ 
                      fontSize: '1.3rem', 
                      fontWeight: 'bold',
                      minWidth: '80px',
                      textAlign: 'right',
                      color: '#2c3e50'
                    }}>
                      ${(item.productId.price * item.quantity).toFixed(2)}
                    </p>

                    <button
                      onClick={() => removeItem(item.productId._id)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>

          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            padding: '2rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2>Total:</h2>
              <h2 style={{ color: '#2c3e50' }}>${cart.total}</h2>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  flex: 1,
                  padding: '1rem',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Continue Shopping
              </button>
              <button
                onClick={checkout}
                style={{
                  flex: 1,
                  padding: '1rem',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
