import React, { useState } from 'react';

const UsernameModal = ({ onSubmit, isNewUser }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl shadow-2xl p-8 transition-colors duration-300 border border-gray-200 dark:border-gray-800 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
          {isNewUser ? 'Welcome!' : 'Update Username'}
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          {isNewUser ? 'Please set a username to continue.' : 'Enter your new username below.'}
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-black text-gray-900 dark:text-white rounded-lg border-2 border-gray-300 dark:border-gray-700 focus:border-gray-900 dark:focus:border-white focus:outline-none transition-colors duration-300 text-center"
            placeholder="Enter your username"
            required
            autoFocus
          />
          <button
            type="submit"
            className="w-full mt-4 bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-300 shadow-lg"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsernameModal;