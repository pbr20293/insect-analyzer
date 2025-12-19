// Note: If you see "S3 API Requests must be made to API port", it means minio.deltathings... is pointing to the Console (WebUI).
// You need to find the specific URL for the S3 API (often on port 9000 or a different subdomain like 'api' or 's3').
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";
import { HttpRequest } from "@smithy/protocol-http";

// Helper to create client dynamically based on config
export const createMinioClient = (config: {
    endPoint: string;
    accessKey: string;
    secretKey: string;
    useSSL: boolean;
}) => {
    // Check if we are running on localhost
    const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // Always use proxy on localhost to avoid CORS, unless user explicitly opted out (logic could be added later)
    // For now, if localhost, we Proxy.
    const needsProxy = isLocalhost;

    console.log(`[MinIO Client] Localhost: ${isLocalhost}, Endpoint: ${config.endPoint}, NeedsProxy: ${needsProxy}`);

    // DEFAULT: Use configured endpoint (for signing)
    const endpointUrl = `http${config.useSSL ? 's' : ''}://${config.endPoint}`;

    const clientConfig: any = {
        endpoint: endpointUrl,
        region: "us-west",
        credentials: {
            accessKeyId: config.accessKey,
            secretAccessKey: config.secretKey,
        },
        forcePathStyle: true,
    };

    if (needsProxy) {
        console.log("Using Advanced Proxy Handler for MinIO");

        // Custom Handler that wraps FetchHttpHandler
        const defaultHandler = new FetchHttpHandler();

        clientConfig.requestHandler = {
            handle: async (request: HttpRequest, options: any) => {
                // Modify the request URL to point to the Proxy
                // BUT keep the Headers (including Host) intact for Signature validation.

                const proxyPath = '/s3-proxy';
                const originalPath = request.path;

                // Update request to target Proxy (Localhost)
                request.protocol = window.location.protocol;
                request.hostname = window.location.hostname;
                request.port = parseInt(window.location.port) || (window.location.protocol === 'https:' ? 443 : 80);
                request.path = proxyPath + originalPath;

                console.log("[Proxy Handler] Rewritten path:", request.path);

                // Note: The 'Host' header is ALREADY signed in 'request.headers'.
                // browser fetch() will replace it with localhost:5173 on the wire.
                // BUT Vite Proxy with changeOrigin:true will replace it back to the target host.
                // So MinIO receives the correct Host matching the signature.

                const response = await defaultHandler.handle(request, options);

                // Log response for debugging
                console.log("[Proxy Handler] Response status:", response.response.statusCode);
                console.log("[Proxy Handler] Response headers:", response.response.headers);

                // Try to peek at the body
                if (response.response.body) {
                    const bodyStream = response.response.body;
                    // Clone the stream so we can read it
                    const [stream1, stream2] = bodyStream.tee();
                    response.response.body = stream1;

                    try {
                        const reader = stream2.getReader();
                        const { value } = await reader.read();
                        if (value) {
                            const text = new TextDecoder().decode(value);
                            console.log("[Proxy Handler] Response body preview:", text.substring(0, 500));
                        }
                        reader.releaseLock();
                    } catch (e) {
                        console.error("[Proxy Handler] Could not read body:", e);
                    }
                }

                return response;
            }
        };
    }

    return new S3Client(clientConfig);
};

export interface FileItem {
    key: string;
    lastModified: Date;
    size: number;
    name: string;
}

export const listFolders = async (client: S3Client, bucket: string, prefix: string = '') => {
    const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        Delimiter: '/',
    });

    try {
        const response = await client.send(command);
        // Return subfolders (CommonPrefixes)
        return (response.CommonPrefixes || []).map(p => {
            const parts = p.Prefix?.split('/') || [];
            // The last part is empty because of trailing slash, so take second to last
            return parts[parts.length - 2];
        }).filter(Boolean);
    } catch (error: any) {
        console.error("Error listing folders:", error);

        // Try to extract response details
        console.error("Full error object:", JSON.stringify(error, null, 2));

        if (error?.message?.includes('XML parsing')) {
            throw new Error("Connection Failed: Received invalid response (HTML instead of XML). This usually means: 1) Dev server needs restart, 2) Proxy misconfigured, or 3) Wrong endpoint. Check Network tab in browser DevTools.");
        }

        if (error?.name === 'InvalidArgument' || error?.message?.includes('API port')) {
            throw new Error("Connection Failed: You are likely connected to the MinIO Web Console port. Please provide the S3 API endpoint.");
        }

        throw error;
    }
};

export const listImages = async (client: S3Client, bucket: string, prefix: string = '') => {
    const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
    });

    try {
        const response = await client.send(command);
        const contents = response.Contents || [];

        // Filter for images and map to FileItem
        return contents
            .filter(item => item.Key && /\.(jpg|jpeg|png|webp)$/i.test(item.Key))
            .map(item => ({
                key: item.Key!,
                lastModified: item.LastModified!,
                size: item.Size!,
                name: item.Key!.split('/').pop()!
            }))
            .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()); // Newest first
    } catch (error: any) {
        console.error("Error listing images:", error);
        if (error?.name === 'InvalidArgument' || error?.message?.includes('API port')) {
            throw new Error("Connection Failed: You are likely connected to the MinIO Web Console port. Please provide the S3 API endpoint (e.g., :9000 or s3.subdomain).");
        }
        throw error;
    }
};

export const getImageUrl = async (client: S3Client, bucket: string, key: string) => {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
    });
    // Create a presigned URL valid for 1 hour
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    // CORS Fix for Localhost: Rewrite URL to go through proxy
    if (typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('trapsnap.deltathings.com'))) {
        // Replace any MinIO endpoint with proxy
        const endpoint = (window as any).__MINIO_ENDPOINT__ || '192.168.86.3:8031';
        return signedUrl
            .replace(new RegExp(`https?://${endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), `${window.location.origin}/s3-proxy`)
            .replace(new RegExp(`https://minioapi\.deltathings\.synology\.me:1983`), `${window.location.origin}/s3-proxy`)
            .replace(new RegExp(`https://minioapi\.deltathings\.synology\.me`), `${window.location.origin}/s3-proxy`);
    }

    return signedUrl;
};

export const getImageBlob = async (client: S3Client, bucket: string, key: string): Promise<Blob> => {
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key
    });
    const response = await client.send(command);
    // response.Body is a ReadableStream in browser
    if (!response.Body) throw new Error("Empty body");

    // Convert Web Stream to Blob
    const byteArray = await response.Body.transformToByteArray();
    return new Blob([byteArray]);
};
