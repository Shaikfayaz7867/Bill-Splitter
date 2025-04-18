const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Settlement = require('../models/Settlement');
const { 
  getSettlements,
  completeSettlement,
  sendSettlementNotifications
} = require('../controllers/expenseController');

// GET /api/settlements
// Get all settlements (no groupId filter)
router.get('/', async (req, res) => {
  try {
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

// GET /api/settlements/:groupId
// Get settlements for a specific group
router.get('/:groupId', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const settlements = await Settlement.find({ groupId })
      .sort({ createdAt: -1 });
    
    res.json(settlements);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settlements',
      error: err.message
    });
  }
});

// PUT /api/settlements/:id/complete
// Mark a settlement as complete
router.put('/:id/complete', async (req, res) => {
  try {
    const settlement = await Settlement.findById(req.params.id);
    
    if (!settlement) {
      return res.status(404).json({ msg: 'Settlement not found' });
    }
    
    settlement.status = 'completed';
    settlement.completedAt = new Date();
    
    await settlement.save();
    
    res.json(settlement);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Settlement not found' });
    }
    res.status(500).send('Server Error');
  }
});

// POST /api/settlements/send/:groupId
// Send settlement notifications
router.post('/send/:groupId', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const Group = require('../models/Group');
    const { calculateBalance } = require('../utils/balanceService');
    const { sendSettlementEmail } = require('../utils/emailService');
    const Expense = require('../models/Expense');

    // Find group
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ 
        success: false,
        message: 'Group not found' 
      });
    }
    
    // Validate that members have emails
    let missingEmails = group.members.filter(member => !member.email).map(m => m.name);
    if (missingEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: `The following members are missing email addresses: ${missingEmails.join(', ')}`,
        missingEmails
      });
    }
    
    // Get all expenses for the group
    const expenses = await Expense.find({ groupId });
    
    // Calculate balance and settlements
    const balanceData = calculateBalance(group.members, expenses);
    
    // Get member email mapping
    const memberEmails = {};
    group.members.forEach(member => {
      memberEmails[member.name] = member.email;
    });
    
    // Send settlement notifications
    const emailResults = [];
    
    for (const settlement of balanceData.settlements) {
      const fromPerson = settlement.from;
      const toPerson = settlement.to;
      const amount = settlement.amount;
      
      // Get email addresses
      const fromEmail = memberEmails[fromPerson];
      
      if (!fromEmail) {
        emailResults.push({
          from: fromPerson,
          to: toPerson,
          success: false,
          error: 'Email address not found for sender'
        });
        continue;
      }
      
      // Send email notification
      const emailResult = await sendSettlementEmail({
        to: fromEmail,
        subject: `Bill Splitter - Payment Due for ${group.name}`,
        groupName: group.name,
        fromPerson,
        toPerson,
        amount
      });
      
      emailResults.push({
        from: fromPerson,
        to: toPerson,
        success: emailResult.success,
        error: emailResult.error,
        messageId: emailResult.messageId
      });
      
      // Create or update settlement record
      const existingSettlement = await Settlement.findOne({
        groupId,
        from: fromPerson,
        to: toPerson
      });
      
      if (existingSettlement) {
        existingSettlement.amount = amount;
        existingSettlement.emailSent = emailResult.success;
        await existingSettlement.save();
      } else {
        await Settlement.create({
          groupId,
          from: fromPerson,
          to: toPerson,
          amount,
          emailSent: emailResult.success
        });
      }
    }
    
    // Return the results
    res.status(200).json({
      success: true,
      message: `Sent ${emailResults.filter(r => r.success).length} of ${emailResults.length} notifications`,
      emailResults
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to send settlement notifications',
      error: err.message
    });
  }
});

module.exports = router; 