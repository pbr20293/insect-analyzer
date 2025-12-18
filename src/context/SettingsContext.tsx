import { createContext, useContext, useState, type ReactNode } from 'react';

export interface MinIOConfig {
    accessKey: string;
    secretKey: string;
    bucket: string;
    folder: string;
}

export interface ModelConfig {
    modelName: string;
    confidence: number;
    iou: number;
}

export interface SlideshowConfig {
    slideDuration: number; // seconds
    autoAdvance: boolean;
    showManualControls: boolean;
    mode: 'continuous' | 'latest-only'; // continuous: cycle through all, latest-only: show only newest
}

export interface PollingConfig {
    enabled: boolean;
    intervalSeconds: number; // seconds between polling for new images
}

export interface AIAnalysisConfig {
    enabled: boolean;
    gradioEndpoint: string;
    waitForAnalysis: boolean; // Wait for AI analysis before showing image
}

interface SettingsContextType {
    minioConfig: MinIOConfig;
    modelConfig: ModelConfig;
    slideshowConfig: SlideshowConfig;
    pollingConfig: PollingConfig;
    aiAnalysisConfig: AIAnalysisConfig;
    updateMinIOConfig: (config: MinIOConfig) => void;
    updateModelConfig: (config: Partial<ModelConfig>) => void;
    updateSlideshowConfig: (config: Partial<SlideshowConfig>) => void;
    updatePollingConfig: (config: Partial<PollingConfig>) => void;
    updateAIAnalysisConfig: (config: Partial<AIAnalysisConfig>) => void;
    isConfigured: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SLIDESHOW_CONFIG: SlideshowConfig = {
    slideDuration: 10, // 10 seconds
    autoAdvance: true,
    showManualControls: true,
    mode: 'latest-only'
};

const DEFAULT_POLLING_CONFIG: PollingConfig = {
    enabled: true,
    intervalSeconds: 30 // 30 seconds
};

const DEFAULT_AI_ANALYSIS_CONFIG: AIAnalysisConfig = {
    enabled: false,
    gradioEndpoint: 'https://vision.deltathings.com/',
    waitForAnalysis: true
};

const MINIO_STORAGE_KEY = 'insect_analyzer_minio_config';
const MODEL_STORAGE_KEY = 'insect_analyzer_model_config';
const SLIDESHOW_STORAGE_KEY = 'insect_analyzer_slideshow_config';
const POLLING_STORAGE_KEY = 'insect_analyzer_polling_config';
const AI_ANALYSIS_STORAGE_KEY = 'insect_analyzer_ai_analysis_config';

const DEFAULT_MODEL_CONFIG: ModelConfig = {
    modelName: "Generic Detection Model",
    confidence: 0.4,
    iou: 0.5
};

const DEFAULT_MINIO_CONFIG: MinIOConfig = {
    accessKey: '',
    secretKey: '',
    bucket: '',
    folder: ''
};

// Get MinIO endpoint from environment variable
export const getMinIOEndpoint = (): string => {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
        return (window as any).__MINIO_ENDPOINT__ || '192.168.86.3:8031';
    }
    return '192.168.86.3:8031';
};

// Check if we should use SSL based on endpoint
export const shouldUseSSL = (endpoint: string): boolean => {
    return endpoint.includes('deltathings') || endpoint.includes('https');
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

    const [slideshowConfig, setSlideshowConfig] = useState<SlideshowConfig>(() => {
        const stored = localStorage.getItem(SLIDESHOW_STORAGE_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_SLIDESHOW_CONFIG;
    });

    const [pollingConfig, setPollingConfig] = useState<PollingConfig>(() => {
        const stored = localStorage.getItem(POLLING_STORAGE_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_POLLING_CONFIG;
    });

    const [aiAnalysisConfig, setAIAnalysisConfig] = useState<AIAnalysisConfig>(() => {
        const stored = localStorage.getItem(AI_ANALYSIS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : DEFAULT_AI_ANALYSIS_CONFIG;
    });

    const updateMinIOConfig = (config: MinIOConfig) => {
        setMinioConfig(config);
        localStorage.setItem(MINIO_STORAGE_KEY, JSON.stringify(config));
    };

    const updateModelConfig = (newConfig: Partial<ModelConfig>) => {
        setModelConfig(prev => {
            const updated = { ...prev, ...newConfig };
            localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const updateSlideshowConfig = (newConfig: Partial<SlideshowConfig>) => {
        setSlideshowConfig(prev => {
            const updated = { ...prev, ...newConfig };
            localStorage.setItem(SLIDESHOW_STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const updatePollingConfig = (newConfig: Partial<PollingConfig>) => {
        setPollingConfig(prev => {
            const updated = { ...prev, ...newConfig };
            localStorage.setItem(POLLING_STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const updateAIAnalysisConfig = (newConfig: Partial<AIAnalysisConfig>) => {
        setAIAnalysisConfig(prev => {
            const updated = { ...prev, ...newConfig };
            localStorage.setItem(AI_ANALYSIS_STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const isConfigured = !!(minioConfig.accessKey && minioConfig.secretKey && minioConfig.bucket);

    return (
        <SettingsContext.Provider
            value={{
                minioConfig,
                modelConfig,
                slideshowConfig,
                pollingConfig,
                aiAnalysisConfig,
                updateMinIOConfig,
                updateModelConfig,
                updateSlideshowConfig,
                updatePollingConfig,
                updateAIAnalysisConfig,
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
