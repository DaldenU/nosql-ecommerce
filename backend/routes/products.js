const express = require('express');
const Product = require('../models/Product');
const Interaction = require('../models/Interaction');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Get all products with pagination and search
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    const query = {};

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch product', error: error.message });
  }
});

// Create product (admin)
router.post('/', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

// Record interaction (view, like, purchase)
router.post('/:id/interact', authMiddleware, async (req, res) => {
  try {
    const { type, rating } = req.body;
    
    const interaction = new Interaction({
      userId: req.userId,
      productId: req.params.id,
      type,
      rating
    });

    await interaction.save();

    // Update purchase history if it's a purchase
    if (type === 'purchase') {
      const product = await Product.findById(req.params.id);
      await User.findByIdAndUpdate(req.userId, {
        $push: {
          purchaseHistory: {
            productId: req.params.id,
            price: product.price
          }
        }
      });
    }

    res.status(201).json({ message: 'Interaction recorded', interaction });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record interaction', error: error.message });
  }
});

// Get categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
});

module.exports = router;