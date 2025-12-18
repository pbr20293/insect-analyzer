// API service for communicating with the backend
// Always use relative URLs - Vite proxy handles dev, production uses same origin
const API_BASE = '';

export const getApiBase = () => API_BASE;

export interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  details?: string;
  data?: T;
}

export interface FileItem {
  key: string;
  lastModified: Date;
  size: number;
  name: string;
}

class ApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE}/api${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // MinIO API methods
  async testMinioConnection(credentials: {
    accessKey: string;
    secretKey: string;
    bucket?: string;
  }) {
    return this.request<ApiResponse<any>>('/minio/test-connection', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async listFolders(credentials: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    folder?: string;
    prefix?: string;
  }) {
    return this.request<{ folders: string[] }>('/minio/list-folders', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async listImages(credentials: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    folder?: string;
    prefix?: string;
  }) {
    return this.request<{ images: FileItem[] }>('/minio/list-images', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getImageUrl(credentials: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    key: string;
  }) {
    // Return direct URL to our image serving endpoint
    const url = `${API_BASE}/api/minio/image/${credentials.bucket}?key=${encodeURIComponent(credentials.key)}&accessKey=${encodeURIComponent(credentials.accessKey)}&secretKey=${encodeURIComponent(credentials.secretKey)}`;
    return { url };
  }

  async getImageBlob(credentials: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    key: string;
  }): Promise<Blob> {
    const url = `${API_BASE}/api/minio/image/${credentials.bucket}?key=${encodeURIComponent(credentials.key)}&accessKey=${encodeURIComponent(credentials.accessKey)}&secretKey=${encodeURIComponent(credentials.secretKey)}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    return await response.blob();
  }

  // Gradio API methods
  async connectToGradio(endpoint?: string) {
    return this.request<ApiResponse<any>>('/gradio/connect', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    });
  }

  async processImageWithGradio(
    imageBlob: Blob,
    options: {
      endpoint?: string;
      modelName?: string;
      confidence?: number;
      iou?: number;
    } = {}
  ) {
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.jpg');
    formData.append('endpoint', options.endpoint || 'https://vision.deltathings.com/');
    formData.append('modelName', options.modelName || 'Generic Detection Model');
    formData.append('confidence', String(options.confidence || 0.4));
    formData.append('iou', String(options.iou || 0.5));

    const url = `${API_BASE}/api/gradio/process-image`;
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData, // Don't set Content-Type for FormData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to process image');
    }

    return response.json();
  }
}

export const apiService = new ApiService();