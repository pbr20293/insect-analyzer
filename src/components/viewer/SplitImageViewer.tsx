import { ArrowRight } from 'lucide-react';

interface SplitImageViewerProps {
    rawImageUrl: string | null;
    processedImageUrl: string | null;
    isLoading: boolean;
}

export const SplitImageViewer = ({ rawImageUrl, processedImageUrl, isLoading }: SplitImageViewerProps) => {

    // Placeholder skeleton
    if (!rawImageUrl && !processedImageUrl) {
        return (
            <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div className="loader" style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-color)', borderRadius: '50%' }}></div>
                <p>Waiting for image selection...</p>
            </div>
        );
    }

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.5rem',
            height: '100%',
            padding: '1.5rem',
            position: 'relative'
        }}>
            {/* Raw Image Panel */}
            <div className="glass-panel" style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <div style={{
                    padding: '0.8rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Raw Capture</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>ORIGINAL</span>
                </div>

                <div style={{ flex: 1, position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isLoading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}
                    {rawImageUrl ? (
                        <img
                            src={rawImageUrl}
                            alt="Raw Capture"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                    ) : (
                        <div style={{ color: 'var(--text-secondary)' }}>No Image</div>
                    )}
                </div>
            </div>

            {/* Arrow Decoration */}
            <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                background: 'var(--bg-secondary)',
                borderRadius: '50%',
                padding: '0.5rem',
                border: '1px solid var(--border-color)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
                <ArrowRight size={24} color="var(--accent-color)" />
            </div>

            {/* Analyzed Image Panel */}
            <div className="glass-panel" style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid var(--border-highlight)'
            }}>
                <div style={{
                    padding: '0.8rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(59, 130, 246, 0.1)'
                }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-color)' }}>AI Analysis</span>
                    <span style={{ fontSize: '0.7rem', color: '#fff', background: 'var(--accent-color)', padding: '2px 6px', borderRadius: '4px' }}>PROCESSED</span>
                </div>

                <div style={{ flex: 1, position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isLoading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Processing...</div>}
                    {processedImageUrl ? (
                        <img
                            src={processedImageUrl}
                            alt="Analyzed Capture"
                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                    ) : (
                        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                            {isLoading ? 'Analyzing...' : 'Waiting for analysis...'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
