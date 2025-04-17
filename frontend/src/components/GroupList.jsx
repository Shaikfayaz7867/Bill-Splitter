import React from 'react';
import { useNavigate } from 'react-router-dom';

const GroupList = ({ groups, onGroupClick }) => {
  const navigate = useNavigate();

  const handleGroupClick = (group) => {
    if (onGroupClick) {
      onGroupClick(group._id || group.id);
    }
    navigate(`/group/${group._id || group.id}`);
  };

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-5">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="bi bi-people text-muted mb-3" viewBox="0 0 16 16">
          <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8Zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022ZM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816ZM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"/>
        </svg>
        <p className="lead text-muted">No groups created yet</p>
        <p className="text-muted">Create a group to get started with bill splitting</p>
      </div>
    );
  }

  const getMemberNames = (members) => {
    if (!members || members.length === 0) return 'No members';
    
    return members.map(member => member.name || member).join(', ');
  };

  return (
    <div className="list-group">
      {groups.map((group, index) => (
        <button
          key={group._id || index}
          onClick={() => handleGroupClick(group)}
          className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3 mb-2"
        >
          <div className="d-flex align-items-center">
            <div className="avatar rounded-circle bg-primary text-white me-3 d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
              {group.name.charAt(0).toUpperCase()}
            </div>
            <div className="d-flex flex-column align-items-start">
              <h5 className="mb-0">{group.name}</h5>
              <small className="text-muted">
                {group.members ? `${group.members.length} members` : 'No members'}
              </small>
              {group.members && group.members.length > 0 && (
                <small className="text-muted text-truncate" style={{ maxWidth: '200px' }}>
                  {getMemberNames(group.members)}
                </small>
              )}
            </div>
          </div>
          <div className="d-flex align-items-center">
            {group.expenses && group.expenses.length > 0 ? (
              <span className="badge bg-primary rounded-pill">
                {group.expenses.length} expense{group.expenses.length !== 1 ? 's' : ''}
              </span>
            ) : null}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-chevron-right ms-2 text-muted" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
};

export default GroupList;
