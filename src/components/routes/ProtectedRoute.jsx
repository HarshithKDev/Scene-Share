// src/components/routes/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();

    if (!user) {
        // User not authenticated, redirect to login page
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute;