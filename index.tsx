
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
interface Submission {
  id: string;
  email: string;
  photo: string; // Can be a base64 data URL or a remote thumbnail link
  folderNumber: string;
}

// --- Icons ---
const CameraIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ClipboardIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LogoutIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// --- Services ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

async function generateEmailDraft(email: string, folderNumber: string): Promise<string> {
  try {
    const prompt = `
      You are a friendly assistant for "Photo Illusions", a professional event photography company.
      A customer with the email "${email}" has requested a digital copy of their photo. Their photo is from folder number "${folderNumber}".
      Generate a short, professional, and friendly email body for them. 
      Mention that their photo is attached and thank them for choosing Photo Illusions at the event.
      Do not include a subject line or signature, only the body of the email.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating email draft:", error);
    throw new Error("Failed to generate email draft. Please check your API key and network connection.");
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
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

async function uploadToDrive(photoDataUrl: string, email: string, folderNumber: string): Promise<{ success: boolean; message: string }> {
  console.log('Starting upload process...');
  const backendUrl = 'http://localhost:3001/upload';
  
  const fileName = `${email}-${folderNumber}-${Date.now()}.jpg`;
  const imageBlob = dataUrlToBlob(photoDataUrl);
  
  const formData = new FormData();
  formData.append('file', imageBlob, fileName);
  formData.append('email', email);
  formData.append('folderNumber', folderNumber);
  
  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData, 
    });

    if (!response.ok) {
      let serverMessage;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message;
      } catch {
        serverMessage = await response.text();
      }
      throw new Error(serverMessage || `Upload failed with status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Upload successful:', result);
    return { success: true, message: 'Upload successful!' };

  } catch (error) {
    console.error("Error uploading to drive:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred. Please check your connection and try again.';
    return { success: false, message: errorMessage };
  }
}

// --- Components ---
interface CameraProps {
  onCapture: (imageDataUrl: string) => void;
  onClose: () => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please ensure permissions are granted.");
        onClose();
      }
    };
    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onClose]);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(dataUrl);
      }
    }
  }, [onCapture]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
      <div className="relative w-full max-w-2xl aspect-[4/3] bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
        <canvas ref={canvasRef} className="hidden"></canvas>
      </div>
      <div className="flex items-center space-x-4 mt-6">
        <button
          onClick={handleCapture}
          className="p-4 bg-blue-600 rounded-full text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-transform transform hover:scale-110"
          aria-label="Capture photo"
        >
          <CameraIcon className="w-8 h-8" />
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

