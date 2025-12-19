import { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { apiService } from '../../services/apiService';
import { Save, AlertTriangle, Settings, RefreshCw } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
}

interface Bucket {
    name: string;
    creationDate: Date;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
    const { minioConfig, modelConfig, slideshowConfig, pollingConfig, aiAnalysisConfig, userProfile, updateMinIOConfig, updateModelConfig, updateSlideshowConfig, updatePollingConfig, updateAIAnalysisConfig, updateUserProfile } = useSettings();

    // Local state for form inputs to avoid constant context updates on every keystroke
    const [localMinio, setLocalMinio] = useState(minioConfig);
    const [localModel, setLocalModel] = useState(modelConfig);
    const [localSlideshow, setLocalSlideshow] = useState(slideshowConfig);
    const [localPolling, setLocalPolling] = useState(pollingConfig);
    const [localProfile, setLocalProfile] = useState(userProfile);
    
    // Bucket management state
    const [availableBuckets, setAvailableBuckets] = useState<Bucket[]>([]);
    const [isLoadingBuckets, setIsLoadingBuckets] = useState(false);
    const [bucketsError, setBucketsError] = useState<string | null>(null);
    
    // Folder management state
    const [availableFolders, setAvailableFolders] = useState<string[]>([]);
    const [isLoadingFolders, setIsLoadingFolders] = useState(false);
    const [foldersError, setFoldersError] = useState<string | null>(null);
    
    // Track if user is actively editing to prevent state resets
    const [isEditing, setIsEditing] = useState(false);

    // Fetch buckets when credentials change
    const fetchBuckets = async () => {
        if (!localMinio.accessKey || !localMinio.secretKey) {
            setAvailableBuckets([]);
            setBucketsError(null);
            return;
        }

        setIsLoadingBuckets(true);
        setBucketsError(null);
        
        try {
            const result = await apiService.listBuckets({
                accessKey: localMinio.accessKey,
                secretKey: localMinio.secretKey,
            });
            
            if (result.success) {
                setAvailableBuckets(result.buckets);
            } else {
                setBucketsError('Failed to load buckets');
                setAvailableBuckets([]);
            }
        } catch (error: any) {
            console.error('Failed to fetch buckets:', error);
            setBucketsError(error.message || 'Failed to load buckets');
            setAvailableBuckets([]);
        } finally {
            setIsLoadingBuckets(false);
        }
    };

    // Fetch root folders when bucket changes
    const fetchRootFolders = async () => {
        if (!localMinio.accessKey || !localMinio.secretKey || !localMinio.bucket) {
            setAvailableFolders([]);
            setFoldersError(null);
            return;
        }

        setIsLoadingFolders(true);
        setFoldersError(null);
        
        try {
            const result = await apiService.listRootFolders({
                accessKey: localMinio.accessKey,
                secretKey: localMinio.secretKey,
                bucket: localMinio.bucket,
            });
            
            if (result.success) {
                setAvailableFolders(result.folders);
            } else {
                setFoldersError('Failed to load folders');
                setAvailableFolders([]);
            }
        } catch (error: any) {
            console.error('Failed to fetch folders:', error);
            setFoldersError(error.message || 'Failed to load folders');
            setAvailableFolders([]);
        } finally {
            setIsLoadingFolders(false);
        }
    };

