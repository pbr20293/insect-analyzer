import { Client } from "@gradio/client";

// Define the response type based on the user's docs
// Returns list of 2 elements: [0]: Result Image (Base64/URL?), [1]: Analysis Summary (Markdown string)
// Wait, the docs say [0] is type string (image component output), [1] is string (markdown component)
// In Gradio JS client, images often come back as Blob or data URL.
export interface DetectionResult {
    resultImage: string | Blob;
    analysisParams: string;
}

export const connectToGradio = async (endpoint: string = "https://vision.deltathings.com/") => {
    try {
        const client = await Client.connect(endpoint);
        return client;
    } catch (error) {
        console.error("Gradio Connection Error:", error);
        throw error;
    }
};

export const updateModelInfo = async (client: any, modelName: string) => {
    try {
        const result = await client.predict("/update_model_info", {
            model_name: modelName,
        });
        return result.data;
    } catch (error) {
        console.error("Error updating model info:", error);
        throw error;
    }
};

export const processImage = async (
    client: any,
    imageBlob: Blob,
    modelName: string,
    confidence: number,
    iou: number
) => {
    try {
        const result = await client.predict("/process_image", {
            image: imageBlob,
            model_name: modelName,
            confidence: confidence,
            iou: iou,
        });

        // result.data is array [image, markdown]
        return {
            resultImage: result.data[0],
            analysisParams: result.data[1]
        };
    } catch (error) {
        console.error("Error processing image:", error);
        throw error;
    }
};
