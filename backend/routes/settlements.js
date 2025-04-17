const express = require('express');
const mongoose = require('mongoose');
const { 
  getSettlements,
  completeSettlement,
  sendSettlementNotifications
} = require('../controllers/expenseController');
const Settlement = require('../models/Settlement');
const router = express.Router();

// Get all settlements (no groupId filter)
router.get('/', async (req, res) => {
  try {
    // Find all settlements, limited to most recent 100 for performance
    const settlements = await Settlement.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    res.json(settlements);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settlements',
      error: err.message
    });
  }
});

// Get all settlements for a group
router.get('/:groupId', getSettlements);

// Mark a settlement as complete
router.put('/:id/complete', completeSettlement);

// Send settlement notifications to group members
router.post('/send/:groupId', sendSettlementNotifications);

// Add direct routes for compatibility with frontend
router.get('/settlements/:groupId', getSettlements);
router.put('/settlements/:id/complete', completeSettlement);
router.post('/send-settlements/:groupId', sendSettlementNotifications);

module.exports = router; 