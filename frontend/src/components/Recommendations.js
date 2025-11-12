import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Recommendations({ token }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/recommendations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setRecommendations(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setLoading(false);
    }
  };

  const handleProductClick = async (productId) => {
    try {
      await fetch(`/api/products/${productId}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'view' })
      });
      navigate(`/products/${productId}`);
    } catch (error) {
      console.error('Failed to record interaction:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading recommendations...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Recommended For You</h1>
      
      {recommendations.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: '3rem',
          borderRadius: '8px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2>Start exploring products!</h2>
          <p style={{ color: '#666', marginTop: '1rem' }}>
            We'll generate personalized recommendations based on your interactions.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {recommendations.map(product => (
            <div
              key={product._id}
              onClick={() => handleProductClick(product._id)}
              style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: product.algorithm === 'collaborative' ? '#e74c3c' : 
                                product.algorithm === 'content' ? '#9b59b6' :
                                product.algorithm === 'popularity' ? '#f39c12' : '#3498db',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {product.algorithm === 'collaborative' ? '👥 SIMILAR USERS' :
                 product.algorithm === 'content' ? '🎯 FOR YOU' :
                 product.algorithm === 'popularity' ? '🔥 TRENDING' : '⭐ RECOMMENDED'}
              </div>

              <img
                src={product.imageUrl}
                alt={product.name}
                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
              />
              <div style={{ padding: '1rem' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                  {product.name}
                </h3>
                <p style={{
                  color: '#666',
                  fontSize: '0.9rem',
                  marginBottom: '0.75rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {product.description}
                </p>
                
                {product.explanation && (
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#555',
                    marginBottom: '0.75rem',
                    fontStyle: 'italic',
                    borderLeft: '3px solid ' + (
                      product.algorithm === 'collaborative' ? '#e74c3c' :
                      product.algorithm === 'content' ? '#9b59b6' :
                      product.algorithm === 'popularity' ? '#f39c12' : '#3498db'
                    )
                  }}>
                    💡 {product.explanation}
                  </div>
                )}
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#2c3e50'
                  }}>
                    ${product.price}
                  </span>
                  <span style={{
                    backgroundColor: '#3498db',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem'
                  }}>
                    {product.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Recommendations;