    // Auto-fetch buckets when credentials change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchBuckets();
        }, 500); // Debounce to avoid too many API calls

        return () => clearTimeout(timeoutId);
    }, [localMinio.accessKey, localMinio.secretKey]);

    // Auto-fetch folders when bucket changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchRootFolders();
        }, 500); // Debounce to avoid too many API calls

        return () => clearTimeout(timeoutId);
    }, [localMinio.accessKey, localMinio.secretKey, localMinio.bucket]);

    // Sync local state when context changes (but not while editing)
    useEffect(() => {
        if (!isEditing) {
            setLocalMinio(minioConfig);
            setLocalModel(modelConfig);
            setLocalSlideshow(slideshowConfig);
            setLocalPolling(pollingConfig);
            setLocalProfile(userProfile);
        }
    }, [minioConfig, modelConfig, slideshowConfig, pollingConfig, userProfile, isEditing]);

    const handleMinioSave = () => {
        updateMinIOConfig(localMinio);
    };

    const handleModelSave = () => {
        updateModelConfig(localModel);
    };

    const handleProfileSave = () => {
        updateUserProfile(localProfile);
        setIsEditing(false);
    };

    const handleTestConnection = async () => {
        try {
            const result = await apiService.testMinioConnection({
                accessKey: localMinio.accessKey,
                secretKey: localMinio.secretKey,
                bucket: localMinio.bucket
            });
            
            if (result.success) {
                const bucketStatus = (result as any).bucketExists ? 'exists' : 'not found';
                alert(`✅ Connection successful!\nBucket "${localMinio.bucket}" ${bucketStatus}`);
            } else {
                alert(`❌ Connection failed: ${result.error}`);
            }
        } catch (error: any) {
            console.error("Test connection failed:", error);
            alert(`❌ Test Failed: ${error.message}`);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="glass-panel" style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '320px',
            borderRadius: 0,
            borderRight: 'none',
            borderTop: 'none',
            borderBottom: 'none',
            padding: '1.5rem',
            overflowY: 'auto',
            zIndex: 20
        }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                Configuration
            </h3>

            {/* MinIO Section */}
            <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>MinIO Connection</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Access Key</label>
                        <input
                            className="input-field"
                            type="password"
                            value={localMinio.accessKey}
                            onChange={(e) => setLocalMinio({ ...localMinio, accessKey: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Secret Key</label>
                        <input
                            className="input-field"
                            type="password"
                            value={localMinio.secretKey}
                            onChange={(e) => setLocalMinio({ ...localMinio, secretKey: e.target.value })}
                        />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <label style={{ fontSize: '0.8rem' }}>Bucket</label>
                            {isLoadingBuckets && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Loading...</div>}
                            <button
                                onClick={fetchBuckets}
                                disabled={!localMinio.accessKey || !localMinio.secretKey}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: localMinio.accessKey && localMinio.secretKey ? 'pointer' : 'not-allowed',
                                    color: 'var(--text-secondary)',
                                    padding: '2px'
                                }}
                                title="Refresh buckets"
                            >
                                <RefreshCw size={12} />
                            </button>
                        </div>
                        {availableBuckets.length > 0 ? (
                            <select
                                className="input-field"
                                value={localMinio.bucket}
                                onChange={(e) => setLocalMinio({ ...localMinio, bucket: e.target.value })}
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            >
                                <option value="">Select a bucket...</option>
                                {availableBuckets.map((bucket) => (
                                    <option key={bucket.name} value={bucket.name}>
                                        {bucket.name}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                className="input-field"
                                value={localMinio.bucket}
                                onChange={(e) => setLocalMinio({ ...localMinio, bucket: e.target.value })}
                                placeholder={bucketsError ? 'Enter bucket name manually...' : 'Enter credentials to load buckets...'}
                            />
                        )}
                        {bucketsError && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--error)', marginTop: '4px' }}>
                                {bucketsError}
                            </div>
                        )}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <label style={{ fontSize: '0.8rem' }}>Folder Prefix (optional)</label>
                            {isLoadingFolders && <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Loading...</div>}
                            <button
                                onClick={fetchRootFolders}
                                disabled={!localMinio.accessKey || !localMinio.secretKey || !localMinio.bucket}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: (localMinio.accessKey && localMinio.secretKey && localMinio.bucket) ? 'pointer' : 'not-allowed',
                                    color: 'var(--text-secondary)',
                                    padding: '2px'
                                }}
                                title="Refresh folders"
                            >
                                <RefreshCw size={12} />
                            </button>
                        </div>
                        {availableFolders.length > 0 ? (
                            <select
                                className="input-field"
                                value={localMinio.folder}
                                onChange={(e) => setLocalMinio({ ...localMinio, folder: e.target.value })}
                                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            >
                                <option value="">No prefix (root level)</option>
                                {availableFolders.map((folder) => (
                                    <option key={folder} value={folder}>
                                        {folder}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                className="input-field"
                                value={localMinio.folder}
                                onChange={(e) => setLocalMinio({ ...localMinio, folder: e.target.value })}
                                placeholder={foldersError ? 'e.g. Fraunhofer-prod/' : localMinio.bucket ? 'Loading available folders...' : 'Select bucket first...'}
                            />
                        )}
                        {foldersError && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--error)', marginTop: '4px' }}>
                                {foldersError}
                            </div>
                        )}
                    </div>

                    <button className="btn-primary" onClick={handleTestConnection} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        Test Connection
                    </button>

                    <button className="btn-primary" onClick={handleMinioSave} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Save size={16} /> Save Connection
                    </button>
                </div>
            </div>

            {/* User Profile Section */}
            <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Profile Settings</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Custom Tagline</label>
                        <input
                            className="input-field"
                            type="text"
                            value={localProfile.tagline}
                            onChange={(e) => {
                                setIsEditing(true);
                                setLocalProfile({ ...localProfile, tagline: e.target.value });
                            }}
                            onKeyDown={(e) => {
                                // Ensure space key works
                                if (e.key === ' ') {
                                    e.stopPropagation();
                                }
                            }}
                            placeholder="Enter your custom tagline..."
                            maxLength={60}
                            style={{ 
                                whiteSpace: 'pre',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        />
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Appears beside "Insect Analyzer" in the header ({localProfile.tagline.length}/60 chars)
                        </div>
                    </div>

                    <button className="btn-primary" onClick={handleProfileSave} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Save size={16} /> Save Profile
                    </button>
                </div>
            </div>

            {/* AI Model Section */}
            <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>AI Model Settings</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Model Name</label>
                        <input
                            className="input-field"
                            value={localModel.modelName}
                            onChange={(e) => setLocalModel({ ...localModel, modelName: e.target.value })}
                        />
                    </div>

                    <button className="btn-primary" onClick={handleModelSave} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Save size={16} /> Save Model Settings
                    </button>
                </div>
            </div>

            {/* Slideshow Section */}
            <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Slideshow Settings</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div>
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Slide Duration (seconds)</label>
                        <input
                            className="input-field"
                            type="number"
                            min="1"
                            max="300"
                            value={localSlideshow.slideDuration}
                            onChange={(e) => setLocalSlideshow({ ...localSlideshow, slideDuration: parseInt(e.target.value) || 10 })}
                        />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            id="autoAdvance"
                            checked={localSlideshow.autoAdvance}
                            onChange={(e) => setLocalSlideshow({ ...localSlideshow, autoAdvance: e.target.checked })}
                        />
                        <label htmlFor="autoAdvance" style={{ fontSize: '0.8rem' }}>Auto-advance images</label>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            id="showManualControls"
                            checked={localSlideshow.showManualControls}
                            onChange={(e) => setLocalSlideshow({ ...localSlideshow, showManualControls: e.target.checked })}
                        />
                        <label htmlFor="showManualControls" style={{ fontSize: '0.8rem' }}>Show navigation arrows</label>
                    </div>

                    {localSlideshow.autoAdvance && (
                        <div>
                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Slideshow Mode:</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="radio"
                                        id="continuous"
                                        name="slideshowMode"
                                        checked={localSlideshow.mode === 'continuous'}
                                        onChange={() => setLocalSlideshow({ ...localSlideshow, mode: 'continuous' })}
                                    />
                                    <label htmlFor="continuous" style={{ fontSize: '0.8rem' }}>Continuous - Cycle through all images</label>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="radio"
                                        id="latestOnly"
                                        name="slideshowMode"
                                        checked={localSlideshow.mode === 'latest-only'}
                                        onChange={() => setLocalSlideshow({ ...localSlideshow, mode: 'latest-only' })}
                                    />
                                    <label htmlFor="latestOnly" style={{ fontSize: '0.8rem' }}>Latest Only - Show newest image only</label>
                                </div>
                            </div>
                        </div>
                    )}

                    <button className="btn-primary" onClick={() => updateSlideshowConfig(localSlideshow)} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Save size={16} /> Save Slideshow Settings
                    </button>
                </div>
            </div>

            {/* Polling Configuration */}
            <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Image Polling</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            id="pollingEnabled"
                            checked={localPolling.enabled}
                            onChange={(e) => setLocalPolling({ ...localPolling, enabled: e.target.checked })}
                        />
                        <label htmlFor="pollingEnabled" style={{ fontSize: '0.8rem' }}>Enable automatic polling for new images</label>
                    </div>

                    {localPolling.enabled && (
                        <div>
                            <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>
                                Polling Interval: {localPolling.intervalSeconds} seconds
                            </label>
                            <input
                                className="input-field"
                                type="range"
                                min="5"
                                max="300"
                                value={localPolling.intervalSeconds}
                                onChange={(e) => setLocalPolling({ ...localPolling, intervalSeconds: parseInt(e.target.value) })}
                            />
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Range: 5 seconds to 5 minutes
                            </div>
                        </div>
                    )}

                    <button className="btn-primary" onClick={() => updatePollingConfig(localPolling)} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Save size={16} /> Save Polling Settings
                    </button>
                </div>
            </div>

            {/* AI Analysis Settings */}
            <div className="glass-panel" style={{ padding: '1rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings size={18} />
                    AI Analysis Settings
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                            type="checkbox"
                            id="aiEnabled"
                            checked={aiAnalysisConfig.enabled}
                            onChange={(e) => updateAIAnalysisConfig({ enabled: e.target.checked })}
                        />
                        <label htmlFor="aiEnabled" style={{ fontSize: '0.85rem', fontWeight: '500' }}>Enable AI Analysis</label>
                    </div>

                    {aiAnalysisConfig.enabled && (
                        <>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', display: 'block' }}>Gradio Endpoint</label>
                                <input
                                    className="input-field"
                                    type="text"
                                    value={aiAnalysisConfig.gradioEndpoint}
                                    onChange={(e) => updateAIAnalysisConfig({ gradioEndpoint: e.target.value })}
                                    placeholder="https://vision.deltathings.com/"
                                    style={{ fontSize: '0.85rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    id="waitForAnalysis"
                                    checked={aiAnalysisConfig.waitForAnalysis}
                                    onChange={(e) => updateAIAnalysisConfig({ waitForAnalysis: e.target.checked })}
                                />
                                <label htmlFor="waitForAnalysis" style={{ fontSize: '0.8rem' }}>Wait for analysis before displaying</label>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid var(--warning)',
                borderRadius: '6px',
                padding: '0.8rem',
                display: 'flex',
                gap: '0.8rem',
                alignItems: 'start'
            }}>
                <AlertTriangle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Restart application if connection issues persist after changing credentials.
                </p>
            </div>

        </div>
    );
};
