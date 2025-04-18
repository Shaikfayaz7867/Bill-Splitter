import React, { useState, useEffect } from 'react';
import { expenseService } from '../services/api';

const SettlementsList = ({ groupId, onRefresh }) => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  useEffect(() => {
    fetchSettlements();
  }, [groupId]);
  
  const fetchSettlements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await expenseService.getSettlements(groupId);
      setSettlements(data);
    } catch (err) {
      console.error('Error fetching settlements:', err);
      setError('Failed to load settlement data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkComplete = async (settlementId) => {
    try {
      setCompletingId(settlementId);
      setError(null);
      
      // Call the API to mark settlement as complete
      const response = await expenseService.completeSettlement(settlementId);
      
      // Show success notification with email details
      const emailsSent = response.emailsSent || 0;
      const totalEmails = response.totalEmails || 0;
      
      // Set a success notification
      setNotification({
        type: 'success',
        message: `Settlement marked as complete! ${emailsSent} of ${totalEmails} email notifications sent.`
      });
      
      // Update the local state
      setSettlements(settlements.map(settlement => 
        settlement._id === settlementId 
          ? { ...settlement, status: 'completed', completedAt: new Date() } 
          : settlement
      ));
      
      // Refresh parent component if needed
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error completing settlement:', err);
      setError('Failed to mark settlement as complete. Please try again.');
    } finally {
      setCompletingId(null);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center p-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading settlements...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            {error}
            <button 
              className="btn btn-sm btn-outline-danger ms-2" 
              onClick={fetchSettlements}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!settlements || settlements.length === 0) {
    return (
      <div className="card">
        <div className="card-body">
          <h5 className="card-title mb-4">Settlements</h5>
          <div className="text-center py-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className="bi bi-cash-stack text-muted mb-3" viewBox="0 0 16 16">
              <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1H1zm7 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
              <path d="M0 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V5zm3 0a2 2 0 0 1-2 2v4a2 2 0 0 1 2 2h10a2 2 0 0 1 2-2V7a2 2 0 0 1-2-2H3z"/>
            </svg>
            <p className="text-muted">No settlements available</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Group settlements by status
  const pendingSettlements = settlements.filter(s => s.status === 'pending');
  const completedSettlements = settlements.filter(s => s.status === 'completed');
  
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title mb-4">Settlements</h5>
        
        {/* Notification alert */}
        {notification && (
          <div className={`alert alert-${notification.type} alert-dismissible fade show mb-3`} role="alert">
            {notification.message}
            <button type="button" className="btn-close" aria-label="Close" onClick={() => setNotification(null)}></button>
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
            <button 
              className="btn btn-sm btn-outline-danger ms-2" 
              onClick={fetchSettlements}
            >
              Try Again
            </button>
          </div>
        )}
        
        {pendingSettlements.length > 0 && (
          <>
            <h6 className="mb-3">Pending Settlements</h6>
            <div className="table-responsive mb-4">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSettlements.map(settlement => (
                    <tr key={settlement._id}>
                      <td className="text-danger">{settlement.from}</td>
                      <td className="text-success">{settlement.to}</td>
                      <td>${parseFloat(settlement.amount).toFixed(2)}</td>
                      <td>
                        <span className="badge bg-warning">Pending</span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-success" 
                          onClick={() => handleMarkComplete(settlement._id)}
                          disabled={completingId === settlement._id}
                        >
                          {completingId === settlement._id ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : (
                            'Mark Complete'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {completedSettlements.length > 0 && (
          <>
            <h6 className="mb-3">Completed Settlements</h6>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {completedSettlements.map(settlement => (
                    <tr key={settlement._id}>
                      <td>{settlement.from}</td>
                      <td>{settlement.to}</td>
                      <td>${parseFloat(settlement.amount).toFixed(2)}</td>
                      <td>
                        <span className="badge bg-success">Completed</span>
                      </td>
                      <td>{formatDate(settlement.completedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SettlementsList; 