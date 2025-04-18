const express = require('express');
const mongoose = require('mongoose');
const { 
  getExpenses, 
  getExpenseById, 
  addExpense, 
  updateExpense, 
  deleteExpense,
  getSettlements,
  completeSettlement,
  sendSettlementNotifications
} = require('../controllers/expenseController');
const router = express.Router();

// ============================================
// EXPENSE ROUTES
// ============================================

// Get all expenses (no groupId filter)
router.get('/', async (req, res) => {
  try {
    // Find all expenses, limited to most recent 100 for performance
    const expenses = await require('../models/Expense').find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    res.json(expenses);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: err.message
    });
  }
});

// Create a new expense
router.post('/', addExpense);

// Get a specific expense by ID
router.get('/detail/:id', getExpenseById);

// Update an expense
router.put('/:id', updateExpense);

// Delete an expense
router.delete('/:id', deleteExpense);

// Get all expenses for a group
router.get('/:groupId', getExpenses);

// ============================================
// SETTLEMENT ROUTES - MOVED TO settlements.js
// ============================================

module.exports = router;
