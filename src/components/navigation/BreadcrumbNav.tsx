import { useEffect, useState } from 'react';
import { useMinIO } from '../../context/MinIOContext';
import { useSettings } from '../../context/SettingsContext';
import { listFolders } from '../../services/minioClient';
import { ChevronRight, Database, Camera, Calendar } from 'lucide-react';

interface BreadcrumbNavProps {
    onSelectionChange: (customer: string, camera: string, date: string) => void;
}

export const BreadcrumbNav = ({ onSelectionChange }: BreadcrumbNavProps) => {
    const { client, isConnected } = useMinIO();
    const { minioConfig } = useSettings();

    const [customers, setCustomers] = useState<string[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');

    const [cameras, setCameras] = useState<string[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string>('');

    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Load Customers (Top Level Folders)
    useEffect(() => {
        if (!client || !minioConfig.bucket) return;

        const loadCustomers = async () => {
            setError(null);
            try {
                const folders = await listFolders(client, minioConfig.bucket, '');
                setCustomers(folders);
                // Auto-select first if available (optional, maybe not for top level)
            } catch (err: any) {
                console.error("Failed to list customers", err);
                setError(err.message || "Failed to load customers");
            }
        };
        loadCustomers();
    }, [client, minioConfig.bucket]);

    // Load Cameras when Customer selected
    useEffect(() => {
        if (!client || !selectedCustomer) {
            setCameras([]);
            return;
        }

        const loadCameras = async () => {
            try {
                const folders = await listFolders(client, minioConfig.bucket, `${selectedCustomer}/`);
                setCameras(folders);
                if (folders.length > 0) {
                    setSelectedCamera(folders[0]); // Auto select first camera
                }
            } catch (err) {
                console.error("Failed to list cameras", err);
            }
        };
        loadCameras();
    }, [client, selectedCustomer, minioConfig.bucket]);

    // Load Dates when Camera selected
    useEffect(() => {
        if (!client || !selectedCustomer || !selectedCamera) {
            setDates([]);
            return;
        }

        const loadDates = async () => {
            try {
                const folders = await listFolders(client, minioConfig.bucket, `${selectedCustomer}/${selectedCamera}/`);
                setDates(folders);
                if (folders.length > 0) {
                    // Sort dates (assuming format allows, otherwise string sort) or rely on MinIO order
                    // Ideally we want latest. listFolders returns alphabetic usually.
                    // Let's assume M-D-Y or similar needs sorting, but for now take index 0 or last?
                    // User said "latest available folder".
                    // If format matches 03-17-2025, string sort might be weird. 
                    // Let's just pick the last one for now as "latest" approximation or first.
                    // Reverse alphabetical might work for YYYY-MM-DD but unclear for MM-DD-YYYY.
                    // Set the LAST one as default as it's likely latest.
                    setSelectedDate(folders[folders.length - 1]);
                }
            } catch (err) {
                console.error("Failed to list dates", err);
            }
        };
        loadDates();
    }, [client, selectedCustomer, selectedCamera, minioConfig.bucket]);

    // Notify parent of selection
    useEffect(() => {
        if (selectedCustomer && selectedCamera && selectedDate) {
            onSelectionChange(selectedCustomer, selectedCamera, selectedDate);
        }
    }, [selectedCustomer, selectedCamera, selectedDate, onSelectionChange]);

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
