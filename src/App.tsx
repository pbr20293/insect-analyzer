import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { MinIOProvider, useMinIO } from './context/MinIOContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { AppLayout } from './components/layout/AppLayout';
import { Sidebar } from './components/layout/Sidebar';
import { BreadcrumbNav } from './components/navigation/BreadcrumbNav';
import { SplitImageViewer } from './components/viewer/SplitImageViewer';
import { AnalyticsDashboard } from './components/viewer/AnalyticsDashboard';
import { listImages, getImageUrl, getImageBlob } from './services/minioClient';
import { connectToGradio, processImage } from './services/gradioClient';

const MainApp = () => {
  const { user } = useAuth();
  const { client } = useMinIO();
  const { minioConfig, modelConfig } = useSettings();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Selection State
  const [customer, setCustomer] = useState('');
  const [camera, setCamera] = useState('');
  const [date, setDate] = useState('');

  // Image State
  const [currentImageKey, setCurrentImageKey] = useState<string | null>(null);
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null);
  const [analyzedImageUrl, setAnalyzedImageUrl] = useState<string | null>(null);
  const [analysisText, setAnalysisText] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);


  // Polling for "Live Mode"
  useEffect(() => {
    if (!client || !customer || !camera || !date) return;

    const fetchImages = async () => {
      try {
        const prefix = `${customer}/${camera}/${date}/`;
        const images = await listImages(client, minioConfig.bucket, prefix);

        // If we have no images, do nothing
        if (images.length === 0) return;

        // "Live Mode": Always verify if the LATEST image is different from current
        const latestImage = images[0]; // Sorted by new first

        if (latestImage.key !== currentImageKey) {
          console.log("New image detected:", latestImage.key);

          setCurrentImageKey(latestImage.key);
          // Trigger loading
          handleImageSelect(latestImage.key);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    // Initial fetch
    fetchImages();

    // Poll every 5 seconds
    const interval = setInterval(fetchImages, 5000);
    return () => clearInterval(interval);

  }, [client, customer, camera, date, minioConfig.bucket, currentImageKey]);


  const handleImageSelect = async (key: string) => {
    if (!client) return;
    setIsLoading(true);
    try {
      // 1. Get View URL
      const url = await getImageUrl(client, minioConfig.bucket, key);
      setRawImageUrl(url);

      // 2. Get Blob for Processing
      const blob = await getImageBlob(client, minioConfig.bucket, key);

      // 3. Connect & Process with Gradio
      // For efficiency, we should probably keep client in a ref or context, but connecting is usually fast/cached
      // Using a fresh connection for simplicity in prototype
      const gradioClient = await connectToGradio(minioConfig.endPoint.includes("deltathings") ? "https://vision.deltathings.com/" : undefined);

      const result = await processImage(
        gradioClient,
        blob,
        modelConfig.modelName,
        modelConfig.confidence,
        modelConfig.iou
      );

      setAnalyzedImageUrl(result.resultImage as string); // Assuming data URL or similar
      setAnalysisText(result.analysisParams);

    } catch (err) {
      console.error("Processing failed", err);
      setAnalysisText("Error processing image. Please checking console.");
    } finally {
      setIsLoading(false);
    }
  };


  if (!user) {
    return <LoginScreen />;
  }

  return (
    <AppLayout toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen}>
      <Sidebar isOpen={isSidebarOpen} />

      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <BreadcrumbNav
          onSelectionChange={(c, cam, d) => {
            setCustomer(c);
            setCamera(cam);
            setDate(d);
            // Reset View
            setRawImageUrl(null);
            setAnalyzedImageUrl(null);
            setAnalysisText(null);
            setCurrentImageKey(null);
          }}
        />

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <SplitImageViewer
            rawImageUrl={rawImageUrl}
            processedImageUrl={analyzedImageUrl}
            isLoading={isLoading}
          />
        </div>

        <AnalyticsDashboard markdownContent={analysisText} />
      </div>
    </AppLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <MinIOProvider>
          <MainApp />
        </MinIOProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
