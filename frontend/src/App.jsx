// Force reload
import { useState } from 'react';
import useAuth from './hooks/useAuth';
import Login from './pages/user/login';
import Signup from './pages/user/signup';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DefualtProtectedRouter from './protectRouter/DefualtProtectedRouter';
import ProtectedRoute from './protectRouter/ProtectedRoute';
import UserLayout from './layout/userlayout/UserLayout';
import { AuthProvider } from './Context/Authcontext';
import Quiz from './pages/user/Quiz';
import SuperAdminDashboard from './pages/admin/SuperAdminDashboard';


function App() {
  

        return (
<AuthProvider>
    <BrowserRouter>


      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<DefualtProtectedRouter />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        
        {/* Protected User Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<UserLayout />}>
            <Route path="/user/quiz" element={<Quiz />} />
            <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
          </Route>
        </Route>
      </Routes>





      </BrowserRouter>
    </AuthProvider>
        );
}

        export default App;


