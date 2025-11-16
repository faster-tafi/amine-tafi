import React, { useMemo } from 'react';
import type { Project } from '../types';

interface PreviewProps {
  project: Project;
}

const Preview: React.FC<PreviewProps> = ({ project }) => {
  const srcDoc = useMemo(() => {
    const htmlFile = project.files.find((f) => f.name === 'index.html');
    const cssFile = project.files.find((f) => f.name === 'style.css');
    const jsFile = project.files.find((f) => f.name === 'script.js');

    if (!htmlFile) {
      return '<!DOCTYPE html><html><head></head><body><p>ملف index.html غير موجود.</p></body></html>';
    }

    let html = htmlFile.content;

    if (cssFile) {
      html = html.replace('</head>', `<style>${cssFile.content}</style></head>`);
    }

    if (jsFile) {
      html = html.replace('</body>', `<script>${jsFile.content}</script></body>`);
    }

    return html;
  }, [project]);

  return (
    <div className="w-1/2 border-r border-gray-700 bg-white flex-shrink-0">
      <iframe
        srcDoc={srcDoc}
        title="preview"
        sandbox="allow-scripts"
        className="w-full h-full border-none"
      />
    </div>
  );
};

export default React.memo(Preview);
