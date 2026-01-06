import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { AppLayout } from './components/layout/AppLayout';
import { Sidebar } from './components/layout/Sidebar';
import { BreadcrumbNav } from './components/navigation/BreadcrumbNav';
import { SplitImageViewer } from './components/viewer/SplitImageViewer';
import { AnalyticsDashboard } from './components/viewer/AnalyticsDashboard';
import { apiService, getApiBase } from './services/apiService';

const MainApp = () => {
  const { user } = useAuth();
  const { minioConfig, slideshowConfig, pollingConfig, aiAnalysisConfig, modelConfig, isLoading } = useSettings();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Selection State
  const [customer, setCustomer] = useState('');
  const [camera, setCamera] = useState('');
  const [date, setDate] = useState('');

  // Image State
  const [imageList, setImageList] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [analyzedImageUrl, setAnalyzedImageUrl] = useState<string | null>(null);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Refs to prevent race conditions
  const processingRef = useRef(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentProcessingKeyRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);
  const lastImageCountRef = useRef(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Memoize the selection change handler to prevent unnecessary re-renders
  const handleSelectionChange = useCallback((c: string, cam: string, d: string) => {
    // Only reset if the selection actually changed
    if (c !== customer || cam !== camera || d !== date) {
      setCustomer(c);
      setCamera(cam);
      setDate(d);
      // Reset everything
      setRawImageUrl(null);
      setAnalyzedImageUrl(null);
      setAnalysisText(null);
      setIsAutoPlaying(false);
    }
  }, [customer, camera, date]);

  // Build image URL helper (no hardcoding)
  const buildImageUrl = useCallback((imageKey: string): string => {
    const apiBase = getApiBase();
    const bucket = encodeURIComponent(minioConfig.bucket);
    const key = encodeURIComponent(imageKey);
    const accessKey = encodeURIComponent(minioConfig.accessKey);
    const secretKey = encodeURIComponent(minioConfig.secretKey);
    return `${apiBase}/api/minio/image/${bucket}?key=${key}&accessKey=${accessKey}&secretKey=${secretKey}`;
  }, [minioConfig.bucket, minioConfig.accessKey, minioConfig.secretKey]);

  // Process image with AI - clean and async
  const processImageWithAI = useCallback(async (imageKey: string): Promise<void> => {
    if (!aiAnalysisConfig.enabled) {
      return;
    }

    // Prevent duplicate processing
    if (processingRef.current && currentProcessingKeyRef.current === imageKey) {
      return;
    }

    processingRef.current = true;
    currentProcessingKeyRef.current = imageKey;
    setIsProcessing(true);

    try {
      const blob = await apiService.getImageBlob({
        accessKey: minioConfig.accessKey,
        secretKey: minioConfig.secretKey,
        bucket: minioConfig.bucket,
        key: imageKey
      });

      const result = await apiService.processImageWithGradio(blob, {
        modelName: modelConfig.modelName,
        confidence: modelConfig.confidence,
        iou: modelConfig.iou,
        endpoint: aiAnalysisConfig.gradioEndpoint
      });

      console.log('AI processing result:', result);

      // Only update if we're still processing the same image
      if (currentProcessingKeyRef.current === imageKey) {
        setAnalyzedImageUrl(result.resultImage as string);
        setAnalysisText(result.analysisParams);
      }
    } catch (err) {
      console.error('AI processing failed:', err);
      if (currentProcessingKeyRef.current === imageKey) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setAnalysisText(`AI analysis failed: ${errorMessage}`);
      }
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [aiAnalysisConfig.enabled, aiAnalysisConfig.gradioEndpoint, minioConfig, modelConfig]);

  // Display an image - the SINGLE source of truth for showing images
  const displayImage = useCallback(async (index: number): Promise<void> => {
    if (imageList.length === 0 || index < 0 || index >= imageList.length) {
      return;
    }

    const image = imageList[index];
    
    // Step 1: Show original image immediately (no flickering)
    setCurrentImageIndex(index);
    setRawImageUrl(buildImageUrl(image.key));
    setAnalyzedImageUrl(null);
    setAnalysisText(null);

    // Step 2: If AI is enabled, process and wait for results
    if (aiAnalysisConfig.enabled) {
      await processImageWithAI(image.key);
    }
  }, [imageList, buildImageUrl, aiAnalysisConfig.enabled, processImageWithAI]);

  // Auto-advance timer
  const scheduleNextAdvance = useCallback(() => {
    if (!slideshowConfig.autoAdvance || !isAutoPlaying || imageList.length <= 1) {
      return;
    }

    // In latest-only mode, don't auto-advance
    if (slideshowConfig.mode === 'latest-only') {
      return;
    }

    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    advanceTimerRef.current = setTimeout(() => {
      const nextIndex = (currentImageIndex + 1) % imageList.length;
      displayImage(nextIndex);
    }, slideshowConfig.slideDuration * 1000);
  }, [slideshowConfig.autoAdvance, slideshowConfig.slideDuration, slideshowConfig.mode, isAutoPlaying, imageList.length, currentImageIndex, displayImage]);

  // Manual navigation
  const goToNextImage = useCallback(() => {
    if (imageList.length <= 1) return;
    const nextIndex = (currentImageIndex + 1) % imageList.length;
    displayImage(nextIndex);
  }, [imageList.length, currentImageIndex, displayImage]);

  const goToPreviousImage = useCallback(() => {
    if (imageList.length <= 1) return;
    const nextIndex = currentImageIndex === 0 ? imageList.length - 1 : currentImageIndex - 1;
    displayImage(nextIndex);
  }, [imageList.length, currentImageIndex, displayImage]);

  const clearImageState = useCallback(() => {
    setImageList([]);
    setCurrentImageIndex(0);
    setRawImageUrl(null);
    setAnalyzedImageUrl(null);
    setAnalysisText(null);
    setIsAutoPlaying(false);
    hasInitializedRef.current = false;
    lastImageCountRef.current = 0;
  }, []);

  // Clear everything when selection changes
  useEffect(() => {
    clearImageState();
    hasInitializedRef.current = false; // Reset initialization flag
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, [customer, camera, date]);

  // Display first image when image list is loaded
  useEffect(() => {
    if (imageList.length === 0) {
      hasInitializedRef.current = false;
      return;
    }

    if (hasInitializedRef.current) {
      return; // Already initialized
    }

    console.log('Initializing first image:', imageList[0].key);
    hasInitializedRef.current = true;

    const initializeFirstImage = async () => {
      let imageToShow;
      let indexToShow;
      
      if (slideshowConfig.mode === 'latest-only') {
        // Show the latest image (first in array, since images are sorted newest first)
        imageToShow = imageList[0];
        indexToShow = 0;
      } else {
        // Show the first image (continuous mode)
        imageToShow = imageList[0];
        indexToShow = 0;
      }

      // Step 1: Show image immediately
      const imageUrl = buildImageUrl(imageToShow.key);
      setCurrentImageIndex(indexToShow);
      setRawImageUrl(imageUrl);
      setAnalyzedImageUrl(null);
      setAnalysisText(null);

      // Step 2: Process with AI if enabled
      if (aiAnalysisConfig.enabled) {
        await processImageWithAI(imageToShow.key);
      }

      // Step 3: Auto-start slideshow if configured and in continuous mode
      if (slideshowConfig.autoAdvance && imageList.length > 1 && slideshowConfig.mode === 'continuous') {
        console.log('Starting auto-play for continuous mode');
        setIsAutoPlaying(true);
      } else {
        console.log('Not starting auto-play:', {
          autoAdvance: slideshowConfig.autoAdvance,
          imageCount: imageList.length,
          mode: slideshowConfig.mode
        });
      }
    };

    initializeFirstImage();
  }, [imageList.length]); // Only depend on length to avoid function dependencies
  useEffect(() => {
    if (isAutoPlaying && imageList.length > 1 && slideshowConfig.mode === 'continuous') {
      scheduleNextAdvance();
    } else {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    }

    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }
    };
  }, [isAutoPlaying, slideshowConfig.mode, currentImageIndex, scheduleNextAdvance]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (imageList.length <= 1) return;
      
      // Don't interfere with input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPreviousImage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextImage();
          break;
        case ' ': // Spacebar to toggle auto-play
          event.preventDefault();
          setIsAutoPlaying(prev => !prev);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [imageList.length, goToPreviousImage, goToNextImage]);

  // Polling for "Live Mode" - fetch new images
  useEffect(() => {
    if (!minioConfig.accessKey || !minioConfig.secretKey || !minioConfig.bucket || !customer || !camera || !date) {
      return;
    }

    const fetchImages = async () => {
      try {
        const prefix = `${camera}/${date}/`;
        const response = await apiService.listImages({
          accessKey: minioConfig.accessKey,
          secretKey: minioConfig.secretKey,
          bucket: minioConfig.bucket,
          folder: minioConfig.folder,
          prefix
        });

        const currentCount = response.images.length;
        const lastCount = lastImageCountRef.current;

        // Update if we have more images than before, or it's the initial load
        if (currentCount > lastCount || (lastCount === 0 && currentCount > 0)) {
          console.log(`Image list updated: ${currentCount} images (was ${lastCount})`);
          setImageList(response.images);
          lastImageCountRef.current = currentCount;
          
          // Reset initialization flag if new images were added
          if (currentCount > lastCount && lastCount > 0) {
            hasInitializedRef.current = false;
            
            // In latest-only mode, immediately show the newest image and stop auto-play
            if (slideshowConfig.mode === 'latest-only' && response.images.length > 0) {
              // Images are sorted newest first, so index 0 is the latest
              const latestImage = response.images[0];
              const latestIndex = 0;
              
              // Only update if we're not already showing the latest image
              if (currentImageIndex !== latestIndex) {
                console.log(`Latest-only mode: Switching to newest image (${latestIndex + 1}/${response.images.length})`);
                setCurrentImageIndex(latestIndex);
                setRawImageUrl(buildImageUrl(latestImage.key));
                setAnalyzedImageUrl(null);
                setAnalysisText(null);
                setIsAutoPlaying(false); // Stop auto-play to show only the latest
                
                // Process new image with AI if enabled
                if (aiAnalysisConfig.enabled) {
                  processImageWithAI(latestImage.key);
                }
              }
            }
          }
        } else {
          // No new images detected, avoid unnecessary updates
          console.log(`No new images detected. Current count: ${currentCount}`);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // Initial fetch
    fetchImages();
    
    // Set up polling if enabled
    if (pollingConfig.enabled) {
      const intervalMs = pollingConfig.intervalSeconds * 1000;
      const interval = setInterval(fetchImages, intervalMs);
      pollIntervalRef.current = interval;
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [customer, camera, date, minioConfig, pollingConfig, clearImageState]);

  if (!user) {
    return <LoginScreen />;
  }

  // Show loading screen when settings are being loaded
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent-color)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: 'var(--text-primary)' }}>Loading user settings...</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Welcome back, {user.username}!</p>
      </div>
    );
  }

  return (
    <AppLayout toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen}>
      <Sidebar isOpen={isSidebarOpen} />

      <div className="main-layout" style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Main Content Area */}
        <div className="main-content" style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minWidth: 0, 
          overflow: 'hidden' 
        }}>
          <BreadcrumbNav
            onSelectionChange={handleSelectionChange}
          />

          <div style={{ 
            flex: 1, 
            overflow: 'hidden', 
            position: 'relative',
            minHeight: 0 
          }}>
            <SplitImageViewer
              rawImageUrl={rawImageUrl}
              processedImageUrl={analyzedImageUrl}
              isLoading={isProcessing}
              aiEnabled={aiAnalysisConfig.enabled}
            />
            
            {/* AI Processing indicator */}
            {isProcessing && aiAnalysisConfig.enabled && (
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(59, 130, 246, 0.9)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                zIndex: 15
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Processing with AI...
              </div>
            )}
            
            {/* Slideshow controls */}
            {slideshowConfig.showManualControls && imageList.length > 1 && (
              <div className="slideshow-controls" style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                left: '20px',
                right: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                pointerEvents: 'none',
                zIndex: 10
              }}>
                <button
                  onClick={goToPreviousImage}
                  style={{
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'auto',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.background = 'rgba(0, 0, 0, 0.9)'}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.background = 'rgba(0, 0, 0, 0.7)'}
                >
                  <ChevronLeft size={24} />
                </button>
                
                <button
                  onClick={goToNextImage}
                  style={{
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'auto',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.background = 'rgba(0, 0, 0, 0.9)'}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.background = 'rgba(0, 0, 0, 0.7)'}
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            )}

            {/* Slideshow status */}
            {imageList.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '25px',
                fontSize: '14px',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                minWidth: '200px',
                justifyContent: 'center'
              }}>
                <span>{currentImageIndex + 1} / {imageList.length}</span>
                
                {slideshowConfig.autoAdvance && (
                  <>
                    <button
                      onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '4px'
                      }}
                    >
                      {isAutoPlaying ? '⏸️' : '▶️'}
                    </button>
                    
                    {isAutoPlaying && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#4CAF50',
                        borderRadius: '50%',
                        animation: 'pulse 1.5s infinite'
                      }} />
                    )}
                  </>
                )}
                
                <div style={{
                  fontSize: '12px',
                  opacity: 0.8
                }}>
                  ← → keys | Space to pause
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="analytics-sidebar" style={{ 
          width: '320px',
          borderLeft: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <AnalyticsDashboard markdownContent={analysisText} />
        </div>
      </div>
    </AppLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <MainApp />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
