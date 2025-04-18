import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { groupService } from '../services/api';

const CreateGroup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [currency, setCurrency] = useState('INR');
  const [members, setMembers] = useState([
    { id: 1, name: user?.name || '', email: user?.email || '', isCreator: true }
  ]);
  const [newMember, setNewMember] = useState({ name: '', email: '' });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name) {
      setError('Group name is required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare group data
      const groupData = {
        name,
        description,
        category,
        currency,
        members: members.map(member => ({
          name: member.name,
          email: member.email,
          isCreator: member.isCreator || false
        })),
        createdBy: user?.id || 'unknown'
      };
      
      // Call API to create group
      const newGroup = await groupService.createGroup(groupData);
      
      // Navigate to the new group
      navigate(`/group/${newGroup._id}`);
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add new member
  const addMember = () => {
    if (newMember.name && newMember.email) {
      setMembers([
        ...members, 
        { id: Date.now(), name: newMember.name, email: newMember.email, isCreator: false }
      ]);
      setNewMember({ name: '', email: '' });
    }
  };

  // Remove member
  const removeMember = (id) => {
    setMembers(members.filter(member => member.id !== id));
  };

  // Available categories
  const categories = [
    { value: 'trip', label: 'Trip/Travel' },
    { value: 'home', label: 'Home/Apartment' },
    { value: 'other', label: 'Other' }
  ];

  // Popular currencies
  const currencies = [
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CNY', name: 'Chinese Yuan' }
  ];

  return (
    <div className="create-group-container">
      <h1 className="h3 mb-4">Create New Group</h1>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}
      
      <div className="card shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="groupName" className="form-label">Group Name*</label>
              <input
                type="text"
                className="form-control"
                id="groupName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Trip to Paris"
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="groupDescription" className="form-label">Description</label>
              <textarea
                className="form-control"
                id="groupDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Expenses for our summer vacation"
                rows="3"
              ></textarea>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <label htmlFor="groupCategory" className="form-label">Category</label>
                <select
                  className="form-select"
                  id="groupCategory"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-6">
                <label htmlFor="groupCurrency" className="form-label">Currency</label>
                <select
                  className="form-select"
                  id="groupCurrency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {currencies.map(cur => (
                    <option key={cur.code} value={cur.code}>{cur.code} - {cur.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <hr className="my-4" />
            
            <h5 className="mb-3">Group Members</h5>
            
            <div className="mb-4">
              {members.map(member => (
                <div key={member.id} className="d-flex align-items-center mb-2 p-2 border rounded">
                  <div className="flex-grow-1">
                    <div>{member.name}</div>
                    <div className="text-muted small">{member.email}</div>
                  </div>
                  {member.isCreator ? (
                    <span className="badge bg-primary">You (Creator)</span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeMember(member.id)}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="card bg-light mb-4">
              <div className="card-body">
                <h6 className="card-title mb-3">Add Member</h6>
                
                <div className="row g-2">
                  <div className="col-md-5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Name"
                      value={newMember.name}
                      onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="col-md-5">
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      placeholder="Email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                    />
                  </div>
                  
                  <div className="col-md-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary w-100"
                      onClick={addMember}
                      disabled={!newMember.name || !newMember.email}
                    >
                      <i className="bi bi-plus-lg"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/')}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Cancel
              </button>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2"></i>
                    Create Group
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup; 