interface LoginProps {
  onLogin: (password: string) => boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);
    
    setTimeout(() => {
      const success = onLogin(password);
      if (!success) {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
      setIsLoggingIn(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Dashboard Access
          </h1>
          <p className="text-gray-400 mt-2">Enter the password to continue.</p>
        </header>
        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoFocus
              className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              aria-label="Password"
            />
            
            {error && (
              <div className="text-red-400 text-sm text-center" role="alert">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoggingIn || !password}
              className="w-full px-5 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-800 transition-colors flex items-center justify-center"
            >
              {isLoggingIn ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verifying...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

interface EmailModalProps {
  entry: Submission | null;
  emailBody: string;
  onClose: () => void;
}

const EmailModal: React.FC<EmailModalProps> = ({ entry, emailBody, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!entry) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="email-modal-title">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full text-white" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 id="email-modal-title" className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Email Draft Generated</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-400">For: <span className="font-medium text-gray-200">{entry.email}</span></p>
            <p className="text-sm text-gray-400">Folder: <span className="font-medium text-gray-200">{entry.folderNumber}</span></p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 whitespace-pre-wrap text-gray-300 font-mono text-sm max-h-80 overflow-y-auto">
            {emailBody}
          </div>
        </div>
        <div className="p-4 bg-gray-900/50 rounded-b-xl flex justify-end">
          <button
            onClick={handleCopy}
            className="flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 transition-colors"
          >
            <ClipboardIcon className="w-4 h-4 mr-2" />
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface EntryCardProps {
  entry: Submission;
  onDelete: (id: string) => void;
  onGenerateEmail: (email: string, folderNumber: string) => void;
  isGenerating: boolean;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, onDelete, onGenerateEmail, isGenerating }) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 duration-300">
      <img src={entry.photo} alt={`Photo for ${entry.email}`} className="w-full h-48 object-cover" />
      <div className="p-4">
        <p className="text-sm text-gray-300 truncate font-mono" title={entry.email}>{entry.email}</p>
        <p className="text-xs text-gray-400 mt-1 font-mono">Folder: {entry.folderNumber}</p>
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => onGenerateEmail(entry.email, entry.folderNumber)}
            disabled={isGenerating}
            className="flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:ring-4 focus:outline-none focus:ring-purple-300 disabled:bg-purple-400 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <SparklesIcon className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'Email Draft'}
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Delete entry"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const BACKEND_BASE_URL = 'http://localhost:3001';
const ADMIN_PASSWORD = 'photo-admin-2024';

const Dashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('isAuthenticated') === 'true');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
        setIsLoading(false);
        return;
    }
      
    const fetchSubmissions = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const response = await fetch(`${BACKEND_BASE_URL}/submissions`);
        if (!response.ok) {
          throw new Error('Failed to fetch submissions. Please ensure the backend is running.');
        }
        const data = await response.json();
        setSubmissions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [isAuthenticated]);

  const handleLogin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setSubmissions([]); 
  };
  
  const handleGenerateEmail = async (email: string, folderNumber: string) => {
    const entry = submissions.find(s => s.email === email && s.folderNumber === folderNumber);
    if (!entry) return;

    setGeneratingId(entry.id);
    setError(null);

    try {
      const draft = await generateEmailDraft(email, folderNumber);
      setGeneratedEmail(draft);
      setSelectedEntry(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this entry?')) return;
    
    const originalSubmissions = [...submissions];
    setSubmissions(submissions.filter(s => s.id !== id));
    
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/submissions/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete the submission on the server.');
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not delete submission.');
        setSubmissions(originalSubmissions);
    }
  };

  const closeModal = () => {
    setGeneratedEmail(null);
    setSelectedEntry(null);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
            <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
      );
    }

    if (submissions.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {submissions.map(entry => (
            <EntryCard 
              key={entry.id}
              entry={entry} 
              onDelete={() => handleDelete(entry.id)}
              onGenerateEmail={handleGenerateEmail}
              isGenerating={generatingId === entry.id}
            />
          ))}
        </div>
      );
    }
    
    return (
        <div className="text-center py-16 px-6 bg-gray-800 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-300">No Submissions Yet</h2>
          <p className="text-gray-500 mt-2">When customers submit their details, they will appear here.</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {generatedEmail && selectedEntry && (
        <EmailModal entry={selectedEntry} emailBody={generatedEmail} onClose={closeModal} />
      )}
      <div className="container mx-auto p-4 md:p-8">
        <header className="relative text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Photo Illusions Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Manage customer photo submissions.</p>
          <button
            onClick={handleLogout}
            className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Log out"
          >
            <LogoutIcon className="w-6 h-6" />
          </button>
        </header>
        
        {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center mb-6 max-w-2xl mx-auto" role="alert">
                <p className="font-bold">Error</p>
                <p className="text-sm">{error}</p>
            </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
};

const CheckIcon: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CustomerForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [folderNumber, setFolderNumber] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCapture = (imageDataUrl: string) => {
    setCapturedImage(imageDataUrl);
    setIsCameraOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !capturedImage || !folderNumber) {
      alert('Please fill out all fields and take a photo.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await uploadToDrive(capturedImage, email, folderNumber);
      if (!result.success) {
        throw new Error(result.message);
      }
      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm">
            <CheckIcon className="w-20 h-20 text-green-400 mb-6" />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-3">
                Thank You!
            </h1>
            <p className="text-gray-300 mb-2">Your information has been received.</p>
            <p className="text-gray-400 text-sm">A digital copy of your photo will be sent to <span className="font-semibold text-white">{email}</span> soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {isCameraOpen && <Camera onCapture={handleCapture} onClose={() => setIsCameraOpen(false)} />}
      
      <div className="container mx-auto p-4 md:p-8 max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Photo Illusions
          </h1>
          <p className="text-gray-400 mt-2">Enter your details to receive your digital photo.</p>
        </header>

        <div className="bg-gray-800 p-6 rounded-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@email.com"
              required
              className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              aria-label="Customer Email"
            />
            
            <input
              type="text"
              value={folderNumber}
              onChange={(e) => setFolderNumber(e.target.value)}
              placeholder="Folder Number (on your print)"
              required
              className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              aria-label="Folder Number"
            />

            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="w-full flex items-center justify-center px-5 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-800 transition-transform transform hover:scale-105"
              >
                <CameraIcon className="w-5 h-5 mr-2" />
                {capturedImage ? 'Retake Photo of Print' : 'Take Photo of Print'}
              </button>
              
              {capturedImage && (
                <div className="p-2 bg-gray-700 rounded-lg">
                  <img src={capturedImage} alt="Captured thumbnail" className="w-24 h-24 object-cover rounded-md border-2 border-green-500"/>
                </div>
              )}
            </div>

            {errorMessage && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center" role="alert">
                    <p className="font-bold">Submission Failed</p>
                    <p className="text-sm">{errorMessage}</p>
                </div>
            )}

            <button
              type="submit"
              disabled={!email || !capturedImage || !folderNumber || isSubmitting}
              className="w-full px-5 py-4 text-lg font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-green-800 transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                 <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Uploading...</span>
                 </>
              ) : (
                'Submit'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  switch (route) {
    case '#dashboard':
      return <Dashboard />;
    default:
      return <CustomerForm />;
  }
};

// --- App Initialization ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
