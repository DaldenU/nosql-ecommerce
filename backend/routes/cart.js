const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Interaction = require('../models/Interaction');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Get user's cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId }).populate('items.productId');
    
    if (!cart) {
      return res.json({ items: [], total: 0 });
    }

    // Calculate total price
    const total = cart.items.reduce((sum, item) => {
      if (item.productId) {
        return sum + (item.productId.price * item.quantity);
      }
      return sum;
    }, 0);

    res.json({
      items: cart.items,
      total: total.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cart', error: error.message });
  }
});

// Add item to cart
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let cart = await Cart.findOne({ userId: req.userId });

    if (!cart) {
      // Create new cart
      cart = new Cart({
        userId: req.userId,
        items: [{ productId, quantity }]
      });
    } else {
      // Check if product already in cart
      const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        // Check stock for updated quantity
        if (product.stock < newQuantity) {
          return res.status(400).json({ message: 'Insufficient stock for this quantity' });
        }
        
        cart.items[existingItemIndex].quantity = newQuantity;
      } else {
        // Add new item
        cart.items.push({ productId, quantity });
      }
    }

    await cart.save();

    // Record cart interaction
    const interaction = new Interaction({
      userId: req.userId,
      productId,
      type: 'cart'
    });
    await interaction.save();

    const populatedCart = await Cart.findById(cart._id).populate('items.productId');
    res.json({ message: 'Item added to cart', cart: populatedCart });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add item to cart', error: error.message });
  }
});

// Update cart item quantity
router.put('/update/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    // Validate product and stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate('items.productId');
    res.json({ message: 'Cart updated', cart: populatedCart });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update cart', error: error.message });
  }
});

// Remove item from cart
router.delete('/remove/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );

    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate('items.productId');
    res.json({ message: 'Item removed from cart', cart: populatedCart });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove item', error: error.message });
  }
});

// Clear cart
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId });
    if (!cart) {
      return res.json({ message: 'Cart is already empty' });
    }

    cart.items = [];
    await cart.save();

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear cart', error: error.message });
  }
});

// Checkout (purchase all items in cart)
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId }).populate('items.productId');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const User = require('../models/User');

    // Validate stock and calculate total
    let total = 0;
    for (const item of cart.items) {
      if (!item.productId) {
        return res.status(400).json({ message: 'Invalid product in cart' });
      }

      if (item.productId.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.productId.name}` 
        });
      }

      total += item.productId.price * item.quantity;
    }

    // Process each item
    for (const item of cart.items) {
      // Update product stock
      await Product.findByIdAndUpdate(item.productId._id, {
        $inc: { stock: -item.quantity }
      });

      // Record purchase interaction
      const interaction = new Interaction({
        userId: req.userId,
        productId: item.productId._id,
        type: 'purchase'
      });
      await interaction.save();

      // Update user purchase history
      await User.findByIdAndUpdate(req.userId, {
        $push: {
          purchaseHistory: {
            productId: item.productId._id,
            price: item.productId.price * item.quantity
          }
        }
      });
    }

    // Clear cart after successful checkout
    cart.items = [];
    await cart.save();

    res.json({ 
      message: 'Checkout successful', 
      total: total.toFixed(2),
      itemCount: cart.items.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Checkout failed', error: error.message });
  }
});

module.exports = router;
