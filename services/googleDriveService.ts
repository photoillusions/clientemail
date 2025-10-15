import type { Submission } from '../types.ts';

/**
 * Converts a base64 data URL to a Blob object.
 * @param dataUrl The base64 data URL (e.g., "data:image/jpeg;base64,...").
 * @returns A Blob object representing the image.
 */
function dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    // The match is safe because a valid data URL will have this format.
    // We are getting the mime type from the data URL itself.
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
      throw new Error("Invalid data URL format");
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}


/**
 * Uploads a photo to a secure backend service, which then uploads it to Google Drive.
 * 
 * @param photoDataUrl The base64 encoded image data.
 * @param email The customer's email address.
 * @param folderNumber The folder number for the photo.
 */
export async function uploadToDrive(photoDataUrl: string, email: string, folderNumber: string): Promise<{ success: boolean; message: string }> {
  console.log('Starting upload process...');

  // IMPORTANT: Replace this URL with the real URL of your deployed backend service (e.g., from Render).
  const backendUrl = 'https://your-render-service-url.onrender.com/upload';

  const fileName = `${email.replace(/[^a-zA-Z0-9.-]/g, '_')}-${folderNumber}.jpg`;
  const imageBlob = dataUrlToBlob(photoDataUrl);
  
  const formData = new FormData();
  formData.append('file', imageBlob, fileName);
  
  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData, 
    });

    if (!response.ok) {
      let serverMessage;
      try {
        // Try to parse a JSON error message from the backend
        const errorData = await response.json();
        serverMessage = errorData.message;
      } catch {
        // If it's not JSON, it might be a plain text error
        serverMessage = await response.text();
      }
      // Throw an error with the specific message from the server if available
      throw new Error(serverMessage || `Upload failed with status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Upload successful:', result);
    return { success: true, message: 'Upload successful!' };

  } catch (error) {
    console.error("Error uploading to drive:", error);
    // Provide a more user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred. Please check your connection and try again.';
    return { success: false, message: errorMessage };
  }
}
