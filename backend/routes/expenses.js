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
// SETTLEMENT ROUTES
// ============================================

// Get all settlements for a group
router.get('/settlements/:groupId', getSettlements);

// Mark a settlement as complete
router.put('/settlements/:id/complete', completeSettlement);

// Send settlement notifications to group members
router.post('/send-settlements/:groupId', sendSettlementNotifications);

module.exports = router;
