import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { S3Client } from "@aws-sdk/client-s3";
import { useSettings } from './SettingsContext';
import { createMinioClient } from '../services/minioClient';

interface MinIOContextType {
    client: S3Client | null;
    error: string | null;
    isConnected: boolean;
}

const MinIOContext = createContext<MinIOContextType | undefined>(undefined);

export const MinIOProvider = ({ children }: { children: ReactNode }) => {
    const { minioConfig, isConfigured } = useSettings();
    const [client, setClient] = useState<S3Client | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isConfigured) {
            setClient(null);
            return;
        }

        try {
            const s3Client = createMinioClient(minioConfig);
            setClient(s3Client);
            setError(null);
        } catch (err) {
            console.error("Failed to initialize MinIO client:", err);
            setError("Failed to initialize MinIO client");
            setClient(null);
        }
    }, [minioConfig, isConfigured]);

    return (
        <MinIOContext.Provider value={{ client, error, isConnected: !!client }}>
            {children}
        </MinIOContext.Provider>
    );
};

export const useMinIO = () => {
    const context = useContext(MinIOContext);
    if (context === undefined) {
        throw new Error('useMinIO must be used within a MinIOProvider');
    }
    return context;
};
