import express from 'express';
import { getMinioClient } from '../config/minio.js';

const router = express.Router();

// Test MinIO connection
router.post('/test-connection', async (req, res) => {
  try {
    const { accessKey, secretKey, bucket } = req.body;
    
    if (!accessKey || !secretKey) {
      return res.status(400).json({ error: 'Access key and secret key are required' });
    }

    const client = getMinioClient({ accessKey, secretKey });
    
    // Test basic connection
    await client.listBuckets();
    
    let bucketExists = false;
    if (bucket) {
      bucketExists = await client.bucketExists(bucket);
    }

    res.json({ 
      success: true, 
      message: 'Connection successful',
      bucketExists
    });
  } catch (error) {
    console.error('MinIO connection test failed:', error);
    res.status(500).json({ 
      error: 'Connection failed', 
      details: error.message 
    });
  }
});

// List all available buckets
router.post('/list-buckets', async (req, res) => {
  try {
    const { accessKey, secretKey } = req.body;
    
    if (!accessKey || !secretKey) {
      return res.status(400).json({ error: 'Access key and secret key are required' });
    }

    const client = getMinioClient({ accessKey, secretKey });
    
    // List all buckets
    const buckets = await client.listBuckets();
    
    res.json({ 
      success: true, 
      buckets: buckets.map(bucket => ({
        name: bucket.name,
        creationDate: bucket.creationDate
      }))
    });
  } catch (error) {
    console.error('MinIO bucket listing failed:', error);
    res.status(500).json({ 
      error: 'Failed to list buckets', 
      details: error.message 
    });
  }
});

// List root folders/prefixes for a bucket
router.post('/list-root-folders', async (req, res) => {
  try {
    const { accessKey, secretKey, bucket } = req.body;
    
    if (!accessKey || !secretKey || !bucket) {
      return res.status(400).json({ error: 'Credentials and bucket are required' });
    }

    const client = getMinioClient({ accessKey, secretKey });
    
    // List top-level objects and folders
    const stream = client.listObjects(bucket, '', false);
    const folders = new Set();
    
    for await (const obj of stream) {
      if (obj.prefix) {
        // It's a folder - add the root part
        const rootFolder = obj.prefix.split('/')[0];
        if (rootFolder) {
          folders.add(rootFolder + '/');
        }
      } else if (obj.name) {
        // It's a file - get the root folder if it has one
        const parts = obj.name.split('/');
        if (parts.length > 1) {
          folders.add(parts[0] + '/');
        }
      }
    }
    
    res.json({ 
      success: true, 
      folders: Array.from(folders).sort()
    });
  } catch (error) {
    console.error('MinIO root folders listing failed:', error);
    res.status(500).json({ 
      error: 'Failed to list root folders', 
      details: error.message 
    });
  }
});

