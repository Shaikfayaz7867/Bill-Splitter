const Expense = require('../models/Expense');
const Group = require('../models/Group');
const Settlement = require('../models/Settlement');
const { calculateBalance } = require('../utils/balanceService');
const { sendSettlementEmail, sendBalanceSummaryEmail } = require('../utils/emailService');
const mongoose = require('mongoose');

// Error handling wrapper function to make controllers more consistent
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next))
    .catch((err) => {
      console.error('Controller error:', err);
      if (!res.headersSent) {
        res.status(err.status || 500).json({
          success: false,
          message: err.message || 'An unexpected error occurred',
          error: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
      }
    });
};

/**
 * Get all expenses for a group
 * @route GET /api/expenses/:groupId
 * @access Public
 */
exports.getExpenses = asyncHandler(async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
    // Validate groupId
    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: 'Group ID is required'
      });
    }
    
    // Find all expenses for the group, sorted by date
    const expenses = await Expense.find({ groupId })
      .sort({ date: -1 })
      .lean();  // Use lean() for better performance
    
    // Return the expenses
    res.status(200).json(expenses);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: err.message
    });
  }
});

/**
 * Get a specific expense by ID
 * @route GET /api/expenses/detail/:id
 * @access Public
 */
exports.getExpenseById = async (req, res) => {
  try {
    const expenseId = req.params.id;
    
    // Find the expense by ID
    const expense = await Expense.findById(expenseId).lean();
    
    // Check if expense exists
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Return the expense
    res.status(200).json(expense);
  } catch (err) {
    // Handle ObjectId validation error
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Invalid expense ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense',
      error: err.message
    });
  }
};

/**
 * Add a new expense
 * @route POST /api/expenses
 * @access Public
 */
exports.addExpense = async (req, res) => {
  try {
    // Log the incoming request data
    
    // Extract data from request body
    const { 
      expenseName,
      amount, 
      date, 
      splitEqually, 
      multiPayer, 
      payers, 
      groupId,
      createdBy
    } = req.body;
    
    // Validate that groupId exists
    if (!groupId) {
      return res.status(400).json({ 
        success: false,
        message: 'Group ID is required' 
      });
    }
    
    // Create a new expense object with all data from the request
    const expense = new Expense({
      expenseName,
      amount: parseFloat(amount) || 0,
      date: date || new Date(),
      splitEqually: Boolean(splitEqually),
      multiPayer: Boolean(multiPayer),
      groupId,
      payers: payers || [],
      createdBy: createdBy || new mongoose.Types.ObjectId()
    });
    
    // Save to database
    const savedExpense = await expense.save();
    
    // Return the created expense
    res.status(201).json(savedExpense);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: err.message
    });
  }
};

/**
 * Update an expense
 * @route PUT /api/expenses/:id
 * @access Public
 */
exports.updateExpense = async (req, res) => {
  try {
    const { 
      expenseName,
      amount,
      date,
      splitEqually,
      multiPayer,
      payers
    } = req.body;
    
    // Build update object
    const expenseFields = {};
    if (expenseName) expenseFields.expenseName = expenseName;
    if (amount) expenseFields.amount = parseFloat(amount);
    if (date) expenseFields.date = date;
    if (splitEqually !== undefined) expenseFields.splitEqually = splitEqually;
    if (multiPayer !== undefined) expenseFields.multiPayer = multiPayer;
    if (payers) expenseFields.payers = payers;
    
    // Find expense and update
    let expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ msg: 'Expense not found' });
    }
    
    // Update expense
    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { $set: expenseFields },
      { new: true }
    );
    
    // Update settlements based on updated expense
    await updateSettlements(expense.groupId);
    
    res.json(expense);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Expense not found' });
    }
    res.status(500).send('Server Error');
  }
};

/**
 * Delete an expense
 * @route DELETE /api/expenses/:id
 * @access Public
 */
exports.deleteExpense = async (req, res) => {
  try {
    // Find expense
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({ msg: 'Expense not found' });
    }
    
    // Store groupId for settlement update
    const groupId = expense.groupId;
    
    // Delete expense
    await Expense.findByIdAndRemove(req.params.id);
    
    // Update settlements based on deleted expense
    await updateSettlements(groupId);
    
    res.json({ msg: 'Expense deleted' });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Expense not found' });
    }
    res.status(500).send('Server Error');
  }
};

