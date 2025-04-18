import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { groupService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmToast, setConfirmToast] = useState({ 
    show: false, 
    message: '', 
    group: null,
    confirmHandler: null
  });

  // Fetch groups from API
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await groupService.getGroups();
        setGroups(data);
      } catch (err) {
        setError('Failed to load groups. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroups();
  }, [refreshCounter]);
  
  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ ...toast, show: false });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Navigate to group detail page
  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      trip: 'bi-airplane',
      home: 'bi-house',
      other: 'bi-three-dots'
    };
    return icons[category] || icons.other;
  };

  // Format currency
  const formatCurrency = (currencyCode) => {
    // Default to INR (Rupees) if USD or not specified
    if (currencyCode === 'USD' || !currencyCode) {
      return 'INR';
    }
    return currencyCode;
  };

  // Confirmation toast for delete
  const showConfirmToast = (message, group) => {
    setConfirmToast({
      show: true,
      message,
      group,
      confirmHandler: handleConfirmDelete
    });
  };

  // Handle delete button click
  const handleDeleteClick = (e, group) => {
    e.stopPropagation();
    showConfirmToast(`Are you sure you want to delete "${group.name}"?`, group);
  };

  // Handle confirmed delete
  const handleConfirmDelete = async (group) => {
    try {
      setDeleting(true);
      setGroupToDelete(group);
      
      const result = await groupService.deleteGroup(group._id);
      
      // Refresh the group list
      setGroupToDelete(null);
      setRefreshCounter(prev => prev + 1);
      
      // Show success message
      const deletedExpenses = result.deletedData?.expenses?.count || 0;
      showToast(
        `Group "${group.name}" deleted successfully along with ${deletedExpenses} expenses.`,
        'success'
      );
    } catch (err) {
      showToast(`Failed to delete group: ${err.message}`, 'danger');
    } finally {
      setDeleting(false);
      // Close the confirm toast
      setConfirmToast(prev => ({ ...prev, show: false }));
    }
  };

  // Cancel deletion
  const handleCancelDelete = () => {
    setConfirmToast(prev => ({ ...prev, show: false }));
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  return (
    <div className="page-container fade-in">
      {/* Regular Toast Notification */}
      {toast.show && (
        <div 
          className={`toast show position-fixed top-0 end-0 m-4 text-white bg-${toast.type}`}
          role="alert" 
          aria-live="assertive" 
          aria-atomic="true"
          style={{ zIndex: 1050 }}
        >
          <div className={`toast-header bg-${toast.type} text-white`}>
            <strong className="me-auto">
              {toast.type === 'success' ? 'Success' : 'Error'}
            </strong>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={() => setToast({ ...toast, show: false })}
            ></button>
          </div>
          <div className="toast-body">
            {toast.message}
          </div>
        </div>
      )}

      {/* Confirmation Alert at Top */}
      {confirmToast.show && (
        <div 
          className="alert alert-warning m-0 rounded-0"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            padding: '15px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}
        >
          <div className="container d-flex align-items-center justify-content-between">
            <div>
              <div className="d-flex align-items-center">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-4"></i>
                <div>
                  <strong>Delete Confirmation</strong>
                  <p className="mb-0">{confirmToast.message}</p>
                </div>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button 
                type="button" 
                className="btn btn-sm btn-light" 
                onClick={handleCancelDelete}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-danger" 
                onClick={() => confirmToast.confirmHandler(confirmToast.group)}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">My Groups</h1>
          <p className="text-muted">Manage your expense groups and settlements</p>
        </div>
        
        <Link to="/create-group" className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>
          New Group
        </Link>
      </div>
      
      {error && (
        <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div className="flex-grow-1">{error}</div>
          <button 
            className="btn btn-sm btn-outline-danger ms-3" 
            onClick={() => setRefreshCounter(prev => prev + 1)}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Retry
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading your groups...</p>
        </div>
      ) : groups.length > 0 ? (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {groups.map(group => (
            <div key={group._id} className="col">
              <div 
                className="card h-100 group-card shadow-sm hover-card"
                style={{ cursor: 'pointer' }}
              >
                <div 
                  className="card-body"
                  onClick={() => handleGroupClick(group._id)}
                >
                  <div className="d-flex justify-content-between mb-2">
                    <h5 className="card-title mb-0 text-truncate">{group.name}</h5>
                    <span className="badge bg-light text-dark">
                      <i className={`bi ${getCategoryIcon(group.category || 'other')} me-1`}></i>
                      {group.category === 'other' ? 'General' : (group.category || 'Other').charAt(0).toUpperCase() + (group.category || 'other').slice(1)}
                    </span>
                  </div>
                  
                  <p className="card-text text-muted small mb-3">
                    {group.description || 'No description provided'}
                  </p>
                  
                  <div className="d-flex align-items-center mb-3">
                    <i className="bi bi-people-fill text-primary me-2"></i>
                    <span>{group.members?.length || 0} members</span>
                  </div>
                  
                  <div className="d-flex align-items-center">
                    <i className="bi bi-currency-exchange text-success me-2"></i>
                    <span className="currency-badge">{formatCurrency(group.currency)}</span>
                  </div>
                </div>
                <div className="card-footer bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      Created: {new Date(group.createdAt || Date.now()).toLocaleDateString()}
                    </small>
                    <div>
                      <button 
                        className="btn btn-sm btn-outline-danger me-2" 
                        onClick={(e) => handleDeleteClick(e, group)}
                        title="Delete Group"
                        disabled={deleting && groupToDelete?._id === group._id}
                      >
                        {deleting && groupToDelete?._id === group._id ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <i className="bi bi-trash"></i>
                        )}
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-primary" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGroupClick(group._id);
                        }}
                        title="View Group"
                      >
                        <i className="bi bi-arrow-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card border-dashed p-5 text-center">
          <div className="empty-state">
            <div className="empty-state-icon mb-4">
              <i className="bi bi-people-fill fs-1 text-muted"></i>
            </div>
            <h3>No Groups Yet</h3>
            <p className="text-muted mb-4">You haven't created or joined any groups yet. Create your first group to get started!</p>
            <Link to="/create-group" className="btn btn-primary">
              <i className="bi bi-plus-lg me-2"></i>
              Create Your First Group
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
