import React, { useState, useEffect } from 'react';
import type { Submission } from '../types.ts';
import { EntryCard } from './EntryCard.tsx';
import { generateEmailDraft } from '../services/geminiService.ts';
import { EmailModal } from './EmailModal.tsx';
import { Login } from './Login.tsx';
import { LogoutIcon } from './icons/LogoutIcon.tsx';

// This points to the local backend. For production, replace with your deployed service URL.
const BACKEND_BASE_URL = 'http://localhost:3001';

// This would typically be a more secure check, but for this example, a simple string comparison is fine.
const ADMIN_PASSWORD = 'photo-admin-2024';

export const Dashboard: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('isAuthenticated') === 'true');

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch data if authenticated
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
  }, [isAuthenticated]); // Re-run effect when authentication state changes

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
    // Clear data to prevent flash of old content on re-login
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
    // Optimistically update the UI
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
        // Revert the UI if the deletion fails
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
