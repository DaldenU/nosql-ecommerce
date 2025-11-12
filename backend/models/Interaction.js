const mongoose = require('mongoose');

const interactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['view', 'like', 'purchase', 'cart'],
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient querying
interactionSchema.index({ userId: 1, productId: 1 });
interactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Interaction', interactionSchema);