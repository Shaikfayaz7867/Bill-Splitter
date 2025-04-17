const express = require('express');
const { 
  getGroups, 
  getGroupById, 
  createGroup, 
  updateGroup, 
  deleteGroup, 
  getGroupBalance, 
  sendBalanceSummary 
} = require('../controllers/groupController');
const router = express.Router();

// Basic CRUD routes
router.get('/', getGroups);
router.get('/:id', getGroupById);
router.post('/', createGroup);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);

// Balance and notifications
router.get('/:id/balance', getGroupBalance);
router.post('/:id/send-summary', sendBalanceSummary);

module.exports = router;
