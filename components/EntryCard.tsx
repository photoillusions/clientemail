import React from 'react';
import type { Submission } from '../types.ts';
import { TrashIcon } from './icons/TrashIcon.tsx';
import { SparklesIcon } from './icons/SparklesIcon.tsx';

interface EntryCardProps {
  entry: Submission;
  onDelete: (id: string) => void;
  onGenerateEmail: (email: string, folderNumber: string) => void;
  isGenerating: boolean;
}

export const EntryCard: React.FC<EntryCardProps> = ({ entry, onDelete, onGenerateEmail, isGenerating }) => {
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
