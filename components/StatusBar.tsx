import React from 'react';
import type { File, EditorPosition } from '../types';

interface StatusBarProps {
  activeFile: File | undefined;
  position: EditorPosition;
}

const StatusBar: React.FC<StatusBarProps> = ({ activeFile, position }) => {
  return (
    <footer className="bg-gray-800 border-t border-gray-700 px-4 py-1 text-xs text-gray-400 flex justify-between items-center" dir="rtl">
      <div>
        <span>{activeFile?.language.toUpperCase() || 'N/A'}</span>
      </div>
      <div>
        <span>
          سطر {position.lineNumber}, عمود {position.column}
        </span>
      </div>
    </footer>
  );
};

export default React.memo(StatusBar);
