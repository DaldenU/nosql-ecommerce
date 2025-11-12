const express = require('express');
const { authMiddleware } = require('./auth');
const { generateRecommendations } = require('../utils/recommendation');
const Interaction = require('../models/Interaction');
const Product = require('../models/Product');

const router = express.Router();

// Get personalized recommendations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const recommendations = await generateRecommendations(req.userId);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate recommendations', error: error.message });
  }
});

// Get user's interaction history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const interactions = await Interaction.find({ userId: req.userId })
      .populate('productId')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(interactions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history', error: error.message });
  }
});

module.exports = router;