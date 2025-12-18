import { createContext, useContext, useState, type ReactNode } from 'react';

export interface MinIOConfig {
    endPoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    useSSL: boolean;
}

export interface ModelConfig {
    modelName: string;
    confidence: number;
    iou: number;
}

interface SettingsContextType {
    minioConfig: MinIOConfig;
    modelConfig: ModelConfig;
    updateMinIOConfig: (config: MinIOConfig) => void;
    updateModelConfig: (config: Partial<ModelConfig>) => void;
    isConfigured: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const MINIO_STORAGE_KEY = 'insect_analyzer_minio_config';
const MODEL_STORAGE_KEY = 'insect_analyzer_model_config';

const DEFAULT_MODEL_CONFIG: ModelConfig = {
    modelName: "Generic Detection Model",
    confidence: 0.4,
    iou: 0.5
};

const DEFAULT_MINIO_CONFIG: MinIOConfig = {
    endPoint: 'minioapi.deltathings.synology.me:1983',
    accessKey: '',
    secretKey: '',
    bucket: '',
    useSSL: true
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [minioConfig, setMinioConfig] = useState<MinIOConfig>(() => {
        const stored = localStorage.getItem(MINIO_STORAGE_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_MINIO_CONFIG;
    });

    const [modelConfig, setModelConfig] = useState<ModelConfig>(() => {
        const stored = localStorage.getItem(MODEL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_MODEL_CONFIG;
    });

    const updateMinIOConfig = (config: MinIOConfig) => {
        // Strip protocol if user accidentally includes it
        const sanitizedConfig = {
            ...config,
            endPoint: config.endPoint.replace(/^https?:\/\//, '')
        };
        setMinioConfig(sanitizedConfig);
        localStorage.setItem(MINIO_STORAGE_KEY, JSON.stringify(sanitizedConfig));
    };

    const updateModelConfig = (newConfig: Partial<ModelConfig>) => {
        setModelConfig(prev => {
            const updated = { ...prev, ...newConfig };
            localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const isConfigured = !!(minioConfig.accessKey && minioConfig.secretKey && minioConfig.bucket);

    return (
        <SettingsContext.Provider
            value={{
                minioConfig,
                modelConfig,
                updateMinIOConfig,
                updateModelConfig,
                isConfigured
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
