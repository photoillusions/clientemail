
import React, { useState, useEffect } from 'react';
import { Camera } from './components/Camera.tsx';
import { CameraIcon } from './components/icons/CameraIcon.tsx';
import { uploadToDrive } from './services/googleDriveService.ts';
import { Dashboard } from './components/Dashboard.tsx';

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


export default App;
