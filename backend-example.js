// Photo Illusions - Google Drive Uploader Backend
// This script is designed to be deployed on a service like Render.
// It creates a secure API endpoint that accepts an image file
// and uploads it to a specific Google Drive folder.

const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const stream = require('stream');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes to allow requests from your frontend
app.use(cors());

// Set up multer for in-memory file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
});

// Function to authenticate and get a Google Drive client
const getDriveClient = () => {
  // Scopes required for Google Drive API access
  const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
  
  // Check if credentials are in an environment variable
  if (!process.env.GOOGLE_CREDENTIALS_JSON) {
    throw new Error("The GOOGLE_CREDENTIALS_JSON environment variable is not set.");
  }
  
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);

  // Authenticate using the service account credentials
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
};

// Function to find or create a folder in Google Drive
const getFolderId = async (drive, folderName) => {
  if (!folderName) {
    throw new Error("TARGET_FOLDER_NAME environment variable not set.");
  }

  // Search for the folder
  const response = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
    fields: 'files(id, name)',
  });

  if (response.data.files.length > 0) {
    console.log(`Found folder '${folderName}' with ID: ${response.data.files[0].id}`);
    return response.data.files[0].id;
  } else {
    // If folder doesn't exist, create it
    console.log(`Folder '${folderName}' not found, creating it...`);
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });
    console.log(`Created folder with ID: ${folder.data.id}`);
    return folder.data.id;
  }
};

// The main upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    console.log(`Received file: ${req.file.originalname}, Size: ${req.file.size} bytes`);

    const drive = getDriveClient();
    const folderId = await getFolderId(drive, process.env.TARGET_FOLDER_NAME);

    // Create a buffer stream from the uploaded file's buffer
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    const fileMetadata = {
      name: req.file.originalname,
      parents: [folderId],
    };

    const media = {
      mimeType: req.file.mimetype,
      body: bufferStream,
    };

    // Upload the file to Google Drive
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name',
    });

    console.log('File uploaded successfully to Google Drive. File ID:', response.data.id);

    res.status(200).json({
      message: 'File uploaded successfully!',
      fileId: response.data.id,
      fileName: response.data.name,
    });
  } catch (error) {
    console.error('Error during file upload:', error);
    // Check for specific Google API errors
    if (error.response && error.response.data) {
        console.error('Google API Error:', error.response.data.error);
        return res.status(500).json({ message: 'Google API Error: ' + error.response.data.error.message });
    }
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('Photo Illusions Backend is running!');
});


app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});