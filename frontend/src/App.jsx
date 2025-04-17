import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import GroupPage from './pages/GroupPage';
import Login from './pages/Login';
import CreateGroup from './pages/CreateGroup';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { GOOGLE_CLIENT_ID } from './config/googleAuth';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

const App = () => {
  return (
    <Router>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <div className="app-container d-flex flex-column min-vh-100">
            <Navbar />
            <div className="container flex-grow-1 mt-4 mb-5">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />
                <Route path="/create-group" element={
                  <ProtectedRoute>
                    <CreateGroup />
                  </ProtectedRoute>
                } />
                <Route path="/group/:groupId" element={
                  <ProtectedRoute>
                    <GroupPage />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
            <footer className="bg-light py-3 mt-auto">
              <div className="container text-center">
                <p className="text-muted mb-0">
                  &copy; {new Date().getFullYear()} Bill Splitter | Split your expenses easily
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </GoogleOAuthProvider>
    </Router>
  );
};

export default App;
