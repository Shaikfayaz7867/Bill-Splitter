import React, { useState } from 'react';

const CreateGroupForm = ({ createGroup }) => {
  const [groupName, setGroupName] = useState('');
  const [membersList, setMembersList] = useState([{ name: '', email: '' }]);
  const [formError, setFormError] = useState(null);

  const addMemberField = () => {
    setMembersList([...membersList, { name: '', email: '' }]);
  };

  const removeMember = (indexToRemove) => {
    if (membersList.length === 1) {
      // Don't remove the last member field
      return;
    }
    setMembersList(membersList.filter((_, index) => index !== indexToRemove));
  };

  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...membersList];
    updatedMembers[index][field] = value;
    setMembersList(updatedMembers);
  };

  const validateForm = () => {
    setFormError(null);
    
    if (!groupName.trim()) {
      setFormError('Group name is required');
      return false;
    }
    
    for (let i = 0; i < membersList.length; i++) {
      const member = membersList[i];
      
      if (!member.name.trim()) {
        setFormError(`Member ${i+1} name is required`);
        return false;
      }
      
      if (!member.email.trim()) {
        setFormError(`Member ${i+1} email is required`);
        return false;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(member.email)) {
        setFormError(`Member ${i+1} has an invalid email format`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Remove any empty members
    const validMembers = membersList.filter(
      member => member.name.trim() !== '' && member.email.trim() !== ''
    );
    
    // Generate a unique ID for the group
    const newGroup = {
      name: groupName,
      members: validMembers
    };
    
    createGroup(newGroup);
    
    // Reset form
    setGroupName('');
    setMembersList([{ name: '', email: '' }]);
    setFormError(null);
  };

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title mb-4">Create a New Group</h5>
        
        {formError && (
          <div className="alert alert-danger" role="alert">
            {formError}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Group Name</label>
            <input
              type="text"
              className="form-control"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Trip to Paris"
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Members</label>
            
            {membersList.map((member, index) => (
              <div key={index} className="card mb-2">
                <div className="card-body p-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h6 className="mb-0">Member {index + 1}</h6>
                    {membersList.length > 1 && (
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => removeMember(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="row g-2">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Name"
                        value={member.name}
                        onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Email"
                        value={member.email}
                        onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <button 
              type="button" 
              className="btn btn-sm btn-outline-primary d-block w-100 mt-3" 
              onClick={addMemberField}
            >
              + Add Member
            </button>
          </div>
          
          <button type="submit" className="btn btn-primary w-100 mt-4">
            Create Group
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupForm;
