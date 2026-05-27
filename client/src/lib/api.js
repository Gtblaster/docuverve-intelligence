import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1/pdf',
  timeout: 120000, // 2 minutes for large files
});

/**
 * Sends a multipart/form-data request to a DocuVerve processing endpoint.
 * @param {string} endpoint - API endpoint path (e.g. '/organize/merge')
 * @param {File[]} files - File objects to upload
 * @param {Record<string, unknown>} config - Additional form fields to append
 * @param {(progress: number) => void} [onProgress] - Upload progress callback (0-100)
 * @returns {Promise<{blob?: Blob, json?: object, headers: Record<string, string>}>}
 */
export async function processFiles(endpoint, files, config = {}, onProgress = null) {
  const formData = new FormData();

  // Append files under appropriate field names
  if (endpoint.includes('compare')) {
    formData.append('fileA', files[0]);
    if (files[1]) formData.append('fileB', files[1]);
  } else if (files.length === 1 && !endpoint.includes('merge')) {
    formData.append('file', files[0]);
  } else {
    files.forEach(f => formData.append('files', f));
  }

  // Append config fields, skipping null/empty values
  Object.entries(config).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
    }
  });

  const response = await api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
    onUploadProgress: (evt) => {
      if (onProgress && evt.total) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    },
  });

  // Detect JSON responses (intel endpoints return JSON, not binary)
  const contentType = response.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    const text = await response.data.text();
    return { json: JSON.parse(text), headers: response.headers };
  }

  return { blob: response.data, headers: response.headers };
}
