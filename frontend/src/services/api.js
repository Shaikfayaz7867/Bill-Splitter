import axios from 'axios';

// API URL based on environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Add withCredentials to handle CORS
  withCredentials: false
});

// Add request interceptor for debugging
api.interceptors.request.use(
  config => {
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    return Promise.reject(error);
  }
);

// Group API services
export const groupService = {
  // Get all groups
  getGroups: async () => {
    try {
      const response = await api.get('/groups');
      return response.data || []; // Return the data or empty array
    } catch (error) {
      // Return empty array instead of throwing error for better UI handling
      return [];
    }
  },

  // Get group by ID
  getGroupById: async (id) => {
    try {
      const response = await api.get(`/groups/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create new group
  createGroup: async (groupData) => {
    try {
      // Ensure we have required fields
      if (!groupData.name || !groupData.members || !Array.isArray(groupData.members)) {
        throw new Error('Invalid group data - must have name and members array');
      }
      
      // Format members if needed
      const formattedData = {
        ...groupData,
        members: groupData.members.map(member => ({
          name: member.name || 'Unknown',
          email: member.email || '',
          userId: member.userId || '000000000000000000000000'
        }))
      };
      
      // Make the request to the API
      const response = await api.post('/groups', formattedData);
      
      return response.data;
    } catch (error) {
      // Rethrow with a more helpful message
      if (error.response && error.response.data) {
        throw new Error(error.response.data.msg || 'Failed to create group');
      }
      throw error;
    }
  },

  // Update group
  updateGroup: async (id, groupData) => {
    try {
      const response = await api.put(`/groups/${id}`, groupData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete group
  deleteGroup: async (id) => {
    try {
      if (!id) {
        throw new Error('Group ID is required for deletion');
      }
      
      // Make the API call
      const response = await api.delete(`/groups/${id}`);
      return response.data;
    } catch (error) {
      // If error is a network error (no response), it might be a CORS issue
      if (error.message === 'Network Error') {
        throw new Error('Network error - possible CORS issue. Please check server connectivity.');
      }
      
      // Format error message for user display
      const errorMsg = error.response?.data?.msg || 
                       error.response?.statusText || 
                       error.message || 
                       'Unknown error deleting group';
      
      // Rethrow with better message
      const enhancedError = new Error(errorMsg);
      enhancedError.status = error.response?.status;
      enhancedError.data = error.response?.data;
      throw enhancedError;
    }
  },

  // Get group balance
  getGroupBalance: async (id) => {
    try {
      const response = await api.get(`/groups/${id}/balance`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Send balance summary emails to all members
  sendBalanceSummary: async (id) => {
    try {
      const response = await api.post(`/groups/${id}/send-summary`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Expense API services
export const expenseService = {
  // Get all expenses
  getExpenses: async (groupId) => {
    try {
      const response = await api.get(`/expenses/${groupId}`);
      return response.data || [];
    } catch (error) {
      return [];
    }
  },

  // Get expense by ID
  getExpenseById: async (expenseId) => {
    try {
      const response = await api.get(`/expenses/detail/${expenseId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // Add new expense
  addExpense: async (expenseData) => {
    try {
      // Format data to match the backend schema
      const formattedData = {
        ...expenseData,
        title: expenseData.expenseName || expenseData.title || 'Untitled Expense',
        amount: parseFloat(expenseData.amount) || 0,
        // Format payers to ensure they have required fields
        payers: expenseData.payers?.map(payer => ({
          userId: payer.userId || '000000000000000000000000',
          name: payer.name || 'Unknown',
          amount: parseFloat(payer.amount) || 0
        })) || [],
        // Default createdBy if not provided
        createdBy: expenseData.createdBy || '000000000000000000000000'
      };
      
      const response = await api.post('/expenses', formattedData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update expense
  updateExpense: async (expenseId, expenseData) => {
    try {
      // Format data to match the backend schema
      const formattedData = {
        ...expenseData,
        amount: parseFloat(expenseData.amount) || 0,
        // Format payers to ensure they have required fields
        payers: expenseData.payers?.map(payer => ({
          userId: payer.userId || '000000000000000000000000',
          name: payer.name || 'Unknown',
          amount: parseFloat(payer.amount) || 0
        })) || []
      };
      
      const response = await api.put(`/expenses/${expenseId}`, formattedData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete expense
  deleteExpense: async (expenseId) => {
    try {
      const response = await api.delete(`/expenses/${expenseId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get settlements
  getSettlements: async (groupId) => {
    try {
      const response = await api.get(`/expenses/settlements/${groupId}`);
      return response.data || [];
    } catch (error) {
      return [];
    }
  },

  // Complete settlement
  completeSettlement: async (settlementId) => {
    try {
      const response = await api.put(`/expenses/settlements/${settlementId}/complete`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Send settlement notifications
  sendSettlementNotifications: async (groupId) => {
    try {
      const response = await api.post(`/expenses/send-settlements/${groupId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default {
  groupService,
  expenseService
};