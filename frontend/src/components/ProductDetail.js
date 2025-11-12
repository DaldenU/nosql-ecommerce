import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ProductDetail({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${id}`);
      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    }
  };

  const handleInteraction = async (type) => {
    try {
      await fetch(`/api/products/${id}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });
      alert(`Product ${type}d successfully!`);
    } catch (error) {
      console.error('Failed to record interaction:', error);
    }
  };

  if (!product) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          marginBottom: '1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#95a5a6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ← Back to Products
      </button>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <img
          src={product.imageUrl}
          alt={product.name}
          style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }}
        />
        
        <div style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{
              backgroundColor: '#3498db',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              {product.category}
            </span>
          </div>

          <h1 style={{ marginBottom: '1rem' }}>{product.name}</h1>
          
          <p style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#2c3e50',
            marginBottom: '1rem'
          }}>
            ${product.price}
          </p>

          <p style={{
            color: '#666',
            lineHeight: '1.6',
            marginBottom: '2rem'
          }}>
            {product.description}
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleInteraction('cart')}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#f39c12',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              🛒 Add to Cart
            </button>

            <button
              onClick={() => handleInteraction('like')}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ❤ Like
            </button>

            <button
              onClick={() => handleInteraction('purchase')}
              style={{
                padding: '1rem 2rem',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Buy Now
            </button>
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#ecf0f1',
            borderRadius: '4px'
          }}>
            <p><strong>Stock:</strong> {product.stock} items</p>
            <p><strong>Rating:</strong> {product.rating} / 5</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;