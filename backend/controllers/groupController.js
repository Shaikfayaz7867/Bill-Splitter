const Group = require('../models/Group');
const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');
const { calculateBalance } = require('../utils/balanceService');
const { sendBalanceSummaryEmail, sendSettlementEmail } = require('../utils/emailService');
const mongoose = require('mongoose');

/**
 * Get all groups
 * @route GET /api/groups
 * @access Public
 */
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find().sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/**
 * Get a specific group by ID
 * @route GET /api/groups/:id
 * @access Public
 */
exports.getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    res.json(group);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
};

/**
 * Create a new group
 * @route POST /api/groups
 * @access Public
 */
exports.createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    
    // Basic validation
    if (!name || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ msg: 'Name and at least one member are required' });
    }
    
    // Create formatted members with required userId field
    const memberDocs = members.map(member => ({
      userId: new mongoose.Types.ObjectId(), // Generate unique ObjectId
      name: member.name?.trim() || 'Unknown',
      email: member.email?.trim() || 'unknown@example.com',
      role: 'member',
      joinedAt: new Date()
    }));
    
    // Create raw document directly with mongoose 
    const groupDoc = {
      name: name.trim(),
      description: req.body.description || '',
      createdBy: new mongoose.Types.ObjectId(), // Generate a temp user ID
      members: memberDocs,
      category: req.body.category || 'other',
      currency: req.body.currency || 'USD',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Use direct create method instead of model validation
    const group = await Group.create(groupDoc);
    
    // Return success response
    res.status(201).json(group);
  } catch (err) {
    // Return meaningful error message
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * Update a group
 * @route PUT /api/groups/:id
 * @access Public
 */
exports.updateGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    
    // Build update object
    const groupFields = {};
    if (name) groupFields.name = name;
    if (members) groupFields.members = members;
    
    // Find group and update
    let group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    group = await Group.findByIdAndUpdate(
      req.params.id,
      { $set: groupFields },
      { new: true }
    );
    
    res.json(group);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
};

/**
 * Delete a group
 * @route DELETE /api/groups/:id
 * @access Public
 */
exports.deleteGroup = async (req, res) => {
  try {
    // Check if ID is valid MongoDB ObjectID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid group ID format' 
      });
    }
    
    // Find group and delete
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ 
        success: false,
        msg: 'Group not found' 
      });
    }
    
    try {
      // Delete all associated expenses
      const expenseDeleteResult = await Expense.deleteMany({ groupId: req.params.id });
      
      // Delete all associated settlements
      const settlementDeleteResult = await Settlement.deleteMany({ groupId: req.params.id });
      
      // Delete the group
      await Group.findByIdAndDelete(req.params.id);
      
      // Return detailed info about what was deleted
      return res.json({ 
        success: true,
        msg: 'Group and all related data deleted successfully',
        deletedData: {
          group: {
            id: group._id,
            name: group.name,
            memberCount: group.members.length
          },
          expenses: {
            count: expenseDeleteResult.deletedCount
          },
          settlements: {
            count: settlementDeleteResult.deletedCount
          }
        }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        msg: 'Error deleting related data',
        error: err.message
      });
    }
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        msg: 'Group not found' 
      });
    }
    return res.status(500).json({
      success: false,
      msg: 'Server Error',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

/**
 * Get the balance of a group
 * @route GET /api/groups/:id/balance
 * @access Public
 */
exports.getGroupBalance = async (req, res) => {
  try {
    // Find group
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    // Get expenses for the group
    const expenses = await Expense.find({ groupId: req.params.id });
    
    // Calculate balance
    const balanceData = calculateBalance(group.members, expenses);
    
    res.json(balanceData);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
};

/**
 * Send balance summary emails to all group members
 * @route POST /api/groups/:id/send-summary
 * @access Public
 */
exports.sendBalanceSummary = async (req, res) => {
  try {
    // Find group
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ msg: 'Group not found' });
    }
    
    // Get expenses for the group
    const expenses = await Expense.find({ groupId: req.params.id });
    
    // Calculate balance
    const balanceData = calculateBalance(group.members, expenses);
    
    // Track which emails were sent successfully
    const emailResults = [];
    
    // Send email to each member
    for (const member of group.members) {
      const memberName = member.name;
      const memberEmail = member.email;
      
      // Get balance info for this member
      const memberBalance = balanceData.memberBalances[memberName] || {
        paid: 0,
        share: balanceData.perPersonShare,
        balance: -balanceData.perPersonShare // Default to owing their share
      };
      
      // Get settlements that involve this member
      const relevantSettlements = balanceData.settlements.filter(
        s => s.from === memberName || s.to === memberName
      );
      
      // Send email
      const emailResult = await sendBalanceSummaryEmail({
        to: memberEmail,
        subject: `Bill Splitter - Balance Summary for ${group.name}`,
        groupName: group.name,
        userName: memberName,
        balances: relevantSettlements.map(s => {
          const isFrom = s.from === memberName;
          return {
            withPerson: isFrom ? s.to : s.from,
            amount: isFrom ? -s.amount : s.amount // Negative if they owe money
          };
        })
      });
      
      emailResults.push({
        member: memberName,
        email: memberEmail,
        success: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.error
      });
    }
    
    res.json({
      success: true,
      emailsSent: emailResults.filter(r => r.success).length,
      totalMembers: group.members.length,
      results: emailResults
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Group not found' });
    }
    res.status(500).send('Server Error');
  }
};
