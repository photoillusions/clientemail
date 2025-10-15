
import React, { useState } from 'react';
import type { Submission } from '../types.ts';
import { EntryCard } from './EntryCard.tsx';
import { generateEmailDraft } from '../services/geminiService.ts';
import { EmailModal } from './EmailModal.tsx';

// Mock data - in a real app, this would come from an API
const initialSubmissions: Submission[] = [
  { id: '1', email: 'jane.doe@example.com', photo: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400&auto=format&fit=crop', folderNumber: 'A101' },
  { id: '2', email: 'john.smith@email.com', photo: 'https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?q=80&w=400&auto=format&fit=crop', folderNumber: 'B203' },
  { id: '3', email: 'samantha.jones@web.com', photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=400&auto=format&fit=crop', folderNumber: 'C45' },
];

export const Dashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      setSubmissions(submissions.filter(s => s.id !== id));
    }
  };

  const closeModal = () => {
    setGeneratedEmail(null);
    setSelectedEntry(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {generatedEmail && selectedEntry && (
        <EmailModal entry={selectedEntry} emailBody={generatedEmail} onClose={closeModal} />
      )}
      <div className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Photo Illusions Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Manage customer photo submissions.</p>
        </header>
        
        {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center mb-6 max-w-2xl mx-auto" role="alert">
                <p className="font-bold">Error</p>
                <p className="text-sm">{error}</p>
            </div>
        )}

        {submissions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {submissions.map(entry => (
              <EntryCard 
                key={entry.id}
                entry={entry} 
                onDelete={handleDelete}
                onGenerateEmail={handleGenerateEmail}
                isGenerating={generatingId === entry.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-6 bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-300">No Submissions Yet</h2>
            <p className="text-gray-500 mt-2">When customers submit their details, they will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