/**
 * Send settlement notifications for specific group
 * @route POST /api/expenses/send-settlements/:groupId
 * @access Public
 */
exports.sendSettlementNotifications = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    
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
        const newSettlement = await Settlement.create({
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
};

/**
 * Mark a settlement as complete
 * @route PUT /api/expenses/settlements/:id/complete
 * @access Public
 */
exports.completeSettlement = async (req, res) => {
  try {
    console.log('Starting settlement completion process for ID:', req.params.id);
    
    // Find settlement
    const settlement = await Settlement.findById(req.params.id);
    
    if (!settlement) {
      console.log('Settlement not found for ID:', req.params.id);
      return res.status(404).json({ msg: 'Settlement not found' });
    }
    
    console.log('Found settlement:', settlement);
    
    // Get the group to find members and their emails
    const group = await Group.findById(settlement.groupId);
    if (!group) {
      console.log('Group not found for ID:', settlement.groupId);
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    console.log('Found group with', group.members.length, 'members');
    
    // Update settlement
    settlement.status = 'completed';
    settlement.completedAt = new Date();
    
    await settlement.save();
    console.log('Settlement updated to completed status');
    
    // Send email notification to all group members
    console.log('Starting to send email notifications to group members');
    const emailResults = [];
    
    // Loop through each group member
    for (const member of group.members) {
      // Skip if no email
      if (!member.email) {
        console.log('Skipping member without email:', member.name);
        continue;
      }
      
      console.log('Sending email notification to:', member.name, member.email);
      
      // Send email notification
      try {
        const emailResult = await sendSettlementEmail({
          to: member.email,
          subject: `Bill Splitter - Settlement Completed in ${group.name}`,
          groupName: group.name,
          fromPerson: settlement.from,
          toPerson: settlement.to,
          amount: settlement.amount,
          isCompletionNotification: true // Flag for customizing the email template
        });
        
        console.log('Email sending result for', member.name, ':', emailResult.success ? 'Success' : 'Failed');
        
        emailResults.push({
          member: member.name,
          success: emailResult.success,
          error: emailResult.error
        });
      } catch (emailErr) {
        console.error(`Error sending email to ${member.name}:`, emailErr);
        emailResults.push({
          member: member.name,
          success: false,
          error: emailErr.message
        });
      }
    }
    
    console.log('Email sending complete. Results:', {
      sent: emailResults.filter(r => r.success).length,
      total: emailResults.length
    });
    
    // Return the updated settlement along with email results
    res.json({
      settlement,
      emailsSent: emailResults.filter(r => r.success).length,
      totalEmails: emailResults.length,
      emailResults
    });
  } catch (err) {
    console.error('Error in completeSettlement:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Settlement not found' });
    }
    console.error('Error completing settlement:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: err.message
    });
  }
};

/**
 * Get all settlements for a group
 * @route GET /api/expenses/settlements/:groupId
 * @access Public
 */
exports.getSettlements = async (req, res) => {
  try {
    const settlements = await Settlement.find({ 
      groupId: req.params.groupId 
    }).sort({ createdAt: -1 });
    
    res.json(settlements);
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

/**
 * Helper function to update settlements for a group
 * @param {String} groupId - Group ID
 */
const updateSettlements = async (groupId) => {
  try {
    // Get group
    const group = await Group.findById(groupId);
    if (!group) return;
    
    // Get expenses
    const expenses = await Expense.find({ groupId });
    
    // Calculate settlements
    const balanceData = calculateBalance(group.members, expenses);
    
    // Delete existing settlements that are not completed
    await Settlement.deleteMany({ 
      groupId, 
      status: 'pending' 
    });
    
    // Create new settlements
    const newSettlements = balanceData.settlements.map(s => ({
      groupId,
      from: s.from,
      to: s.to,
      amount: s.amount,
      status: 'pending',
      emailSent: false
    }));
    
    if (newSettlements.length > 0) {
      await Settlement.insertMany(newSettlements);
    }
    
    return true;
  } catch (err) {
    return false;
  }
};
