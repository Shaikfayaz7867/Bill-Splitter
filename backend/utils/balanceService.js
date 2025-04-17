/**
 * Calculate the balance and settlements for a group
 * @param {Array} members - List of group members
 * @param {Array} expenses - List of expenses
 * @returns {Object} - Balance details and settlements
 */
const calculateBalance = (members, expenses) => {
  if (!members || !members.length || !expenses || !expenses.length) {
    return {
      totalExpense: 0,
      perPersonShare: 0,
      memberBalances: {},
      settlements: []
    };
  }

  // Calculate total expense
  const totalExpense = expenses.reduce((acc, expense) => 
    acc + (parseFloat(expense.amount) || 0), 0);
  
  // Calculate per person share
  const perPersonShare = totalExpense / members.length;
  
  // Initialize member balances
  const memberBalances = {};
  members.forEach(member => {
    const memberName = typeof member === 'string' ? member : member.name;
    memberBalances[memberName] = {
      name: memberName,
      paid: 0,
      share: perPersonShare,
      balance: 0
    };
  });

  // Calculate how much each member paid and their balance
  expenses.forEach(expense => {
    const amount = parseFloat(expense.amount) || 0;
    
    // Handle multiple payers case
    if (expense.multiPayer && expense.payers && expense.payers.length > 0) {
      expense.payers.forEach(payer => {
        const payerName = payer.name;
        const payerAmount = parseFloat(payer.amount) || 0;
        
        if (memberBalances[payerName]) {
          memberBalances[payerName].paid += payerAmount;
        }
      });
    } else {
      // Legacy single payer
      const payerName = expense.payer || (expense.payers && expense.payers[0]?.name);
      if (payerName && memberBalances[payerName]) {
        memberBalances[payerName].paid += amount;
      }
    }
  });
  
  // Calculate final balance
  Object.keys(memberBalances).forEach(memberName => {
    memberBalances[memberName].balance = 
      memberBalances[memberName].paid - memberBalances[memberName].share;
  });
  
  // Calculate settlements
  const settlements = calculateSettlements(memberBalances);
  
  return {
    totalExpense,
    perPersonShare,
    memberBalances,
    settlements
  };
};

/**
 * Calculate the settlements based on member balances
 * @param {Object} memberBalances - Balance information for each member
 * @returns {Array} - List of settlements
 */
const calculateSettlements = (memberBalances) => {
  const settlements = [];
  const debtors = [];  // People who owe money (negative balance)
  const creditors = []; // People who are owed money (positive balance)
  
  // Separate debtors and creditors
  Object.keys(memberBalances).forEach(memberName => {
    const balance = memberBalances[memberName].balance;
    if (balance < -0.01) {  // Debtor (owes money)
      debtors.push({ 
        name: memberName, 
        amount: Math.abs(balance)
      });
    } else if (balance > 0.01) {  // Creditor (is owed money)
      creditors.push({ 
        name: memberName, 
        amount: balance
      });
    }
  });
  
  // Sort by amount (largest first)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);
  
  // Calculate settlements
  debtors.forEach(debtor => {
    let remaining = debtor.amount;
    
    while (remaining > 0.01 && creditors.length > 0) {
      const creditor = creditors[0];
      
      if (creditor.amount >= remaining) {
        // The creditor can cover the full debt
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: remaining
        });
        
        creditor.amount -= remaining;
        remaining = 0;
        
        // If the creditor is now settled, remove them
        if (creditor.amount < 0.01) {
          creditors.shift();
        }
      } else {
        // The creditor can only cover part of the debt
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: creditor.amount
        });
        
        remaining -= creditor.amount;
        creditors.shift();
      }
    }
  });
  
  return settlements;
};

module.exports = {
  calculateBalance,
  calculateSettlements
}; 