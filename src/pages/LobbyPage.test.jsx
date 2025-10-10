// src/pages/LobbyPage.test.jsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import LobbyPage from './LobbyPage';
// NOTE: We no longer import AuthProvider here
import { ThemeProvider } from '../context/ThemeContext';

// Mock the contexts and hooks used by the component
vi.mock('../context/AuthContext', async (importOriginal) => {
    const mod = await importOriginal();
    return {
        ...mod,
        useAuth: () => ({
            user: { displayName: 'Tester' },
            logout: vi.fn(),
        }),
    };
});

vi.mock('../context/ThemeContext', async (importOriginal) => {
    const mod = await importOriginal();
    return {
        ...mod,
        useTheme: () => ({
            theme: 'dark',
            toggleTheme: vi.fn(),
        }),
    };
});

// A helper to render the component within necessary providers
// --- FIX: Removed AuthProvider, as useAuth is already mocked ---
const renderWithProviders = (component) => {
    return render(
        <ThemeProvider>
            {component}
        </ThemeProvider>
    );
};

describe('LobbyPage', () => {
    it('should render the welcome message and user display name', () => {
        renderWithProviders(
            <LobbyPage onCreateRoom={() => {}} onJoinRoom={() => {}} onEditUsername={() => {}} />
        );
        
        // Check for the welcome heading with the mocked display name
        expect(screen.getByRole('heading', { name: /Welcome, Tester!/i })).toBeInTheDocument();
    });

    it('should have the "Join Room" button disabled initially', () => {
        renderWithProviders(
            <LobbyPage onCreateRoom={() => {}} onJoinRoom={() => {}} onEditUsername={() => {}} />
        );
        
        // Find the "Join Room" button and check if it's disabled
        const joinButton = screen.getByRole('button', { name: /Join Room/i });
        expect(joinButton).toBeDisabled();
    });

    it('should enable the "Join Room" button when a room ID is entered', async () => {
        const user = userEvent.setup();
        renderWithProviders(
            <LobbyPage onCreateRoom={() => {}} onJoinRoom={() => {}} onEditUsername={() => {}} />
        );
        
        const joinButton = screen.getByRole('button', { name: /Join Room/i });
        const roomInput = screen.getByPlaceholderText(/Enter Room ID/i);

        // Button is initially disabled
        expect(joinButton).toBeDisabled();

        // Simulate user typing into the input field
        await user.type(roomInput, '123456');

        // Now, the button should be enabled
        expect(joinButton).toBeEnabled();
    });

    it('should call onJoinRoom with the correct room ID when the button is clicked', async () => {
        const user = userEvent.setup();
        const handleJoinRoom = vi.fn(); // Create a mock function

        renderWithProviders(
            <LobbyPage onCreateRoom={() => {}} onJoinRoom={handleJoinRoom} onEditUsername={() => {}} />
        );

        const joinButton = screen.getByRole('button', { name: /Join Room/i });
        const roomInput = screen.getByPlaceholderText(/Enter Room ID/i);

        // Type a room ID
        await user.type(roomInput, '123456');
        
        // Click the button
        await user.click(joinButton);

        // Expect the mock function to have been called with the correct value
        expect(handleJoinRoom).toHaveBeenCalledWith('123456');
    });

    it('should call onCreateRoom when the "Start a New Stream" button is clicked', async () => {
        const user = userEvent.setup();
        const handleCreateRoom = vi.fn(); // Create a mock function

        renderWithProviders(
            <LobbyPage onCreateRoom={handleCreateRoom} onJoinRoom={() => {}} onEditUsername={() => {}} />
        );
        
        const createButton = screen.getByRole('button', { name: /Start a New Stream/i });
        
        // Click the create button
        await user.click(createButton);
        
        // Expect the mock function to have been called
        expect(handleCreateRoom).toHaveBeenCalled();
    });
});