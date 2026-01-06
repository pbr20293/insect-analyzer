import { useState, useRef, useCallback } from 'react';
import { ArrowRight, ZoomIn, ZoomOut, RotateCcw, Maximize } from 'lucide-react';

interface SplitImageViewerProps {
    rawImageUrl: string | null;
    processedImageUrl: string | null;
    isLoading: boolean;
    aiEnabled: boolean;
}

interface ImageState {
    scale: number;
    translateX: number;
    translateY: number;
}

export const SplitImageViewer = ({ rawImageUrl, processedImageUrl, isLoading, aiEnabled }: SplitImageViewerProps) => {
    const [rawImageState, setRawImageState] = useState<ImageState>({ scale: 1, translateX: 0, translateY: 0 });
    const [processedImageState, setProcessedImageState] = useState<ImageState>({ scale: 1, translateX: 0, translateY: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState<'raw' | 'processed' | null>(null);
    
    const rawImageRef = useRef<HTMLImageElement>(null);
    const processedImageRef = useRef<HTMLImageElement>(null);
    const rawContainerRef = useRef<HTMLDivElement>(null);
    const processedContainerRef = useRef<HTMLDivElement>(null);

    // Reset image state when URLs change
    const resetImageState = useCallback((type: 'raw' | 'processed') => {
        if (type === 'raw') {
            setRawImageState({ scale: 1, translateX: 0, translateY: 0 });
        } else {
            setProcessedImageState({ scale: 1, translateX: 0, translateY: 0 });
        }
    }, []);

    // Zoom functionality
    const handleZoom = useCallback((type: 'raw' | 'processed', direction: 'in' | 'out') => {
        const setState = type === 'raw' ? setRawImageState : setProcessedImageState;
        setState(prev => ({
            ...prev,
            scale: direction === 'in' 
                ? Math.min(prev.scale * 1.2, 5) 
                : Math.max(prev.scale / 1.2, 0.1)
        }));
    }, []);

    // Mouse wheel zoom functionality
    const handleWheel = useCallback((e: React.WheelEvent, type: 'raw' | 'processed') => {
        e.preventDefault();
        const direction = e.deltaY < 0 ? 'in' : 'out';
        handleZoom(type, direction);
    }, [handleZoom]);

    // Double-click to reset
    const handleDoubleClick = useCallback((type: 'raw' | 'processed') => {
        resetImageState(type);
    }, [resetImageState]);

    // Pan functionality
    const handleMouseDown = useCallback((e: React.MouseEvent, type: 'raw' | 'processed') => {
        const setState = type === 'raw' ? setRawImageState : setProcessedImageState;
        const currentState = type === 'raw' ? rawImageState : processedImageState;
        
        if (currentState.scale <= 1) return; // Only allow panning when zoomed
        
        e.preventDefault();
        const startX = e.clientX - currentState.translateX;
        const startY = e.clientY - currentState.translateY;

        const handleMouseMove = (e: MouseEvent) => {
            setState(prev => ({
                ...prev,
                translateX: e.clientX - startX,
                translateY: e.clientY - startY
            }));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [rawImageState, processedImageState]);

    // Fullscreen functionality
    const toggleFullscreen = useCallback((type: 'raw' | 'processed') => {
        if (isFullscreen && fullscreenImage === type) {
            setIsFullscreen(false);
            setFullscreenImage(null);
        } else {
            setIsFullscreen(true);
            setFullscreenImage(type);
        }
    }, [isFullscreen, fullscreenImage]);

    // Image controls component
    const ImageControls = ({ type }: { type: 'raw' | 'processed' }) => (
        <div 
            className="image-controls"
            style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                display: 'flex',
                gap: '3px',
                opacity: 0.9,
                transition: 'opacity 0.2s',
                background: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '6px',
                padding: '4px',
                backdropFilter: 'blur(4px)'
            }}
        >
            <button
                onClick={() => handleZoom(type, 'in')}
                style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    color: 'white',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '12px'
                }}
                onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.25)';
                    (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.15)';
                    (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                }}
                title="Zoom In (Scroll Up)"
            >
                <ZoomIn size={14} />
            </button>
            <button
                onClick={() => handleZoom(type, 'out')}
                style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    color: 'white',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.25)';
                    (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.15)';
                    (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                }}
                title="Zoom Out (Scroll Down)"
            >
                <ZoomOut size={14} />
            </button>
            <button
                onClick={() => resetImageState(type)}
                style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    color: 'white',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.25)';
                    (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.15)';
                    (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                }}
                title="Reset View (Double Click)"
            >
                <RotateCcw size={14} />
            </button>
            <button
                onClick={() => toggleFullscreen(type)}
                style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    color: 'white',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.background = 'rgba(59, 130, 246, 0.4)';
                    (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                    (e.target as HTMLButtonElement).style.borderColor = 'rgba(59, 130, 246, 0.6)';
                }}
                onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.15)';
                    (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                    (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                title="Fullscreen (F key)"
            >
                <Maximize size={14} />
            </button>
        </div>
    );

    // Fullscreen view
    if (isFullscreen && fullscreenImage) {
        const imageUrl = fullscreenImage === 'raw' ? rawImageUrl : processedImageUrl;
        const imageState = fullscreenImage === 'raw' ? rawImageState : processedImageState;
        
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.95)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <button
                    onClick={() => setIsFullscreen(false)}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        fontSize: '20px',
                        cursor: 'pointer',
                        zIndex: 1001
                    }}
                >
                    ×
                </button>
                <div style={{
                    position: 'relative',
                    width: '90vw',
                    height: '90vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {imageUrl ? (
                        <img
                            ref={fullscreenImage === 'raw' ? rawImageRef : processedImageRef}
                            src={imageUrl}
                            alt={fullscreenImage === 'raw' ? "Raw Capture" : "Analyzed Capture"}
                            onMouseDown={(e) => handleMouseDown(e, fullscreenImage)}
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '100%',
                                objectFit: 'contain',
                                transform: `scale(${imageState.scale}) translate(${imageState.translateX / imageState.scale}px, ${imageState.translateY / imageState.scale}px)`,
                                cursor: imageState.scale > 1 ? 'grab' : 'default',
                                transition: 'transform 0.1s ease-out',
                                userSelect: 'none'
                            }}
                            draggable={false}
                        />
                    ) : (
                        <div style={{ color: 'white' }}>No Image</div>
                    )}
                    <ImageControls type={fullscreenImage} />
                </div>
            </div>
        );
    }

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
        <div 
            className="split-image-viewer"
            style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth > 1024 ? '1fr 1fr' : '1fr',
                gridTemplateRows: window.innerWidth <= 1024 ? '1fr 1fr' : '1fr',
                gap: '0.75rem',
                height: '100%',
                padding: '0.75rem',
                position: 'relative',
                minHeight: 0 // Important for proper flex behavior
            }}
        >
            {/* Raw Image Panel */}
            <div className="glass-panel image-panel" style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                minHeight: window.innerWidth <= 1024 ? '40vh' : 'auto',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{
                    padding: '0.5rem 0.75rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: '36px'
                }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Raw Capture</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.1)', padding: '1px 4px', borderRadius: '3px' }}>ORIGINAL</span>
                </div>

                <div 
                    ref={rawContainerRef}
                    className="image-container"
                    style={{ 
                        flex: 1, 
                        position: 'relative', 
                        background: '#000', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        overflow: 'hidden',
                        cursor: rawImageState.scale > 1 ? 'grab' : 'default',
                        minHeight: 0
                    }}
                >
                    {isLoading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading...</div>}
                    {rawImageUrl ? (
                        <>
                            <img
                                ref={rawImageRef}
                                src={rawImageUrl}
                                alt="Raw Capture"
                                onMouseDown={(e) => handleMouseDown(e, 'raw')}
                                onWheel={(e) => handleWheel(e, 'raw')}
                                onDoubleClick={() => handleDoubleClick('raw')}
                                onLoad={() => resetImageState('raw')}
                                style={{ 
                                    width: '100%',
                                    height: '100%', 
                                    objectFit: 'contain',
                                    transform: `scale(${rawImageState.scale}) translate(${rawImageState.translateX / rawImageState.scale}px, ${rawImageState.translateY / rawImageState.scale}px)`,
                                    cursor: rawImageState.scale > 1 ? 'grab' : 'default',
                                    transition: 'transform 0.1s ease-out',
                                    userSelect: 'none'
                                }}
                                draggable={false}
                            />
                            <ImageControls type="raw" />
                        </>
                    ) : (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No Image</div>
                    )}
                </div>
            </div>

            {/* Arrow Decoration - only show on desktop */}
            {window.innerWidth > 1024 && (
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                    background: 'rgba(59, 130, 246, 0.15)',
                    borderRadius: '50%',
                    padding: '0.4rem',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(4px)'
                }}>
                    <ArrowRight size={20} color="var(--accent-color)" />
                </div>
            )}

            {/* Analyzed Image Panel */}
            <div className="glass-panel image-panel" style={{
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                minHeight: window.innerWidth <= 1024 ? '40vh' : 'auto',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.05)'
            }}>
                <div style={{
                    padding: '0.5rem 0.75rem',
                    borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(59, 130, 246, 0.08)',
                    minHeight: '36px'
                }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-color)' }}>AI Analysis</span>
                    <span style={{ fontSize: '0.65rem', color: '#fff', background: 'var(--accent-color)', padding: '1px 4px', borderRadius: '3px' }}>PROCESSED</span>
                </div>

                <div 
                    ref={processedContainerRef}
                    className="image-container"
                    style={{ 
                        flex: 1, 
                        position: 'relative', 
                        background: '#000', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        overflow: 'hidden',
                        cursor: processedImageState.scale > 1 ? 'grab' : 'default',
                        minHeight: 0
                    }}
                >
                    {isLoading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Processing...</div>}
                    {processedImageUrl ? (
                        <>
                            <img
                                ref={processedImageRef}
                                src={processedImageUrl}
                                alt="Analyzed Capture"
                                onMouseDown={(e) => handleMouseDown(e, 'processed')}
                                onWheel={(e) => handleWheel(e, 'processed')}
                                onDoubleClick={() => handleDoubleClick('processed')}
                                onLoad={() => resetImageState('processed')}
                                style={{ 
                                    width: '100%',
                                    height: '100%', 
                                    objectFit: 'contain',
                                    transform: `scale(${processedImageState.scale}) translate(${processedImageState.translateX / processedImageState.scale}px, ${processedImageState.translateY / processedImageState.scale}px)`,
                                    cursor: processedImageState.scale > 1 ? 'grab' : 'default',
                                    transition: 'transform 0.1s ease-out',
                                    userSelect: 'none'
                                }}
                                draggable={false}
                            />
                            <ImageControls type="processed" />
                        </>
                    ) : (
                        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem', fontSize: '0.9rem' }}>
                            {aiEnabled ? (isLoading ? 'Analyzing...' : 'Waiting for analysis...') : 'AI analysis turned off'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
