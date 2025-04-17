const mongoose = require('mongoose');

// Define schema for payers
const PayerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: () => new mongoose.Types.ObjectId()
  },
  name: {
    type: String,
    trim: true,
    default: 'Unknown'
  },
  amount: {
    type: Number,
    default: 0
  }
}, { _id: false }); // Prevent Mongoose from creating _id for subdocuments

// Define schema for expense
const ExpenseSchema = new mongoose.Schema({
  // Fields from the frontend form
  expenseName: {
    type: String,
    trim: true,
    default: 'Untitled Expense'
  },
  title: {
    type: String,
    trim: true,
    default: function() {
      return this.expenseName || 'Untitled Expense';
    }
  },
  amount: {
    type: Number,
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  splitEqually: {
    type: Boolean,
    default: true
  },
  multiPayer: {
    type: Boolean,
    default: false
  },
  
  // Relationship fields
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    index: true
  },
  
  // Payers information
  payers: {
    type: [PayerSchema],
    default: function() {
      return [{
        userId: new mongoose.Types.ObjectId(),
        name: 'Unknown',
        amount: this.amount || 0
      }];
    }
  },
  
  // Additional fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: () => new mongoose.Types.ObjectId()
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true, // Automatically manage createdAt and updatedAt
  strict: false,     // Allow additional fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update the updatedAt field before saving
ExpenseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Make sure title matches expenseName if not set
  if (!this.title && this.expenseName) {
    this.title = this.expenseName;
  }
  
  next();
});

// Clear existing model to prevent "OverwriteModelError"
if (mongoose.models.Expense) {
  delete mongoose.models.Expense;
}

// Create and export the model
module.exports = mongoose.model('Expense', ExpenseSchema);
