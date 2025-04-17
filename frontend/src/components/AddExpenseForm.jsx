import React, { useState, useEffect } from 'react';

const AddExpenseForm = ({ group, addExpense }) => {
  const [expenseName, setExpenseName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substr(0, 10));
  const [splitEqually, setSplitEqually] = useState(true);
  const [multiPayer, setMultiPayer] = useState(false);
  const [payers, setPayers] = useState([]);
  const [remainingAmount, setRemainingAmount] = useState(0);

  // Get member names for display and processing
  const getGroupMemberNames = () => {
    if (!group || !group.members) return [];
    return group.members.map(member => member.name || member);
  };

  // Initialize payers when group changes or multiPayer mode is toggled
  useEffect(() => {
    const memberNames = getGroupMemberNames();
    if (memberNames.length > 0) {
      if (multiPayer) {
        // Initialize all members with 0 amount
        const initialPayers = memberNames.map(name => ({
          name,
          amount: ''
        }));
        setPayers(initialPayers);
      } else {
        // Reset to single payer mode
        setPayers([]);
      }
    }
  }, [group, multiPayer]);

  // Calculate remaining amount when total or payers change
  useEffect(() => {
    if (multiPayer && totalAmount) {
      const total = parseFloat(totalAmount) || 0;
      const paidAmount = payers.reduce((sum, payer) => {
        return sum + (parseFloat(payer.amount) || 0);
      }, 0);
      setRemainingAmount(Math.max(0, total - paidAmount).toFixed(2));
    }
  }, [payers, totalAmount, multiPayer]);

  const handlePayerAmountChange = (index, amount) => {
    const newPayers = [...payers];
    newPayers[index].amount = amount;
    setPayers(newPayers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!expenseName.trim() || !totalAmount) {
      alert('Please fill required fields (description and amount)');
      return;
    }
    
    const parsedTotalAmount = parseFloat(totalAmount);
    
    if (multiPayer) {
      // Validate total matches sum of individual payments
      const totalPaid = payers.reduce((sum, payer) => sum + (parseFloat(payer.amount) || 0), 0);
      
      if (Math.abs(totalPaid - parsedTotalAmount) > 0.01) {
        alert(`The sum of individual payments (${totalPaid.toFixed(2)}) doesn't match the total expense (${parsedTotalAmount.toFixed(2)})`);
        return;
      }
      
      // Check if any amount is entered
      const hasPayments = payers.some(payer => parseFloat(payer.amount || 0) > 0);
      if (!hasPayments) {
        alert('Please enter at least one payment amount');
        return;
      }
    } else if (!payers[0] || !payers[0].name) {
      alert('Please select a payer');
      return;
    }
    
    // Create a new expense with unique ID
    const newExpense = {
      expenseName,
      amount: parsedTotalAmount,
      date,
      splitEqually,
      multiPayer,
      payers: multiPayer 
        ? payers.filter(p => parseFloat(p.amount || 0) > 0)
        : [{ name: payers[0].name, amount: parsedTotalAmount }]
    };
    
    addExpense(newExpense);
    
    // Reset form
    setExpenseName('');
    setTotalAmount('');
    setDate(new Date().toISOString().substr(0, 10));
    if (multiPayer) {
      // Reset all payer amounts to empty
      setPayers(payers.map(payer => ({ ...payer, amount: '' })));
    } else {
      setPayers([{ name: '', amount: '' }]);
    }
  };

  const distributeEvenly = () => {
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      alert('Please enter a valid total amount first');
      return;
    }
    
    const total = parseFloat(totalAmount);
    const memberNames = getGroupMemberNames();
    const activeMembers = memberNames.length;
    
    if (activeMembers === 0) return;
    
    const evenAmount = (total / activeMembers).toFixed(2);
    const newPayers = memberNames.map(name => ({
      name,
      amount: evenAmount
    }));
    
    setPayers(newPayers);
  };

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h5 className="card-title mb-4 d-flex align-items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-plus-circle me-2" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Add New Expense
        </h5>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-control"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
                placeholder="e.g. Dinner, Tickets, Hotel"
                required
              />
            </div>
            
            <div className="col-md-6">
              <label className="form-label">Total Amount</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="number"
                  className="form-control"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            
            <div className="col-md-6">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            
            <div className="col-md-6">
              <div className="form-check form-switch mb-2">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="splitEquallySwitch" 
                  checked={splitEqually}
                  onChange={(e) => setSplitEqually(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="splitEquallySwitch">
                  Split equally among all members
                </label>
              </div>
              
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="multiPayerSwitch" 
                  checked={multiPayer}
                  onChange={(e) => setMultiPayer(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="multiPayerSwitch">
                  Multiple people paid
                </label>
              </div>
            </div>
          </div>
          
          {multiPayer ? (
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Who paid what?</h6>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={distributeEvenly}
                >
                  Distribute Evenly
                </button>
              </div>
              
              {payers.map((payer, index) => (
                <div key={index} className="input-group mb-2">
                  <span className="input-group-text" style={{ minWidth: '150px' }}>
                    {payer.name}
                  </span>
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    className="form-control"
                    value={payer.amount}
                    onChange={(e) => handlePayerAmountChange(index, e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              ))}
              
              <div className="d-flex justify-content-between text-muted mt-3">
                <div>Remaining:</div>
                <div>${remainingAmount}</div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <label className="form-label">Who paid?</label>
              <select
                className="form-select"
                value={payers[0]?.name || ''}
                onChange={(e) => setPayers([{ name: e.target.value, amount: totalAmount }])}
                required
              >
                <option value="">Select payer</option>
                {getGroupMemberNames().map((name, index) => (
                  <option key={index} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <button type="submit" className="btn btn-primary w-100 mt-4">
            Add Expense
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseForm;
