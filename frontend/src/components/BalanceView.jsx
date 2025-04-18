import React, { useState } from 'react';
import { groupService, expenseService } from '../services/api';

const BalanceView = ({ group, expenses, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [summarySent, setSummarySent] = useState(false);
  const [notificationsSent, setNotificationsSent] = useState(false);

  // Handle sending settlement notifications
  const handleSendSettlementEmails = async () => {
    try {
      setLoading(true);
      setNotification(null);
      
      const response = await expenseService.sendSettlementNotifications(group._id);
      
      setNotification({
        type: 'success',
        message: 'Settlement notifications sent successfully!'
      });
      
      setNotificationsSent(true);
      
      // Optional: refresh data after sending emails
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error sending settlement emails:', error);
      setNotification({
        type: 'danger',
        message: 'Failed to send settlement notifications. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle sending balance summary
  const handleSendBalanceSummary = async () => {
    try {
      setLoading(true);
      setNotification(null);
      
      const response = await groupService.sendBalanceSummary(group._id);
      
      setNotification({
        type: 'success',
        message: 'Balance summary emails sent successfully!'
      });
      
      setSummarySent(true);
      
      // Optional: refresh data after sending emails
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error sending balance summary:', error);
      setNotification({
        type: 'danger',
        message: 'Failed to send balance summary. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle case where expenses or members aren't available
  if (!expenses || !expenses.length || !group.members || !group.members.length) {
    return (
      <div className="card">
        <div className="card-body">
          <h5 className="card-title mb-4 d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-wallet2 me-2" viewBox="0 0 16 16">
              <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9a1.5 1.5 0 0 1 1.432-1.499L12.136.326zM5.562 3H13V1.78a.5.5 0 0 0-.621-.484L5.562 3zM1.5 4a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-13z"/>
            </svg>
            Balance Summary
          </h5>
          <div className="text-center py-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-wallet2 text-muted mb-3" viewBox="0 0 16 16">
              <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9a1.5 1.5 0 0 1 1.432-1.499L12.136.326zM5.562 3H13V1.78a.5.5 0 0 0-.621-.484L5.562 3zM1.5 4a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-13z"/>
            </svg>
            <p className="text-muted">No balance information available yet</p>
            <p className="text-muted small">Add expenses to see the balance</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total expenses
  const totalExpense = expenses.reduce((acc, expense) => 
    acc + (parseFloat(expense.amount) || 0), 0);
  
  // Initialize balance for each member
  const memberBalance = {};
  group.members.forEach(member => {
    const memberName = member.name || member;
    memberBalance[memberName] = 0;
  });

  // Calculate shares and balance
  expenses.forEach(expense => {
    const amount = parseFloat(expense.amount) || 0;
    const share = amount / group.members.length;
    
    // Handle multiple payers if expense has payers array
    if (expense.multiPayer && expense.payers && expense.payers.length > 0) {
      // Add the paid amount to each payer
      expense.payers.forEach(payer => {
        const payerName = payer.name;
        const payerAmount = parseFloat(payer.amount) || 0;
        
        if (memberBalance[payerName] !== undefined) {
          memberBalance[payerName] += payerAmount;
        }
      });
    } else {
      // Legacy support for single payer
      const payerName = expense.payer || (expense.payers && expense.payers[0]?.name);
      if (payerName && memberBalance[payerName] !== undefined) {
        memberBalance[payerName] += amount;
      }
    }
    
    // Subtract equal shares from everyone
    Object.keys(memberBalance).forEach(member => {
      if (memberBalance[member] !== undefined) {
        memberBalance[member] -= share;
      }
    });
  });

  // Format currency
  const formatCurrency = (amount) => {
    return Math.abs(amount).toFixed(2);
  };

  // Calculate who owes who
  const settlements = calculateSettlements(memberBalance);

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title mb-4 d-flex align-items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-wallet2 me-2" viewBox="0 0 16 16">
            <path d="M12.136.326A1.5 1.5 0 0 1 14 1.78V3h.5A1.5 1.5 0 0 1 16 4.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 13.5v-9a1.5 1.5 0 0 1 1.432-1.499L12.136.326zM5.562 3H13V1.78a.5.5 0 0 0-.621-.484L5.562 3zM1.5 4a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-13z"/>
          </svg>
          Balance Summary
        </h5>
        
        {/* Notification alert */}
        {notification && (
          <div className={`alert alert-${notification.type} alert-dismissible fade show mb-3`} role="alert">
            {notification.message}
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setNotification(null)}></button>
          </div>
        )}
        
        <div className="row mb-4">
          <div className="col-sm-6">
            <div className="card bg-light border-0">
              <div className="card-body p-3">
                <div className="d-flex justify-content-between">
                  <span>Total expenses:</span>
                  <span className="fw-bold">${totalExpense.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Per person:</span>
                  <span className="fw-bold">${(totalExpense / group.members.length).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Email buttons */}
          <div className="col-sm-6 d-flex flex-column justify-content-center">
            <div className="d-grid gap-2 mt-2 mt-sm-0">
              <button 
                className={`btn ${summarySent ? 'btn-success' : 'btn-outline-primary'}`}
                onClick={handleSendBalanceSummary}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-envelope me-2" viewBox="0 0 16 16">
                    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                  </svg>
                )}
                {summarySent ? 'Summary Sent to Everyone' : 'Send Summary to Everyone'}
              </button>
            </div>
          </div>
        </div>
        
        <h6 className="mb-3">Individual Balances</h6>
        <div className="table-responsive mb-4">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Member</th>
                <th>Paid</th>
                <th>Share</th>
                <th className="text-end">Balance</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(memberBalance).map((member, index) => {
                // Calculate total paid by this member across all expenses
                const paid = expenses.reduce((sum, expense) => {
                  if (expense.multiPayer && expense.payers) {
                    // Find this member's payment in the payers array
                    const payerEntry = expense.payers.find(p => p.name === member);
                    return sum + (payerEntry ? parseFloat(payerEntry.amount) || 0 : 0);
                  } else {
                    // Legacy single payer
                    return sum + (expense.payer === member || 
                                 (expense.payers && expense.payers[0]?.name === member) ? 
                                 parseFloat(expense.amount) || 0 : 0);
                  }
                }, 0);
                
                const share = totalExpense / group.members.length;
                
                return (
                  <tr key={index}>
                    <td>{member}</td>
                    <td>${paid.toFixed(2)}</td>
                    <td>${share.toFixed(2)}</td>
                    <td className={`text-end fw-bold ${memberBalance[member] >= 0 ? 'text-success' : 'text-danger'}`}>
                      {memberBalance[member] >= 0 ? '+' : '-'}${formatCurrency(memberBalance[member])}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {settlements.length > 0 && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">How to Settle Up</h6>
              <button 
                className={`btn btn-sm ${notificationsSent ? 'btn-success' : 'btn-primary'}`}
                onClick={handleSendSettlementEmails}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-envelope me-2" viewBox="0 0 16 16">
                    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                  </svg>
                )}
                {notificationsSent ? 'Notifications Sent' : 'Send Settlement Notifications'}
              </button>
            </div>
            <ul className="list-group">
              {settlements.map((settlement, index) => (
                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong className="text-danger">{settlement.from}</strong> 
                    <span> pays </span>
                    <strong className="text-success">{settlement.to}</strong>
                  </div>
                  <span className="badge bg-primary rounded-pill">${formatCurrency(settlement.amount)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

// Helper function to calculate settlements
const calculateSettlements = (balances) => {
  const settlements = [];
  const debtors = [];
  const creditors = [];
  
  // Separate debtors and creditors
  Object.keys(balances).forEach(person => {
    if (balances[person] < -0.01) { // Debtor (owes money)
      debtors.push({ name: person, amount: Math.abs(balances[person]) });
    } else if (balances[person] > 0.01) { // Creditor (is owed money)
      creditors.push({ name: person, amount: balances[person] });
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

export default BalanceView;
