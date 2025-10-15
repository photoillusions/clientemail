
import React, { useState } from 'react';
import type { Submission } from '../types.ts';
import { ClipboardIcon } from './icons/ClipboardIcon.tsx';
import { XIcon } from './icons/XIcon.tsx';

interface EmailModalProps {
  entry: Submission | null;
  emailBody: string;
  onClose: () => void;
}

export const EmailModal: React.FC<EmailModalProps> = ({ entry, emailBody, onClose }) => {
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
