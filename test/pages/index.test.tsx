import {fireEvent, render, screen} from '@testing-library/react';
import {act} from 'react';
import {useSession, signIn} from 'next-auth/react';
import Home from '@/pages/index';

jest.mock('next-auth/react', () => ({
    useSession: jest.fn(),
    signIn: jest.fn(),
}));

const mockUseSession = useSession as jest.Mock;
const mockSignIn = signIn as jest.Mock;

describe('Home Page', () => {
    describe('when unauthenticated', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: null,
                status: 'unauthenticated',
            });
        });

        it('renders a login form with username input and sign in button', () => {
            render(<Home />);

            expect(screen.getByLabelText('Login form')).toBeInTheDocument();
            expect(screen.getByLabelText('Username input')).toBeInTheDocument();
            expect(screen.getByRole('button', {name: /sign in/i})).toBeInTheDocument();
        });

        it('calls signIn with credentials and username when form is submitted', async () => {
            mockSignIn.mockResolvedValue({ok: true});
            render(<Home />);

            const usernameInput = screen.getByLabelText('Username input');
            const signInButton = screen.getByRole('button', {name: /sign in/i});

            await act(async () => {
                fireEvent.change(usernameInput, {target: {value: 'thevalue'}});
            });

            await act(async () => {
                fireEvent.click(signInButton);
            });

            expect(mockSignIn).toHaveBeenCalledWith('credentials', {
                username: 'thevalue',
                redirect: false,
            });
        });
    });

    describe('when authenticated', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: {user: {name: 'testuser'}},
                status: 'authenticated',
            });
        });

        it('renders a welcome message with the username', () => {
            render(<Home />);

            expect(screen.getByText('Welcome, testuser')).toBeInTheDocument();
        });

        it('does not render the login form', () => {
            render(<Home />);

            expect(screen.queryByLabelText('Login form')).not.toBeInTheDocument();
        });
    });

    describe('when loading', () => {
        beforeEach(() => {
            mockUseSession.mockReturnValue({
                data: null,
                status: 'loading',
            });
        });

        it('does not render the login form', () => {
            render(<Home />);

            expect(screen.queryByLabelText('Login form')).not.toBeInTheDocument();
        });
    });
});
