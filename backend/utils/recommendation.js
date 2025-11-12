const Interaction = require('../models/Interaction');
const Product = require('../models/Product');
const User = require('../models/User');

/**
 * Advanced Hybrid Recommendation System
 * Combines collaborative filtering, content-based filtering, and popularity-based recommendations
 */

async function generateRecommendations(userId, limit = 10) {
  try {
    console.log(`Generating recommendations for user: ${userId}`);
    
    const userInteractions = await Interaction.find({ userId }).limit(100);
    
    if (userInteractions.length === 0) {
      return await getPopularProducts(limit);
    }
    
    const interactedProductIds = userInteractions.map(i => i.productId.toString());
    
    const [collaborativeRecs, contentRecs, popularRecs] = await Promise.all([
      generateCollaborativeRecommendations(userId, userInteractions, interactedProductIds, limit),
      generateContentRecommendations(userInteractions, interactedProductIds, limit),
      getPopularProducts(limit, interactedProductIds)
    ]);
    
    const combinedRecs = combineRecommendations(collaborativeRecs, contentRecs, popularRecs, limit);
    
    console.log(`Generated ${combinedRecs.length} recommendations`);
    return combinedRecs;
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return await getPopularProducts(limit);
  }
}

/**
 * Collaborative Filtering: Find users with similar preferences
 */
async function generateCollaborativeRecommendations(userId, userInteractions, interactedProductIds, limit) {
  try {
    const similarUsers = await findSimilarUsers(userId, userInteractions);
    
    if (similarUsers.length === 0) {
      return [];
    }
    
    const recommendations = new Map();
    
    for (const similarUser of similarUsers) {
      const theirInteractions = await Interaction.find({ 
        userId: similarUser.userId,
        type: { $in: ['like', 'purchase', 'cart'] }
      }).limit(50);
      
      theirInteractions.forEach(interaction => {
        const productId = interaction.productId.toString();
        if (!interactedProductIds.includes(productId)) {
          const score = getInteractionScore(interaction) * similarUser.similarity;
          recommendations.set(productId, (recommendations.get(productId) || 0) + score);
        }
      });
    }
    
    const sorted = Array.from(recommendations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([productId, score]) => ({ productId, score, algorithm: 'collaborative' }));
    
    const productIds = sorted.map(r => r.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    
    return products.map(product => ({
      ...product.toObject(),
      explanation: 'Users with similar preferences also liked this',
      algorithm: 'collaborative'
    }));
    
  } catch (error) {
    console.error('Error in collaborative filtering:', error);
    return [];
  }
}

/**
 * Content-Based Filtering: Match products to user preferences
 */
async function generateContentRecommendations(userInteractions, interactedProductIds, limit) {
  try {
    const userProfile = await buildUserProfile(userInteractions);
    
    const candidateProducts = await Product.find({
      _id: { $nin: interactedProductIds }
    }).limit(500);
    
    const scoredProducts = candidateProducts.map(product => {
      const score = calculateContentScore(userProfile, product);
      return { product, score };
    });
    
    const topProducts = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({
        ...item.product.toObject(),
        explanation: 'Matches your interests based on past interactions',
        algorithm: 'content'
      }));
    
    return topProducts;
    
  } catch (error) {
    console.error('Error in content-based recommendations:', error);
    return [];
  }
}

/**
 * Find users with similar interaction patterns using Jaccard similarity
 */
async function findSimilarUsers(userId, userInteractions) {
  try {
    const userProductIds = new Set(userInteractions.map(i => i.productId.toString()));
    const otherUsers = await User.find({ _id: { $ne: userId } }).limit(100);
    
    const similarities = [];
    
    for (const otherUser of otherUsers) {
      const theirInteractions = await Interaction.find({ userId: otherUser._id }).limit(100);
      const theirProductIds = new Set(theirInteractions.map(i => i.productId.toString()));
      
      const intersection = new Set([...userProductIds].filter(x => theirProductIds.has(x)));
      const union = new Set([...userProductIds, ...theirProductIds]);
      
      if (union.size > 0) {
        const similarity = intersection.size / union.size;
        if (similarity > 0.1) {
          similarities.push({ userId: otherUser._id, similarity });
        }
      }
    }
    
    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, 10);
    
  } catch (error) {
    console.error('Error finding similar users:', error);
    return [];
  }
}

/**
 * Build user preference profile from interaction history
 */
