import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiService } from '../services/apiService';
import { useAuth } from './AuthContext';

export interface MinIOConfig {
    accessKey: string;
    secretKey: string;
    bucket: string;
    folder: string;
}

export interface UserProfile {
    tagline: string;
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
    userProfile: UserProfile;
    updateMinIOConfig: (config: MinIOConfig) => void;
    updateModelConfig: (config: Partial<ModelConfig>) => void;
    updateSlideshowConfig: (config: Partial<SlideshowConfig>) => void;
    updatePollingConfig: (config: Partial<PollingConfig>) => void;
    updateAIAnalysisConfig: (config: Partial<AIAnalysisConfig>) => void;
    updateUserProfile: (profile: Partial<UserProfile>) => void;
    isConfigured: boolean;
    isLoading: boolean;
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
const USER_PROFILE_STORAGE_KEY = 'insect_analyzer_user_profile';

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

const DEFAULT_USER_PROFILE: UserProfile = {
    tagline: 'Advanced Insect Detection & Analysis'
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
    const { user } = useAuth();
    const [minioConfig, setMinioConfig] = useState<MinIOConfig>(DEFAULT_MINIO_CONFIG);
    const [modelConfig, setModelConfig] = useState<ModelConfig>(DEFAULT_MODEL_CONFIG);
    const [slideshowConfig, setSlideshowConfig] = useState<SlideshowConfig>(DEFAULT_SLIDESHOW_CONFIG);
    const [pollingConfig, setPollingConfig] = useState<PollingConfig>(DEFAULT_POLLING_CONFIG);
    const [aiAnalysisConfig, setAIAnalysisConfig] = useState<AIAnalysisConfig>(DEFAULT_AI_ANALYSIS_CONFIG);
    const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
    const [isLoading, setIsLoading] = useState(false);

    // Load settings from server when user logs in
    useEffect(() => {
        if (user?.username) {
            loadUserSettings(user.username);
        } else {
            // Reset to defaults when no user
            setMinioConfig(DEFAULT_MINIO_CONFIG);
            setModelConfig(DEFAULT_MODEL_CONFIG);
            setSlideshowConfig(DEFAULT_SLIDESHOW_CONFIG);
            setPollingConfig(DEFAULT_POLLING_CONFIG);
            setAIAnalysisConfig(DEFAULT_AI_ANALYSIS_CONFIG);
            setUserProfile(DEFAULT_USER_PROFILE);
        }
    }, [user?.username]);

    const loadUserSettings = async (username: string) => {
        setIsLoading(true);
        try {
            const result = await apiService.getUserSettings(username);
            if (result.success && result.settings) {
                const settings = result.settings;
                setMinioConfig(settings.minioConfig || DEFAULT_MINIO_CONFIG);
                setModelConfig(settings.modelConfig || DEFAULT_MODEL_CONFIG);
                setSlideshowConfig(settings.slideshowConfig || DEFAULT_SLIDESHOW_CONFIG);
                setPollingConfig(settings.pollingConfig || DEFAULT_POLLING_CONFIG);
                setAIAnalysisConfig(settings.aiAnalysisConfig || DEFAULT_AI_ANALYSIS_CONFIG);
                setUserProfile(settings.userProfile || DEFAULT_USER_PROFILE);
            }
        } catch (error) {
            console.error('Failed to load user settings:', error);
            // Fallback to localStorage for backwards compatibility
            const storedMinio = localStorage.getItem(`${MINIO_STORAGE_KEY}_${username}`);
            const storedModel = localStorage.getItem(`${MODEL_STORAGE_KEY}_${username}`);
            const storedSlideshow = localStorage.getItem(`${SLIDESHOW_STORAGE_KEY}_${username}`);
            const storedPolling = localStorage.getItem(`${POLLING_STORAGE_KEY}_${username}`);
            const storedAI = localStorage.getItem(`${AI_ANALYSIS_STORAGE_KEY}_${username}`);
            const storedProfile = localStorage.getItem(`${USER_PROFILE_STORAGE_KEY}_${username}`);
            
            if (storedMinio) setMinioConfig(JSON.parse(storedMinio));
            if (storedModel) setModelConfig(JSON.parse(storedModel));
            if (storedSlideshow) setSlideshowConfig(JSON.parse(storedSlideshow));
            if (storedPolling) setPollingConfig(JSON.parse(storedPolling));
            if (storedAI) setAIAnalysisConfig(JSON.parse(storedAI));
            if (storedProfile) setUserProfile(JSON.parse(storedProfile));
        } finally {
            setIsLoading(false);
        }
    };

    const saveUserSettings = async (username: string) => {
        if (!username) return;

        const allSettings = {
            minioConfig,
            modelConfig,
            slideshowConfig,
            pollingConfig,
            aiAnalysisConfig,
            userProfile,
            lastUpdated: new Date().toISOString()
        };

        try {
            await apiService.saveUserSettings(username, allSettings);
            // Also save to localStorage as backup
            localStorage.setItem(`${MINIO_STORAGE_KEY}_${username}`, JSON.stringify(minioConfig));
            localStorage.setItem(`${MODEL_STORAGE_KEY}_${username}`, JSON.stringify(modelConfig));
            localStorage.setItem(`${SLIDESHOW_STORAGE_KEY}_${username}`, JSON.stringify(slideshowConfig));
            localStorage.setItem(`${POLLING_STORAGE_KEY}_${username}`, JSON.stringify(pollingConfig));
            localStorage.setItem(`${AI_ANALYSIS_STORAGE_KEY}_${username}`, JSON.stringify(aiAnalysisConfig));
            localStorage.setItem(`${USER_PROFILE_STORAGE_KEY}_${username}`, JSON.stringify(userProfile));
        } catch (error) {
            console.error('Failed to save user settings to server:', error);
            // Fallback to localStorage only
            localStorage.setItem(`${MINIO_STORAGE_KEY}_${username}`, JSON.stringify(minioConfig));
            localStorage.setItem(`${MODEL_STORAGE_KEY}_${username}`, JSON.stringify(modelConfig));
            localStorage.setItem(`${SLIDESHOW_STORAGE_KEY}_${username}`, JSON.stringify(slideshowConfig));
            localStorage.setItem(`${POLLING_STORAGE_KEY}_${username}`, JSON.stringify(pollingConfig));
            localStorage.setItem(`${AI_ANALYSIS_STORAGE_KEY}_${username}`, JSON.stringify(aiAnalysisConfig));
            localStorage.setItem(`${USER_PROFILE_STORAGE_KEY}_${username}`, JSON.stringify(userProfile));
        }
    };

    const updateMinIOConfig = (config: MinIOConfig) => {
        setMinioConfig(config);
        if (user?.username) {
            // Debounce the server save
            setTimeout(() => saveUserSettings(user.username), 100);
        }
    };

    const updateModelConfig = (newConfig: Partial<ModelConfig>) => {
        setModelConfig(prev => {
            const updated = { ...prev, ...newConfig };
            if (user?.username) {
                setTimeout(() => saveUserSettings(user.username), 100);
            }
            return updated;
        });
    };

    const updateSlideshowConfig = (newConfig: Partial<SlideshowConfig>) => {
        setSlideshowConfig(prev => {
            const updated = { ...prev, ...newConfig };
            if (user?.username) {
                setTimeout(() => saveUserSettings(user.username), 100);
            }
            return updated;
        });
    };

    const updatePollingConfig = (newConfig: Partial<PollingConfig>) => {
        setPollingConfig(prev => {
            const updated = { ...prev, ...newConfig };
            if (user?.username) {
                setTimeout(() => saveUserSettings(user.username), 100);
            }
            return updated;
        });
    };

    const updateAIAnalysisConfig = (newConfig: Partial<AIAnalysisConfig>) => {
        setAIAnalysisConfig(prev => {
            const updated = { ...prev, ...newConfig };
            if (user?.username) {
                setTimeout(() => saveUserSettings(user.username), 100);
            }
            return updated;
        });
    };

    const updateUserProfile = (newProfile: Partial<UserProfile>) => {
        setUserProfile(prev => {
            const updated = { ...prev, ...newProfile };
            if (user?.username) {
                setTimeout(() => saveUserSettings(user.username), 100);
            }
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
                userProfile,
                updateMinIOConfig,
                updateModelConfig,
                updateSlideshowConfig,
                updatePollingConfig,
                updateAIAnalysisConfig,
                updateUserProfile,
                isConfigured,
                isLoading
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
