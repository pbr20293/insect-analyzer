import { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { apiService } from '../../services/apiService';
import { Save, AlertTriangle, Settings } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
    const { minioConfig, modelConfig, slideshowConfig, pollingConfig, aiAnalysisConfig, updateMinIOConfig, updateModelConfig, updateSlideshowConfig, updatePollingConfig, updateAIAnalysisConfig } = useSettings();

    // Local state for form inputs to avoid constant context updates on every keystroke
    const [localMinio, setLocalMinio] = useState(minioConfig);
    const [localModel, setLocalModel] = useState(modelConfig);
    const [localSlideshow, setLocalSlideshow] = useState(slideshowConfig);
    const [localPolling, setLocalPolling] = useState(pollingConfig);

    const handleMinioSave = () => {
        updateMinIOConfig(localMinio);
    };

    const handleModelSave = () => {
        updateModelConfig(localModel);
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
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Bucket</label>
                        <input
                            className="input-field"
                            value={localMinio.bucket}
                            onChange={(e) => setLocalMinio({ ...localMinio, bucket: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Folder Prefix (optional)</label>
                        <input
                            className="input-field"
                            value={localMinio.folder}
                            onChange={(e) => setLocalMinio({ ...localMinio, folder: e.target.value })}
                            placeholder="e.g. Fraunhofer-prod/"
                        />
                    </div>

                    <button className="btn-primary" onClick={handleTestConnection} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        Test Connection
                    </button>

                    <button className="btn-primary" onClick={handleMinioSave} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Save size={16} /> Save Connection
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
