import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User } from 'lucide-react';

export const LoginScreen = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const availableUsers = [
        { username: 'admin', description: 'Administrator' },
        { username: 'demo', description: 'Demo User' },
        { username: 'user', description: 'Standard User' },
        { username: 'user1', description: 'User 1' },
        { username: 'user2', description: 'User 2' }
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (login(username, password)) {
            setError('');
        } else {
            setError('Invalid credentials');
        }
    };

    const handleUserSelect = (selectedUser: string) => {
        setUsername(selectedUser);
        setError('');
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'radial-gradient(circle at center, #1e222a 0%, #0f1115 100%)'
        }}>
            <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-primary)' }}>
                    Insect Analyzer
                </h2>

                {/* Quick User Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.8rem', textAlign: 'center' }}>
                        Quick Login
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {availableUsers.map((user) => (
                            <button
                                key={user.username}
                                type="button"
                                onClick={() => handleUserSelect(user.username)}
                                style={{
                                    padding: '0.6rem',
                                    background: username === user.username ? 'var(--accent-color)' : 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    color: username === user.username ? 'white' : 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ fontWeight: 500 }}>{user.username}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{user.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            className="input-field"
                            style={{ paddingLeft: '2.5rem' }}
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="password"
                            className="input-field"
                            style={{ paddingLeft: '2.5rem' }}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {error && <div style={{ color: 'var(--error)', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}

                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};
