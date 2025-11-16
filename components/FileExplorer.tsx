import React from 'react';
import type { Project } from '../types';

interface FileExplorerProps {
  project: Project;
  activeFileName: string;
  onFileSelect: (fileName: string) => void;
  onCreateFile: () => void;
  onDeleteFile: (fileName: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  project,
  activeFileName,
  onFileSelect,
  onCreateFile,
  onDeleteFile
}) => {
  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.html')) return <i className="fab fa-html5 text-orange-500 w-4"></i>;
    if (fileName.endsWith('.css')) return <i className="fab fa-css3-alt text-blue-500 w-4"></i>;
    if (fileName.endsWith('.js')) return <i className="fab fa-js-square text-yellow-400 w-4"></i>;
    return <i className="fas fa-file-alt text-gray-400 w-4"></i>;
  };
  
  return (
    <aside className="w-64 bg-gray-800 border-l border-gray-700 p-4 flex flex-col" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">مستكشف الملفات</h2>
        <button onClick={onCreateFile} className="text-gray-400 hover:text-white transition-colors" title="ملف جديد">
          <i className="fas fa-plus"></i>
        </button>
      </div>
      <ul>
        {project.files.map((file) => (
          <li key={file.name}>
            <button
              onClick={() => onFileSelect(file.name)}
              className={`w-full text-right px-3 py-2 rounded-md flex items-center gap-3 transition-colors text-sm ${
                activeFileName === file.name
                  ? 'bg-indigo-500/20 text-white'
                  : 'text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              {getFileIcon(file.name)}
              <span className="flex-1 truncate">{file.name}</span>
              {!['index.html', 'style.css', 'script.js'].includes(file.name) && (
                <span onClick={(e) => { e.stopPropagation(); onDeleteFile(file.name); }} className="text-gray-500 hover:text-red-400">
                  <i className="fas fa-trash-alt text-xs"></i>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default React.memo(FileExplorer);
