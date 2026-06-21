import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/jsx/Navbar.jsx';
import RegistrationForm from './components/jsx/RegistrationForm';
import LoginForm from './components/jsx/LoginForm';
import ForgotPasswordForm from './components/jsx/ForgotPasswordForm';
import HomePage from './components/jsx/HomePage';
import ChatLayout from './components/jsx/ChatLayout';
import Profile from './components/jsx/Profile.jsx';
import Settings from './components/jsx/Settings';
import GroupChatPage from './components/jsx/GroupChatPage.jsx';
import ChatPage from './components/jsx/ChatPage';
import UserList from './components/jsx/UserList.jsx';
import socket from './components/helper/socket.js';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  function PrivateRoute({ children, user }) {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const isAuthenticated = user || storedUser;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  }

  function PublicRoute({ children, user }) {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const isAuthenticated = user || storedUser;
    return isAuthenticated ? <Navigate to="/chat" replace /> : children;
  }


  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      if (!socket.connected) {
        socket.connect();
      }
    } else {
      if (socket.connected) {
        socket.disconnect();
      }
    }
  }, [user]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <div className={user ? "app-container-authenticated" : "app-container-public"}>
        <Navbar user={user} setUser={setUser} />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/register"
              element={
                <PublicRoute user={user}>
                  <RegistrationForm setUser={setUser} />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute user={user}>
                  <LoginForm setUser={setUser} />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute user={user}>
                  <ForgotPasswordForm />
                </PublicRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRoute user={user}>
                  <ChatLayout />
                </PrivateRoute>
              }
            />
            <Route
              path="/chat/:type/:id"
              element={
                <PrivateRoute user={user}>
                  <ChatLayout />
                </PrivateRoute>
              }
            />
            <Route path="/chat" element={<Navigate to="/users" replace />} />
            <Route
              path="/profile"
              element={
                <PrivateRoute user={user}>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute user={user}>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<div>404 - Page Not Found</div>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;