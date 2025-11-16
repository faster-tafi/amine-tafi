import React, { useState } from 'react';

interface AiCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
  error: string | null;
}

const AiCodeGenerator: React.FC<AiCodeGeneratorProps> = ({
  isOpen,
  onClose,
  onGenerate,
  isLoading,
  error,
}) => {
  const [prompt, setPrompt] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose} dir="rtl">
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6 border border-gray-700 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-indigo-400"></i>
            توليد الكود بالذكاء الاصطناعي
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <p className="text-gray-400 mb-4 text-sm">
          اكتب وصفاً للمكون أو الصفحة التي تريد إنشاءها، وسيقوم الذكاء الاصطناعي بكتابة الكود لك.
        </p>
        <form onSubmit={handleSubmit}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="مثال: قم بإنشاء صفحة تسجيل دخول تحتوي على حقلين للبريد الإلكتروني وكلمة المرور وزر تسجيل الدخول باللون الأزرق."
            className="w-full h-32 p-3 bg-gray-900 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white resize-none"
            disabled={isLoading}
          />
          {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري التوليد...
                </>
              ) : (
                'توليد الكود'
              )}
            </button>
          </div>
        </form>
      </div>
       <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AiCodeGenerator;