// List folders (customers/cameras/dates)
router.post('/list-folders', async (req, res) => {
  try {
    const { accessKey, secretKey, bucket, folder = '' } = req.body;
    
    if (!accessKey || !secretKey || !bucket) {
      return res.status(400).json({ error: 'Credentials and bucket are required' });
    }

    const client = getMinioClient({ accessKey, secretKey });
    
    // Construct the full prefix: base folder + specific prefix
    let fullPrefix = '';
    if (folder) {
      fullPrefix = folder.endsWith('/') ? folder : folder + '/';
    }
    if (req.body.prefix) {
      fullPrefix += req.body.prefix;
    }
    
    const stream = client.listObjects(bucket, fullPrefix, false);
    const folders = new Set();
    const allObjects = [];
    
    for await (const obj of stream) {
      allObjects.push(obj);
      
      // Handle both prefix (folders) and name (files) properties
      let objectPath = null;
      if (obj.prefix) {
        // It's a folder prefix
        objectPath = obj.prefix;
      } else if (obj.name) {
        // It's a file
        objectPath = obj.name;
      } else {
        console.log('Skipping invalid object:', obj);
        continue;
      }
      
      if (objectPath.endsWith('/')) {
        // It's a folder
        const folderName = objectPath.replace(fullPrefix, '').replace('/', '');
        if (folderName) {
          folders.add(folderName);
        }
      } else {
        // It's a file, extract folder from path
        const relativePath = objectPath.replace(fullPrefix, '');
        const parts = relativePath.split('/');
        if (parts.length > 1 && parts[0]) {
          folders.add(parts[0]);
        }
      }
    }

    console.log(`Found ${allObjects.length} total objects in bucket ${bucket}`);
    console.log('Sample objects:', allObjects.slice(0, 5));

    res.json({ folders: Array.from(folders).sort() });
  } catch (error) {
    console.error('Failed to list folders:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      bucket: req.body.bucket,
      prefix: req.body.prefix
    });
    res.status(500).json({ 
      error: 'Failed to list folders', 
      details: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// List images in a specific path
router.post('/list-images', async (req, res) => {
  try {
    const { accessKey, secretKey, bucket, folder = '', prefix = '' } = req.body;
    
    if (!accessKey || !secretKey || !bucket) {
      return res.status(400).json({ error: 'Credentials and bucket are required' });
    }

    // Construct full prefix: base folder + specific path + prefix
    let fullPrefix = '';
    if (folder) {
      fullPrefix = folder.endsWith('/') ? folder : folder + '/';
    }
    if (prefix) {
      fullPrefix += prefix;
    }

    const client = getMinioClient({ accessKey, secretKey });
    
    const stream = client.listObjects(bucket, fullPrefix, false);
    const images = [];
    
    for await (const obj of stream) {
      // Filter for image files
      if (/\.(jpg|jpeg|png|webp|bmp|gif|tiff)$/i.test(obj.name)) {
        images.push({
          key: obj.name,
          lastModified: obj.lastModified,
          size: obj.size,
          name: obj.name.split('/').pop()
        });
      }
    }

    // Sort by newest first
    images.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    res.json({ images });
  } catch (error) {
    console.error('Failed to list images:', error);
    res.status(500).json({ 
      error: 'Failed to list images', 
      details: error.message 
    });
  }
});

// Get presigned URL for image viewing
router.post('/get-image-url', async (req, res) => {
  try {
    const { accessKey, secretKey, bucket, key } = req.body;
    
    if (!accessKey || !secretKey || !bucket || !key) {
      return res.status(400).json({ error: 'All parameters are required' });
    }

    const client = getMinioClient({ accessKey, secretKey });
    
    // Generate presigned URL valid for 1 hour
    const url = await client.presignedUrl('GET', bucket, key, 3600);
    
    res.json({ url });
  } catch (error) {
    console.error('Failed to get image URL:', error);
    res.status(500).json({ 
      error: 'Failed to get image URL', 
      details: error.message 
    });
  }
});

// Get image as blob for processing
router.post('/get-image-blob', async (req, res) => {
  try {
    const { accessKey, secretKey, bucket, key } = req.body;
    
    if (!accessKey || !secretKey || !bucket || !key) {
      return res.status(400).json({ error: 'All parameters are required' });
    }

    const client = getMinioClient({ accessKey, secretKey });
    
    const chunks = [];
    const stream = await client.getObject(bucket, key);
    
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(buffer);
    });
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.status(500).json({ error: 'Failed to get image blob' });
    });
    
  } catch (error) {
    console.error('Failed to get image blob:', error);
    res.status(500).json({ 
      error: 'Failed to get image blob', 
      details: error.message 
    });
  }
});

// Serve images directly (proxy endpoint)
router.get('/image/:bucket', async (req, res) => {
  try {
    const { bucket } = req.params;
    const { key, accessKey, secretKey } = req.query;
    
    if (!accessKey || !secretKey || !bucket || !key) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const client = getMinioClient({ accessKey, secretKey });
    
    // Get object stream from MinIO
    const stream = await client.getObject(bucket, key);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg'); // Default to JPEG, could be more specific
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Pipe the stream directly to response
    stream.pipe(res);
    
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream image' });
      }
    });
    
  } catch (error) {
    console.error('Failed to serve image:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to serve image', 
        details: error.message 
      });
    }
  }
});

export default router;