// src/pages/LoginPage.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '../context/ThemeContext';
import LoginPage from './LoginPage';

// Mock Firebase module to avoid actual authentication calls
vi.mock('../firebase', () => ({
    auth: {},
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signInWithPopup: vi.fn(),
    googleProvider: {},
}));

// A helper function to render the component with necessary providers
const renderWithProviders = (component) => {
    return render(
        <ThemeProvider>
            {component}
        </ThemeProvider>
    );
};

describe('LoginPage', () => {
    it('should render the main heading', () => {
        renderWithProviders(<LoginPage />);
        // Check if the title "Scene-Share" is on the page
        expect(screen.getByRole('heading', { name: /scene-share/i })).toBeInTheDocument();
    });

    it('should default to the Login view', () => {
        renderWithProviders(<LoginPage />);
        
        // --- FIX: On initial render, expect TWO "Login" buttons (the tab and the submit button) ---
        const loginButtons = screen.getAllByRole('button', { name: /^Login$/i });
        expect(loginButtons).toHaveLength(2);

        // The placeholder for email should be visible
        expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    });

    it('should switch to the Sign Up view when the tab is clicked', async () => {
        const user = userEvent.setup();
        renderWithProviders(<LoginPage />);

        // At the start, there's only one button with the exact name "Sign Up" (the tab).
        const signUpTab = screen.getByRole('button', { name: /^Sign Up$/i });
        
        // Click the "Sign Up" tab
        await user.click(signUpTab);

        // After clicking, there should be TWO buttons with the name "Sign Up"
        // (the tab itself and the form's submit button).
        const signUpButtons = screen.getAllByRole('button', { name: /Sign Up/i });
        expect(signUpButtons).toHaveLength(2);
    });
});