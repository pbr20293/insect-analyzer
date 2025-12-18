import { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Save, AlertTriangle } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
}

export const Sidebar = ({ isOpen }: SidebarProps) => {
    const { minioConfig, modelConfig, updateMinIOConfig, updateModelConfig } = useSettings();

    // Local state for form inputs to avoid constant context updates on every keystroke
    const [localMinio, setLocalMinio] = useState(minioConfig);
    const [localModel, setLocalModel] = useState(modelConfig);

    const handleMinioSave = () => {
        updateMinIOConfig(localMinio);
    };

    const handleModelSave = () => {
        updateModelConfig(localModel);
    };

    const handleTestConnection = async () => {
        const proxyUrl = '/s3-proxy/minio/health/live';
        console.log("Testing connection to:", proxyUrl);
        try {
            const res = await fetch(proxyUrl);
            const text = await res.text();
            console.log("Health Check Status:", res.status);
            console.log("Health Check Body:", text);
            alert(`Health Check: ${res.status}\nBody: ${text.substring(0, 100)}`);

            // Test Bucket access
            if (localMinio.bucket) {
                const bucketUrl = `/s3-proxy/${localMinio.bucket}/?max-keys=1`;
                const bucketRes = await fetch(bucketUrl);
                const bucketText = await bucketRes.text();
                const isXML = bucketText.includes('<?xml');
                alert(`Bucket Check: ${bucketRes.status}\nIs XML: ${isXML}\nBody: ${bucketText.substring(0, 100)}`);
            }
        } catch (e: any) {
            console.error("Test Failed:", e);
            alert(`Test Failed: ${e.message}`);
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
                        <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>Endpoint</label>
                        <input
                            className="input-field"
                            value={localMinio.endPoint}
                            onChange={(e) => setLocalMinio({ ...localMinio, endPoint: e.target.value })}
                        />
                    </div>
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
