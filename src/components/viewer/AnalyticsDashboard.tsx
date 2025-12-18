import { Activity } from 'lucide-react';

interface AnalyticsDashboardProps {
    markdownContent: string | null;
}

export const AnalyticsDashboard = ({ markdownContent }: AnalyticsDashboardProps) => {
    return (
        <div className="glass-panel" style={{
            marginTop: '0rem',
            borderRadius: 0,
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: 'none',
            height: '250px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            <div style={{
                padding: '0.8rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem'
            }}>
                <Activity size={18} color="var(--success)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Analytics Dashboard</h3>
            </div>

            <div style={{
                flex: 1,
                padding: '1.5rem',
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: '1fr', // Could be multi-column if markdown is parsed better
                gap: '1rem'
            }}>
                {markdownContent ? (
                    <div className="markdown-content" style={{ fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                        {/* We are rendering raw markdown string for now, but a Markdown renderer should be added later */}
                        {markdownContent}
                    </div>
                ) : (
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic'
                    }}>
                        Select an image to view detailed analytics.
                    </div>
                )}
            </div>
        </div>
    );
};
