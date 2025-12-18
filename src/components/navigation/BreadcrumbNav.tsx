import { useEffect, useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { apiService } from '../../services/apiService';
import { ChevronRight, Database, Camera, Calendar } from 'lucide-react';

interface BreadcrumbNavProps {
    onSelectionChange: (customer: string, camera: string, date: string) => void;
}

export const BreadcrumbNav = ({ onSelectionChange }: BreadcrumbNavProps) => {
    const { minioConfig } = useSettings();

    const [customers, setCustomers] = useState<string[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');

    const [cameras, setCameras] = useState<string[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string>('');

    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Check connection status
    useEffect(() => {
        const checkConnection = !!(minioConfig.accessKey && minioConfig.secretKey && minioConfig.bucket);
        setIsConnected(checkConnection);
    }, [minioConfig]);

    // Load Customers (Top Level Folders)
    useEffect(() => {
        if (!isConnected) return;

        const loadCustomers = async () => {
            setError(null);
            try {
                // For this structure, the "customer" is the folder prefix itself
                if (minioConfig.folder) {
                    // Remove trailing slash if present
                    const customerName = minioConfig.folder.replace(/\/$/, '');
                    setCustomers([customerName]);
                    // Auto-select the customer since there's only one
                    setSelectedCustomer(customerName);
                } else {
                    // If no folder prefix, list top-level folders as customers
                    const response = await apiService.listFolders({
                        accessKey: minioConfig.accessKey,
                        secretKey: minioConfig.secretKey,
                        bucket: minioConfig.bucket,
                        folder: '',
                        prefix: ''
                    });
                    setCustomers(response.folders);
                }
            } catch (err: any) {
                console.error("Failed to list customers", err);
                setError(err.message || "Failed to load customers");
            }
        };
        loadCustomers();
    }, [isConnected, minioConfig]);

    // Load Cameras when Customer selected
    useEffect(() => {
        if (!isConnected || !selectedCustomer) {
            setCameras([]);
            return;
        }

        const loadCameras = async () => {
            try {
                const response = await apiService.listFolders({
                    accessKey: minioConfig.accessKey,
                    secretKey: minioConfig.secretKey,
                    bucket: minioConfig.bucket,
                    folder: minioConfig.folder,
                    prefix: ''
                });
                setCameras(response.folders);
                if (response.folders.length > 0) {
                    setSelectedCamera(response.folders[0]); // Auto select first camera
                }
            } catch (err) {
                console.error("Failed to list cameras", err);
            }
        };
        loadCameras();
    }, [isConnected, selectedCustomer, minioConfig]);

    // Load Dates when Camera selected
    useEffect(() => {
        if (!isConnected || !selectedCustomer || !selectedCamera) {
            setDates([]);
            return;
        }

        const loadDates = async () => {
            try {
                const response = await apiService.listFolders({
                    accessKey: minioConfig.accessKey,
                    secretKey: minioConfig.secretKey,
                    bucket: minioConfig.bucket,
                    folder: minioConfig.folder,
                    prefix: `${selectedCamera}/`
                });
                setDates(response.folders);
                if (response.folders.length > 0) {
                    // Sort dates (assuming format allows, otherwise string sort) or rely on MinIO order
                    // Ideally we want latest. listFolders returns alphabetic usually.
                    // Let's assume M-D-Y or similar needs sorting, but for now take index 0 or last?
                    // User said "latest available folder".
                    // If format matches 03-17-2025, string sort might be weird. 
                    // Let's just pick the last one for now as "latest" approximation or first.
                    // Reverse alphabetical might work for YYYY-MM-DD but unclear for MM-DD-YYYY.
                    // Set the LAST one as default as it's likely latest.
                    setSelectedDate(response.folders[response.folders.length - 1]);
                }
            } catch (err) {
                console.error("Failed to list dates", err);
            }
        };
        loadDates();
    }, [isConnected, selectedCustomer, selectedCamera, minioConfig]);

    // Notify parent of selection
    useEffect(() => {
        if (selectedCustomer && selectedCamera && selectedDate) {
            onSelectionChange(selectedCustomer, selectedCamera, selectedDate);
        }
    }, [selectedCustomer, selectedCamera, selectedDate]); // Remove onSelectionChange from deps

    if (!isConnected) return <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Connecting to MinIO...</div>;

    const selectStyle = {
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-primary)',
        padding: '0.4rem 0.8rem',
        borderRadius: '6px',
        outline: 'none',
        fontSize: '0.9rem',
        cursor: 'pointer'
    };

    return (
        <div className="glass-panel" style={{
            borderRadius: 0,
            marginTop: '1px',
            padding: '0.8rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            borderLeft: 'none', borderRight: 'none'
        }}>
            {error && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    padding: '0.4rem',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    zIndex: 50
                }}>
                    {error}
                </div>
            )}
            {/* Customer Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={16} color="var(--accent-color)" />
                <select
                    style={selectStyle}
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <ChevronRight size={16} color="var(--text-secondary)" />

            {/* Camera Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={16} color="var(--accent-color)" />
                <select
                    style={selectStyle}
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    disabled={!selectedCustomer}
                >
                    <option value="">Select Device</option>
                    {cameras.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <ChevronRight size={16} color="var(--text-secondary)" />

            {/* Date Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} color="var(--accent-color)" />
                <select
                    style={selectStyle}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    disabled={!selectedCamera}
                >
                    <option value="">Select Date</option>
                    {dates.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                {selectedDate ? `Browsing: ${selectedCustomer}/${selectedCamera}/${selectedDate}` : 'Please make a selection'}
            </div>
        </div>
    );
};
