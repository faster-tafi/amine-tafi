import React, { useState, useCallback, useMemo } from 'react';
import Header from './components/Header';
import FileExplorer from './components/FileExplorer';
import Editor from './components/Editor';
import StatusBar from './components/StatusBar';
import Preview from './components/Preview';
import AiCodeGenerator from './components/AiCodeGenerator';
import { generateCodeFromPrompt } from './services/geminiService';
import type { Project, EditorPosition, File } from './types';

const initialProject: Project = {
  name: 'مشروع متجر بسيط',
  files: [
    {
      name: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>متجري الإلكتروني</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <header>
        <h1>متجري</h1>
        <nav>
            <a href="#">الرئيسية</a>
            <a href="#">المنتجات</a>
            <a href="#">تواصل معنا</a>
        </nav>
    </header>
    <main>
        <section class="hero">
            <h2>أفضل المنتجات، بأفضل الأسعار</h2>
            <p>اكتشف تشكيلتنا الواسعة من المنتجات عالية الجودة.</p>
            <button>تسوق الآن</button>
        </section>
        <section class="products-grid">
            <!-- سيتم إضافة المنتجات هنا -->
        </section>
    </main>
    <footer>
        <p>&copy; 2024 متجري. جميع الحقوق محفوظة.</p>
    </footer>
    <script src="script.js"></script>
</body>
</html>`,
    },
    {
      name: 'style.css',
      language: 'css',
      content: `body {
    font-family: 'Cairo', sans-serif;
    margin: 0;
    background-color: #f4f4f9;
    color: #333;
}

header {
    background-color: #333;
    color: white;
    padding: 1rem;
    text-align: center;
}

nav a {
    color: white;
    margin: 0 15px;
    text-decoration: none;
}

.hero {
    text-align: center;
    padding: 50px 20px;
    background-color: #e2e8f0;
}

.hero button {
    background-color: #333;
    color: white;
    padding: 10px 20px;
    border: none;
    cursor: pointer;
    font-size: 1rem;
}

footer {
    text-align: center;
    padding: 20px;
    background-color: #333;
    color: white;
    position: fixed;
    bottom: 0;
    width: 100%;
}`,
    },
    {
      name: 'script.js',
      language: 'javascript',
      content: `console.log('مرحباً بك في متجرك!');`,
    },
  ],
};

const App: React.FC = () => {
  const [project, setProject] = useState<Project>(initialProject);
  const [activeFileName, setActiveFileName] = useState<string>('index.html');
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [position, setPosition] = useState<EditorPosition>({ lineNumber: 1, column: 1 });
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const activeFile = useMemo(
    () => project.files.find((file) => file.name === activeFileName),
    [project.files, activeFileName]
  );

  const handleFileSelect = useCallback((fileName: string) => {
    setActiveFileName(fileName);
  }, []);

  const handleContentChange = useCallback((fileName: string, newContent: string) => {
    setProject((prevProject) => ({
      ...prevProject,
      files: prevProject.files.map((file) =>
        file.name === fileName ? { ...file, content: newContent } : file
      ),
    }));
  }, []);

  const handleCreateFile = useCallback(() => {
    const fileName = prompt('أدخل اسم الملف الجديد (مثال: new.js):');
    if (fileName && !project.files.some(f => f.name === fileName)) {
      const language = fileName.split('.').pop() === 'css' ? 'css' : fileName.split('.').pop() === 'js' ? 'javascript' : 'html';
      const newFile: File = { name: fileName, language, content: `// ${fileName}` };
      setProject(p => ({ ...p, files: [...p.files, newFile] }));
      setActiveFileName(fileName);
    } else if (fileName) {
      alert('اسم الملف موجود بالفعل.');
    }
  }, [project.files]);

  const handleDeleteFile = useCallback((fileName: string) => {
    if (['index.html', 'style.css', 'script.js'].includes(fileName)) {
      alert('لا يمكن حذف الملفات الأساسية.');
      return;
    }
    if (confirm(`هل أنت متأكد من حذف الملف ${fileName}؟`)) {
      setProject(p => ({ ...p, files: p.files.filter(f => f.name !== fileName) }));
      if (activeFileName === fileName) {
        setActiveFileName('index.html');
      }
    }
  }, [activeFileName]);

  const handleAiGenerate = async (prompt: string) => {
    setIsLoadingAi(true);
    setAiError(null);
    try {
      const result = await generateCodeFromPrompt(prompt);
      if (result) {
        setProject(prev => ({
            ...prev,
            files: prev.files.map(f => {
                if (f.name === 'index.html') return { ...f, content: result.html || f.content };
                if (f.name === 'style.css') return { ...f, content: result.css || f.content };
                if (f.name === 'script.js') return { ...f, content: result.javascript || f.content };
                return f;
            })
        }));
        setShowAiModal(false);
      } else {
        throw new Error("لم يتم إرجاع أي كود.");
      }
    } catch (err) {
      console.error(err);
      setAiError((err as Error).message || 'فشل توليد الكود. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoadingAi(false);
    }
  };


  return (
    <div className="flex flex-col h-screen bg-gray-800 text-gray-200" dir="ltr">
      <Header
        files={project.files}
        activeFileName={activeFileName}
        onFileSelect={handleFileSelect}
        onTogglePreview={() => setShowPreview(!showPreview)}
        onAiClick={() => setShowAiModal(true)}
        showPreview={showPreview}
      />
      <main className="flex flex-1 overflow-hidden">
        <FileExplorer
          project={project}
          activeFileName={activeFileName}
          onFileSelect={handleFileSelect}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative">
            {activeFile && (
              <Editor
                content={activeFile.content}
                language={activeFile.language}
                onContentChange={(newContent) => handleContentChange(activeFileName, newContent)}
                onPositionChange={setPosition}
              />
            )}
          </div>
          <StatusBar activeFile={activeFile} position={position} />
        </div>
        {showPreview && <Preview project={project} />}
      </main>
      {showAiModal && (
        <AiCodeGenerator
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          onGenerate={handleAiGenerate}
          isLoading={isLoadingAi}
          error={aiError}
        />
      )}
    </div>
  );
};

export default App;
