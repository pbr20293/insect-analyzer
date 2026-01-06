import { type ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Settings } from 'lucide-react';

interface AppLayoutProps {
    children: ReactNode;
    toggleSidebar: () => void;
    isSidebarOpen: boolean;
}

export const AppLayout = ({ children, toggleSidebar, isSidebarOpen }: AppLayoutProps) => {
    const { user, logout } = useAuth();

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Compact Header */}
                <header className="glass-panel" style={{
                    height: '44px',
                    borderRadius: 0,
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderTop: 'none',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 1rem',
                    zIndex: 10,
                    background: 'rgba(15, 17, 21, 0.95)',
                    backdropFilter: 'blur(8px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--accent-color)' }}>
                            Insect Analyzer
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(59, 130, 246, 0.15)', padding: '2px 6px', borderRadius: '3px' }}>
                            v1.0.0
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                            {user?.username}
                        </span>

                        <button 
                            onClick={toggleSidebar} 
                            className="btn-icon" 
                            style={{ 
                                background: isSidebarOpen ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)', 
                                border: 'none', 
                                color: isSidebarOpen ? 'var(--accent-color)' : 'var(--text-secondary)', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center',
                                padding: '6px',
                                borderRadius: '6px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Settings size={16} />
                        </button>

                        <button 
                            onClick={logout} 
                            style={{ 
                                background: 'rgba(255, 255, 255, 0.05)', 
                                border: 'none', 
                                color: 'var(--text-secondary)', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center',
                                padding: '6px',
                                borderRadius: '6px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                (e.target as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.2)';
                                (e.target as HTMLButtonElement).style.color = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.05)';
                                (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)';
                            }}
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};
