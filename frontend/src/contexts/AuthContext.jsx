import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';

// Create Authentication Context
const AuthContext = createContext();

// Custom hook for easy context access
export const useAuth = () => useContext(AuthContext);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // On mount, check localStorage for existing auth token
  useEffect(() => {
    const checkLoggedIn = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Check if token is expired
          const decodedToken = jwtDecode(parsedUser.credential);
          const isExpired = decodedToken.exp * 1000 < Date.now();
          
          if (isExpired) {
            // Token expired, log user out
            handleLogout();
          } else {
            setUser(parsedUser);
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    
    checkLoggedIn();
  }, [navigate]);

  // Handle successful Google login
  const handleLogin = (response) => {
    const decodedUser = jwtDecode(response.credential);
    
    // Create user object with Google profile data
    const userObj = {
      credential: response.credential,
      id: decodedUser.sub,
      name: decodedUser.name,
      email: decodedUser.email,
      picture: decodedUser.picture,
      firstName: decodedUser.given_name,
      lastName: decodedUser.family_name
    };
    
    // Store in state and localStorage
    setUser(userObj);
    localStorage.setItem('user', JSON.stringify(userObj));
    
    // Redirect to home page
    navigate('/');
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Context value
  const value = {
    user,
    loading,
    handleLogin,
    handleLogout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 