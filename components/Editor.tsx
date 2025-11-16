import React, { useRef, useEffect } from 'react';

declare const window: any;

interface EditorProps {
  content: string;
  language: string;
  onContentChange: (newContent: string) => void;
  onPositionChange: (position: { lineNumber: number; column: number }) => void;
}

const loadMonaco = (callback: () => void) => {
  if (window.monaco) {
    callback();
    return;
  }
  const loaderScript = document.createElement('script');
  loaderScript.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
  loaderScript.onload = () => {
    window.require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
    window.require(['vs/editor/editor.main'], () => {
      callback();
    });
  };
  document.body.appendChild(loaderScript);
};

const Editor: React.FC<EditorProps> = ({ content, language, onContentChange, onPositionChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoInstanceRef = useRef<any>(null);
  const subscriptionRef = useRef<any>(null);
  const positionSubscriptionRef = useRef<any>(null);

  useEffect(() => {
    loadMonaco(() => {
      if (editorRef.current && !monacoInstanceRef.current) {
        monacoInstanceRef.current = window.monaco.editor.create(editorRef.current, {
          value: content,
          language: language,
          theme: 'vs-dark',
          automaticLayout: true,
          fontSize: 14,
          wordWrap: 'on',
          minimap: { enabled: true },
        });

        subscriptionRef.current = monacoInstanceRef.current.onDidChangeModelContent(() => {
          const currentContent = monacoInstanceRef.current.getValue();
          onContentChange(currentContent);
        });
        
        positionSubscriptionRef.current = monacoInstanceRef.current.onDidChangeCursorPosition((e: any) => {
            onPositionChange(e.position);
        });
      }
    });

    return () => {
      subscriptionRef.current?.dispose();
      positionSubscriptionRef.current?.dispose();
      monacoInstanceRef.current?.dispose();
      monacoInstanceRef.current = null;
    };
  }, []); // Empty dependency array ensures this runs only once

  useEffect(() => {
    if (monacoInstanceRef.current) {
      if (monacoInstanceRef.current.getValue() !== content) {
        monacoInstanceRef.current.setValue(content);
      }
      window.monaco.editor.setModelLanguage(monacoInstanceRef.current.getModel(), language);
    }
  }, [content, language]);

  return <div ref={editorRef} className="w-full h-full"></div>;
};

export default React.memo(Editor);
