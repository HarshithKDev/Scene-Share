// src/components/Toast.jsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const Toast = ({ message, type, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [onRemove]);

    const baseClasses = 'p-4 rounded-md shadow-lg text-white mb-2 max-w-sm w-full mx-auto animate-fade-in-down';
    const typeClasses = {
        info: 'bg-blue-500',
        success: 'bg-green-500',
        error: 'bg-red-500',
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`}>
            {message}
        </div>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    return createPortal(
        <div className="fixed top-5 right-5 z-[100] space-y-2">
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onRemove={() => removeToast(toast.id)}
                />
            ))}
        </div>,
        document.body
    );
};

export default ToastContainer;