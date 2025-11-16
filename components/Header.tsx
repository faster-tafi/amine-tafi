import React from 'react';
import type { File } from '../types';

interface HeaderProps {
  files: File[];
  activeFileName: string;
  onFileSelect: (fileName: string) => void;
  onTogglePreview: () => void;
  onAiClick: () => void;
  showPreview: boolean;
}

const Header: React.FC<HeaderProps> = ({
  files,
  activeFileName,
  onFileSelect,
  onTogglePreview,
  onAiClick,
  showPreview,
}) => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 flex justify-between items-center" dir="rtl">
      <div className="flex items-center">
        {files.map((file) => (
          <button
            key={file.name}
            onClick={() => onFileSelect(file.name)}
            className={`px-4 py-2 text-sm transition-colors duration-200 ${
              activeFileName === file.name
                ? 'bg-gray-700 text-white border-b-2 border-indigo-400'
                : 'text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            {file.name}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 p-2">
         <button
          onClick={onAiClick}
          className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-indigo-500 rounded-md hover:opacity-90 transition-opacity"
        >
          <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
          توليد بالذكاء الاصطناعي
        </button>
        <button
          onClick={onTogglePreview}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            showPreview
              ? 'bg-indigo-500 text-white'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          <i className="fa-solid fa-eye mr-2"></i>
          معاينة مباشرة
        </button>
      </div>
    </header>
  );
};

export default React.memo(Header);