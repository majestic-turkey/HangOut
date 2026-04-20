import { useState } from 'react';
import type { SubmitEvent } from 'react';
import type { AuthAction } from '../types';

export default function AuthModal({ authAction, onSuccess }: { authAction: AuthAction, onSuccess: (userId: number | null) => void }) {
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const credentialFields = (<>
        <label htmlFor="user-name">Username:</label>
        <input type="text" id="user-name" name="user-name" />
        <label htmlFor="password">Password:</label>
        <input type="password" id="password" name="password" />
    </>)

    // POST /auth on form submit with username, password, and authAction (login or register)
    const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            username: formData.get('user-name'),
            password: formData.get('password'),
            authAction
        };
        const res = await fetch('/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.ok) {
            onSuccess(json.userId);
        } else {
            setStatusMessage(json.message || 'Authentication failed');
        }
    };

    return (<>
        <form className="auth-modal" onSubmit={handleSubmit}>
            {(authAction === 'login' || authAction === 'register') && credentialFields}
            {statusMessage && <p className="title-status">{statusMessage}</p>}
            <button type="submit" className={'auth-button'}>{authAction === 'login' ? 'Login' : 'Register'}</button>
        </form>
        <button className="guest-button" onClick={() => onSuccess(null)}>Continue as Guest</button>
    </>)
}