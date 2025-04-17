import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AddExpenseForm from '../components/AddExpenseForm';
import ExpenseList from '../components/ExpenseList';
import BalanceView from '../components/BalanceView';
import SettlementsList from '../components/SettlementsList';
import { groupService, expenseService } from '../services/api';

const GroupPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Fetch group and expense data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch group data
        const groupData = await groupService.getGroupById(groupId);
        setGroup(groupData);
        
        // Fetch expenses for the group
        const expensesData = await expenseService.getExpenses(groupId);
        setExpenses(expensesData);
      } catch (err) {
        console.error('Error loading group data:', err);
        setError('Failed to load group data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [groupId, refreshCounter]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshCounter(prev => prev + 1);
  };

  // Handle adding a new expense
  const handleAddExpense = async (expenseData) => {
    try {
      // Add groupId to expense data
      const newExpenseData = { ...expenseData, groupId };
      
      // Add expense via API
      await expenseService.addExpense(newExpenseData);
      
      // Refresh data
      handleRefresh();
    } catch (err) {
      console.error('Error adding expense:', err);
      // You could set an error state here to display to the user
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
        <button 
          className="btn btn-danger ms-3" 
          onClick={handleRefresh}
        >
          Try Again
        </button>
        <button
          className="btn btn-secondary ms-2"
          onClick={() => navigate('/')}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="alert alert-warning" role="alert">
        Group not found.
        <button
          className="btn btn-secondary ms-3"
          onClick={() => navigate('/')}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button
          className="btn btn-secondary d-flex align-items-center"
          onClick={() => navigate('/')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-left me-2" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
          </svg>
          Back to Groups
        </button>
        <h1 className="m-0">{group.name}</h1>
      </div>
      
      <div className="row">
        <div className="col-lg-5 mb-4">
          <AddExpenseForm group={group} addExpense={handleAddExpense} />
          <div className="mt-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title mb-3">Group Members</h5>
                {group.members && group.members.length > 0 ? (
                  <ul className="list-group list-group-flush">
                    {group.members.map((member, index) => {
                      const memberName = member.name || member;
                      const initial = memberName.charAt(0).toUpperCase();
                      
                      return (
                        <li key={index} className="list-group-item px-0">
                          <div className="d-flex align-items-center">
                            <div className="avatar rounded-circle bg-primary text-white me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                              {initial}
                            </div>
                            {memberName}
                            {member.email && (
                              <small className="text-muted ms-2">({member.email})</small>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-center text-muted">No members added</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-7">
          <ExpenseList expenses={expenses} onDelete={handleRefresh} />
          <div className="mt-4">
            <BalanceView 
              group={group} 
              expenses={expenses} 
              onRefresh={handleRefresh} 
            />
          </div>
          <div className="mt-4">
            <SettlementsList 
              groupId={groupId} 
              onRefresh={handleRefresh} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupPage;
