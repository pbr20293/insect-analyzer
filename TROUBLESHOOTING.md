# Troubleshooting Guide

## XML Parsing Error

If you see "DOMParser XML parsing error", this means the S3 client is receiving HTML instead of XML. Common causes:

### 1. Dev Server Not Restarted
**Solution**: After changing `vite.config.ts`, you MUST restart the dev server:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 2. Proxy Not Working
Test the proxy directly in your browser:
- Open: `http://localhost:5173/s3-proxy/`
- You should see MinIO XML response, NOT an HTML error page

### 3. Incorrect Endpoint
Verify your MinIO API endpoint:
- Should be: `minioapi.deltathings.com` (NOT `minio.deltathings.synology.me`)
- Check Settings sidebar in the app

### 4. CORS Still Blocking
If the proxy isn't catching requests, check browser console for:
- Network tab: Are requests going to `localhost:5173/s3-proxy/...`?
- If not, the client isn't using the proxy

### 5. MinIO Server Issues
- Verify the endpoint is accessible: `curl https://minioapi.deltathings.com`
- Check if it requires authentication at the proxy level
- Verify SSL certificate is valid

## Quick Fix Checklist
1. ✅ Restart dev server
2. ✅ Clear browser cache (Ctrl+Shift+R)
3. ✅ Check endpoint in Settings: `minioapi.deltathings.com`
4. ✅ Verify Access Key and Secret Key are correct
5. ✅ Check browser console for detailed error logs
