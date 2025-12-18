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
                {/* Header */}
                <header className="glass-panel" style={{
                    height: '60px',
                    borderRadius: 0,
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderTop: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 1.5rem',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--accent-color)' }}>
                            Insect Analyzer
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                            v1.0.0
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{user?.username}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Operator</span>
                        </div>

                        <button onClick={toggleSidebar} className="btn-icon" style={{ background: 'none', border: 'none', color: isSidebarOpen ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Settings size={20} />
                        </button>

                        <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <LogOut size={20} />
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
