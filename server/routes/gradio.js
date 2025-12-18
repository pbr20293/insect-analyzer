import express from 'express';
import multer from 'multer';
import { Client } from '@gradio/client';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Connect to Gradio endpoint
router.post('/connect', async (req, res) => {
  try {
    const { endpoint = 'https://vision.deltathings.com/' } = req.body;
    
    const client = await Client.connect(endpoint);
    
    res.json({ 
      success: true, 
      message: 'Connected to Gradio successfully',
      endpoint 
    });
  } catch (error) {
    console.error('Gradio connection failed:', error);
    res.status(500).json({ 
      error: 'Failed to connect to Gradio', 
      details: error.message 
    });
  }
});

// Process image with AI model
router.post('/process-image', upload.single('image'), async (req, res) => {
  try {
    const { 
      endpoint = 'https://vision.deltathings.com/',
      modelName = 'Generic Detection Model',
      confidence = 0.4,
      iou = 0.5
    } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    let client;
    try {
      client = await Client.connect(endpoint);
    } catch (connectError) {
      console.error('Gradio connection failed:', connectError.message);
      return res.status(503).json({ 
        error: 'Gradio service unavailable', 
        details: 'Cannot connect to AI processing service. Please try again later.' 
      });
    }
    
    // Convert buffer to blob
    const imageBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
    
    // Process the image
    const result = await client.predict("/process_image", {
      image: imageBlob,
      model_name: modelName,
      confidence: parseFloat(confidence),
      iou: parseFloat(iou),
    });

    console.log('Gradio result structure:', JSON.stringify(result, null, 2));

    // Extract image URL and analysis text from the result
    const processedImage = result.data[0];
    const analysisText = result.data[1];

    console.log('Processed image object:', processedImage);
    console.log('Analysis text:', analysisText);

    // The processed image should have a URL we can use
    let imageUrl = null;
    if (processedImage && processedImage.url) {
      imageUrl = processedImage.url;
      console.log('Using image URL:', imageUrl);
    } else if (processedImage && processedImage.path) {
      // If it's a local path, we might need to serve it differently
      // For now, assume the Gradio server provides a public URL
      imageUrl = processedImage.path;
      console.log('Using image path:', imageUrl);
    } else {
      console.log('No image URL or path found in result');
    }

    res.json({
      success: true,
      resultImage: imageUrl,
      analysisParams: analysisText
    });
    
  } catch (error) {
    console.error('Image processing failed:', error);
    res.status(500).json({ 
      error: 'Failed to process image', 
      details: error.message 
    });
  }
});

// Update model info
router.post('/update-model', async (req, res) => {
  try {
    const { 
      endpoint = 'https://vision.deltathings.com/',
      modelName = 'Generic Detection Model'
    } = req.body;
    
    const client = await Client.connect(endpoint);
    
    const result = await client.predict("/update_model_info", {
      model_name: modelName,
    });

    res.json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('Model update failed:', error);
    res.status(500).json({ 
      error: 'Failed to update model', 
      details: error.message 
    });
  }
});

export default router;