async function buildUserProfile(userInteractions) {
  const profile = {
    categories: new Map(),
    avgPrice: 0,
    avgRating: 0,
    preferredTypes: new Map()
  };
  
  const productIds = userInteractions.map(i => i.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  
  let totalPrice = 0;
  let totalRating = 0;
  let count = 0;
  
  products.forEach(product => {
    const category = product.category;
    const interaction = userInteractions.find(i => i.productId.equals(product._id));
    const score = getInteractionScore(interaction);
    
    profile.categories.set(category, (profile.categories.get(category) || 0) + score);
    
    totalPrice += product.price;
    totalRating += product.rating;
    count++;
  });
  
  userInteractions.forEach(interaction => {
    const type = interaction.type;
    profile.preferredTypes.set(type, (profile.preferredTypes.get(type) || 0) + 1);
  });
  
  if (count > 0) {
    profile.avgPrice = totalPrice / count;
    profile.avgRating = totalRating / count;
  }
  
  return profile;
}

/**
 * Calculate content-based score for a product given user profile
 */
function calculateContentScore(userProfile, product) {
  let score = 0;
  
  const categoryScore = userProfile.categories.get(product.category) || 0;
  const maxCategoryScore = Math.max(...userProfile.categories.values(), 1);
  score += 0.4 * (categoryScore / maxCategoryScore);
  
  if (userProfile.avgPrice > 0) {
    const priceDiff = Math.abs(product.price - userProfile.avgPrice);
    const priceScore = Math.max(0, 1 - (priceDiff / userProfile.avgPrice));
    score += 0.2 * priceScore;
  }
  
  if (userProfile.avgRating > 0) {
    const ratingDiff = Math.abs(product.rating - userProfile.avgRating);
    const ratingScore = Math.max(0, 1 - (ratingDiff / 5));
    score += 0.3 * ratingScore;
  }
  
  score += 0.1 * (product.rating / 5);
  
  return score;
}

/**
 * Get popular products based on recent interactions
 */
async function getPopularProducts(limit, excludeIds = []) {
  try {
    const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const popularProducts = await Interaction.aggregate([
      {
        $match: {
          productId: { $nin: excludeIds },
          createdAt: { $gte: recentDate }
        }
      },
      {
        $group: {
          _id: '$productId',
          totalScore: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ['$type', 'purchase'] }, then: 5 },
                  { case: { $eq: ['$type', 'like'] }, then: 3 },
                  { case: { $eq: ['$type', 'cart'] }, then: 2 },
                  { case: { $eq: ['$type', 'view'] }, then: 1 }
                ],
                default: 1
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { totalScore: -1 }
      },
      {
        $limit: limit
      }
    ]);
    
    const productIds = popularProducts.map(p => p._id);
    const products = await Product.find({ _id: { $in: productIds } });
    
    return products.map(product => ({
      ...product.toObject(),
      explanation: 'Popular and trending product',
      algorithm: 'popularity'
    }));
    
  } catch (error) {
    console.error('Error getting popular products:', error);
    const products = await Product.find({})
      .sort({ rating: -1 })
      .limit(limit);
    
    return products.map(product => ({
      ...product.toObject(),
      explanation: 'Highly rated product',
      algorithm: 'rating'
    }));
  }
}

/**
 * Get weighted score for different interaction types
 */
function getInteractionScore(interaction) {
  const scores = {
    purchase: 5,
    like: 4,
    cart: 3,
    view: 1
  };
  return scores[interaction.type] || 1;
}

/**
 * Combine recommendations from different algorithms with weighted scoring
 */
function combineRecommendations(collaborative, content, popular, limit) {
  const combined = new Map();
  
  collaborative.forEach(item => {
    combined.set(item._id.toString(), {
      ...item,
      combinedScore: 0.4
    });
  });
  
  content.forEach(item => {
    const id = item._id.toString();
    if (combined.has(id)) {
      combined.get(id).combinedScore += 0.4;
    } else {
      combined.set(id, {
        ...item,
        combinedScore: 0.4
      });
    }
  });
  
  popular.forEach(item => {
    const id = item._id.toString();
    if (combined.has(id)) {
      combined.get(id).combinedScore += 0.2;
    } else {
      combined.set(id, {
        ...item,
        combinedScore: 0.2
      });
    }
  });
  
  return Array.from(combined.values())
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, limit);
}

module.exports = { generateRecommendations };
