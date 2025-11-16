"use client"

// محرر الأكواد المتقدم والحقيقي
class AdvancedCodeEditor {
  constructor() {
    this.editors = new Map()
    this.currentProject = null
    this.livePreview = null
    this.autoSave = true
    this.collaborationMode = false
    this.themes = {
      dark: "vs-dark",
      light: "vs",
      highContrast: "hc-black",
    }
    this.currentTheme = "dark"
    this.extensions = new Map()
    this.init()
  }

  async init() {
    // تحميل Monaco Editor
    await this.loadMonacoEditor()

    // إعداد الواجهة
    this.setupInterface()

    // تحميل الإضافات
    this.loadExtensions()

    // إعداد المعاينة المباشرة
    this.setupLivePreview()

    // إعداد نظام الملفات
    this.setupFileSystem()
  }

  async loadMonacoEditor() {
    return new Promise((resolve, reject) => {
      // تحميل Monaco Editor من CDN
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js"
      script.onload = () => {
        require.config({
          paths: {
            vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs",
          },
        })

        require(["vs/editor/editor.main"], () => {
          this.monaco = window.monaco
          this.setupMonacoConfiguration()
          resolve()
        })
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  setupMonacoConfiguration() {
    // إعداد اللغات المدعومة
    this.monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: this.monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: this.monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: this.monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: this.monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    })

    // إضافة تعريفات TypeScript للمكتبات الشائعة
    this.addTypeDefinitions()

    // إعداد التحقق من الأخطاء
    this.setupErrorChecking()

    // إعداد الإكمال التلقائي
    this.setupAutoCompletion()
  }

  addTypeDefinitions() {
    // إضافة تعريفات React
    const reactTypes = `
            declare module 'react' {
                export interface Component<P = {}, S = {}> {
                    props: P;
                    state: S;
                    render(): JSX.Element;
                }
                export function useState<T>(initial: T): [T, (value: T) => void];
                export function useEffect(effect: () => void, deps?: any[]): void;
                export function createElement(type: string, props?: any, ...children: any[]): JSX.Element;
            }
        `

    this.monaco.languages.typescript.typescriptDefaults.addExtraLib(
      reactTypes,
      "file:///node_modules/@types/react/index.d.ts",
    )

    // إضافة تعريفات DOM
    const domTypes = `
            declare var document: Document;
            declare var window: Window;
            declare var console: Console;
            declare function fetch(url: string, options?: any): Promise<Response>;
        `

    this.monaco.languages.typescript.typescriptDefaults.addExtraLib(
      domTypes,
      "file:///node_modules/@types/dom/index.d.ts",
    )
  }

  setupInterface() {
    const editorContainer = document.createElement("div")
    editorContainer.id = "advanced-code-editor"
    editorContainer.className = "advanced-editor-container"
    editorContainer.innerHTML = `
            <div class="editor-header">
                <div class="editor-tabs" id="editorTabs">
                    <!-- التبويبات ستظهر هنا -->
                </div>
                <div class="editor-controls">
                    <button class="control-btn" onclick="advancedCodeEditor.newFile()" title="ملف جديد">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="control-btn" onclick="advancedCodeEditor.openFile()" title="فتح ملف">
                        <i class="fas fa-folder-open"></i>
                    </button>
                    <button class="control-btn" onclick="advancedCodeEditor.saveFile()" title="حفظ">
                        <i class="fas fa-save"></i>
                    </button>
                    <button class="control-btn" onclick="advancedCodeEditor.togglePreview()" title="معاينة">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="control-btn" onclick="advancedCodeEditor.toggleTheme()" title="تغيير المظهر">
                        <i class="fas fa-palette"></i>
                    </button>
                    <button class="control-btn" onclick="advancedCodeEditor.showSettings()" title="الإعدادات">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
            </div>

            <div class="editor-body">
                <div class="editor-sidebar">
                    <div class="sidebar-section">
                        <h4>مستكشف الملفات</h4>
                        <div class="file-explorer" id="fileExplorer">
                            <!-- شجرة الملفات -->
                        </div>
                    </div>
                    
                    <div class="sidebar-section">
                        <h4>المكونات</h4>
                        <div class="components-panel" id="componentsPanel">
                            <!-- مكونات جاهزة -->
                        </div>
                    </div>
                </div>

                <div class="editor-main">
                    <div class="editor-workspace" id="editorWorkspace">
                        <!-- محرر الكود -->
                    </div>
                    
                    <div class="editor-preview" id="editorPreview" style="display: none;">
                        <div class="preview-header">
                            <span>المعاينة المباشرة</span>
                            <div class="preview-controls">
                                <button onclick="advancedCodeEditor.refreshPreview()">
                                    <i class="fas fa-sync"></i>
                                </button>
                                <button onclick="advancedCodeEditor.openInNewWindow()">
                                    <i class="fas fa-external-link-alt"></i>
                                </button>
                            </div>
                        </div>
                        <iframe id="previewFrame" class="preview-iframe"></iframe>
                    </div>
                </div>
            </div>

            <div class="editor-footer">
                <div class="status-bar">
                    <span id="editorStatus">جاهز</span>
                    <span id="cursorPosition">السطر 1، العمود 1</span>
                    <span id="fileEncoding">UTF-8</span>
                    <span id="languageMode">HTML</span>
                </div>
                
                <div class="editor-actions">
                    <button class="btn-primary" onclick="advancedCodeEditor.deployToDesign()">
                        <i class="fas fa-paint-brush"></i>
                        نشر للتصميم
                    </button>
                    <button class="btn-secondary" onclick="advancedCodeEditor.exportProject()">
                        <i class="fas fa-download"></i>
                        تصدير المشروع
                    </button>
                </div>
            </div>
        `

    // إضافة المحرر للصفحة
    const targetContainer = document.getElementById("code-editor-container") || document.body
    targetContainer.appendChild(editorContainer)

    this.addEditorStyles()
  }

  setupFileSystem() {
    this.fileSystem = {
      files: new Map(),
      currentProject: {
        name: "مشروع جديد",
        files: [
          { name: "index.html", type: "html", content: this.getDefaultHTML() },
          { name: "style.css", type: "css", content: this.getDefaultCSS() },
          { name: "script.js", type: "javascript", content: this.getDefaultJS() },
        ],
      },
    }

    this.loadProject()
  }

  getDefaultHTML() {
    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>متجري الجديد</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <header class="header">
        <nav class="navbar">
            <div class="container">
                <div class="nav-brand">
                    <h1>متجري</h1>
                </div>
                <ul class="nav-menu">
                    <li><a href="#home">الرئيسية</a></li>
                    <li><a href="#products">المنتجات</a></li>
                    <li><a href="#about">من نحن</a></li>
                    <li><a href="#contact">اتصل بنا</a></li>
                </ul>
            </div>
        </nav>
    </header>

    <main>
        <section class="hero" id="home">
            <div class="container">
                <div class="hero-content">
                    <h2>مرحباً بكم في متجرنا</h2>
                    <p>اكتشف أفضل المنتجات بأسعار مميزة</p>
                    <button class="btn-primary">تسوق الآن</button>
                </div>
            </div>
        </section>

        <section class="products" id="products">
            <div class="container">
                <h2>منتجاتنا المميزة</h2>
                <div class="products-grid">
                    <div class="product-card">
                        <img src="https://via.placeholder.com/300x200" alt="منتج 1">
                        <div class="product-info">
                            <h3>منتج رائع</h3>
                            <p class="price">299 ر.س</p>
                            <button class="btn-secondary">إضافة للسلة</button>
                        </div>
                    </div>
                    <!-- المزيد من المنتجات -->
                </div>
            </div>
        </section>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 متجري. جميع الحقوق محفوظة.</p>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`
  }

  getDefaultCSS() {
    return `/* الأنماط الأساسية */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Cairo', sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f8f9fa;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* الهيدر */
.header {
    background: #fff;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 1000;
}

.navbar {
    padding: 1rem 0;
}

.navbar .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-brand h1 {
    color: #667eea;
    font-size: 2rem;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: color 0.3s;
}

.nav-menu a:hover {
    color: #667eea;
}

/* القسم الرئيسي */
.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 5rem 0;
    text-align: center;
}

.hero-content h2 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.hero-content p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
}

/* الأزرار */
.btn-primary, .btn-secondary {
    padding: 1rem 2rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    text-decoration: none;
    display: inline-block;
}

.btn-primary {
    background: #fff;
    color: #667eea;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.btn-secondary {
    background: #667eea;
    color: white;
}

.btn-secondary:hover {
    background: #5a6fd8;
}

/* المنتجات */
.products {
    padding: 5rem 0;
}

.products h2 {
    text-align: center;
    margin-bottom: 3rem;
    font-size: 2.5rem;
    color: #333;
}

.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.product-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    transition: transform 0.3s;
}

.product-card:hover {
    transform: translateY(-5px);
}

.product-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.product-info {
    padding: 1.5rem;
}

.product-info h3 {
    margin-bottom: 0.5rem;
    color: #333;
}

.price {
    font-size: 1.5rem;
    font-weight: bold;
    color: #667eea;
    margin-bottom: 1rem;
}

/* الفوتر */
.footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem 0;
}

/* التجاوب */
@media (max-width: 768px) {
    .navbar .container {
        flex-direction: column;
        gap: 1rem;
    }
    
    .nav-menu {
        gap: 1rem;
    }
    
    .hero-content h2 {
        font-size: 2rem;
    }
    
    .products-grid {
        grid-template-columns: 1fr;
    }
}`
  }

  getDefaultJS() {
    return `// الكود الأساسي للمتجر
document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل المتجر بنجاح!');
    
    // إعداد التنقل السلس
    setupSmoothScrolling();
    
    // إعداد سلة التسوق
    setupShoppingCart();
    
    // إعداد البحث
    setupSearch();
});

// التنقل السلس
function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// سلة التسوق
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function setupShoppingCart() {
    const addToCartButtons = document.querySelectorAll('.btn-secondary');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            const productName = productCard.querySelector('h3').textContent;
            const productPrice = productCard.querySelector('.price').textContent;
            const productImage = productCard.querySelector('img').src;
            
            const product = {
                id: Date.now(),
                name: productName,
                price: productPrice,
                image: productImage,
                quantity: 1
            };
            
            addToCart(product);
        });
    });
}

function addToCart(product) {
    // البحث عن المنتج في السلة
    const existingProduct = cart.find(item => item.name === product.name);
    
    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        cart.push(product);
    }
    
    // حفظ السلة
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // إظهار رسالة نجاح
    showNotification('تم إضافة المنتج للسلة بنجاح!', 'success');
    
    // تحديث عداد السلة
    updateCartCounter();
}

function updateCartCounter() {
    const cartCounter = document.getElementById('cartCounter');
    if (cartCounter) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCounter.textContent = totalItems;
    }
}

// البحث
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterProducts(searchTerm);
        });
    }
}

function filterProducts(searchTerm) {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const productName = card.querySelector('h3').textContent.toLowerCase();
        
        if (productName.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// إظهار الإشعارات
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = \`notification notification-\${type}\`;
    notification.innerHTML = \`
        <div class="notification-content">
            <span>\${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    \`;
    
    // إضافة الأنماط إذا لم تكن موجودة
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = \`
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem;
                border-radius: 8px;
                color: white;
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
            }
            
            .notification-success {
                background: #10b981;
            }
            
            .notification-error {
                background: #ef4444;
            }
            
            .notification-info {
                background: #3b82f6;
            }
            
            .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
            }
            
            .notification button {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        \`;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // إزالة الإشعار تلقائياً بعد 5 ثوان
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// دوال إضافية للمتجر
function openCart() {
    // عرض سلة التسوق
    console.log('فتح سلة التسوق:', cart);
}

function checkout() {
    // عملية الدفع
    console.log('بدء عملية الدفع');
}`
  }

  loadProject() {
    // تحميل الملفات في المحرر
    this.fileSystem.currentProject.files.forEach((file) => {
      this.createEditor(file.name, file.type, file.content)
    })

    // تحديث مستكشف الملفات
    this.updateFileExplorer()

    // فتح أول ملف
    if (this.fileSystem.currentProject.files.length > 0) {
      this.openFile(this.fileSystem.currentProject.files[0].name)
    }
  }

  createEditor(fileName, language, content = "") {
    const editorContainer = document.createElement("div")
    editorContainer.id = `editor-${fileName}`
    editorContainer.className = "monaco-editor-container"
    editorContainer.style.display = "none"

    document.getElementById("editorWorkspace").appendChild(editorContainer)

    const editor = this.monaco.editor.create(editorContainer, {
      value: content,
      language: language,
      theme: this.currentTheme,
      automaticLayout: true,
      fontSize: 14,
      lineNumbers: "on",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      minimap: { enabled: true },
      wordWrap: "on",
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      glyphMargin: false,
      contextmenu: true,
      mouseWheelZoom: true,
      smoothScrolling: true,
      cursorBlinking: "blink",
      cursorSmoothCaretAnimation: true,
      renderWhitespace: "selection",
      renderControlCharacters: false,
      fontLigatures: true,
      suggest: {
        showKeywords: true,
        showSnippets: true,
        showClasses: true,
        showFunctions: true,
        showVariables: true,
      },
    })

    // إعداد مستمعات الأحداث
    editor.onDidChangeModelContent(() => {
      this.onContentChange(fileName, editor.getValue())
      this.updateStatus("تم التعديل")
    })

    editor.onDidChangeCursorPosition((e) => {
      this.updateCursorPosition(e.position)
    })

    // حفظ المحرر
    this.editors.set(fileName, editor)

    // إضافة تبويب
    this.addTab(fileName, language)

    return editor
  }

  addTab(fileName, language) {
    const tabsContainer = document.getElementById("editorTabs")
    const tab = document.createElement("div")
    tab.className = "editor-tab"
    tab.dataset.file = fileName

    const languageIcon = this.getLanguageIcon(language)

    tab.innerHTML = `
            <span class="tab-icon">${languageIcon}</span>
            <span class="tab-name">${fileName}</span>
            <button class="tab-close" onclick="advancedCodeEditor.closeFile('${fileName}')">×</button>
        `

    tab.addEventListener("click", (e) => {
      if (!e.target.classList.contains("tab-close")) {
        this.openFile(fileName)
      }
    })

    tabsContainer.appendChild(tab)
  }

  getLanguageIcon(language) {
    const icons = {
      html: '<i class="fab fa-html5" style="color: #e34c26;"></i>',
      css: '<i class="fab fa-css3-alt" style="color: #1572b6;"></i>',
      javascript: '<i class="fab fa-js" style="color: #f7df1e;"></i>',
      typescript: '<i class="fab fa-js" style="color: #3178c6;"></i>',
      json: '<i class="fas fa-code" style="color: #000000;"></i>',
    }
    return icons[language] || '<i class="fas fa-file-code"></i>'
  }

  openFile(fileName) {
    // إخفاء جميع المحررات
    document.querySelectorAll(".monaco-editor-container").forEach((container) => {
      container.style.display = "none"
    })

    // إزالة التبويب النشط
    document.querySelectorAll(".editor-tab").forEach((tab) => {
      tab.classList.remove("active")
    })

    // إظهار المحرر المطلوب
    const editorContainer = document.getElementById(`editor-${fileName}`)
    if (editorContainer) {
      editorContainer.style.display = "block"

      // تفعيل التبويب
      const tab = document.querySelector(`[data-file="${fileName}"]`)
      if (tab) {
        tab.classList.add("active")
      }

      // تحديث شريط الحالة
      const file = this.fileSystem.currentProject.files.find((f) => f.name === fileName)
      if (file) {
        this.updateLanguageMode(file.type)
      }

      // إعادة تحجيم المحرر
      const editor = this.editors.get(fileName)
      if (editor) {
        editor.layout()
        editor.focus()
      }
    }
  }

  onContentChange(fileName, content) {
    // تحديث محتوى الملف
    const file = this.fileSystem.currentProject.files.find((f) => f.name === fileName)
    if (file) {
      file.content = content
    }

    // الحفظ التلقائي
    if (this.autoSave) {
      this.saveProject()
    }

    // تحديث المعاينة المباشرة
    if (this.livePreview) {
      this.updateLivePreview()
    }

    // تحديث التبويب لإظهار التغييرات غير المحفوظة
    const tab = document.querySelector(`[data-file="${fileName}"]`)
    if (tab && !tab.classList.contains("modified")) {
      tab.classList.add("modified")
      const tabName = tab.querySelector(".tab-name")
      if (tabName && !tabName.textContent.includes("●")) {
        tabName.textContent += " ●"
      }
    }
  }

  setupLivePreview() {
    this.livePreview = true
    this.updateLivePreview()
  }

  updateLivePreview() {
    if (!this.livePreview) return

    const htmlFile = this.fileSystem.currentProject.files.find((f) => f.type === "html")
    const cssFile = this.fileSystem.currentProject.files.find((f) => f.type === "css")
    const jsFile = this.fileSystem.currentProject.files.find((f) => f.type === "javascript")

    if (!htmlFile) return

    let htmlContent = htmlFile.content

    // حقن CSS
    if (cssFile && cssFile.content) {
      const cssTag = `<style>${cssFile.content}</style>`
      if (htmlContent.includes("</head>")) {
        htmlContent = htmlContent.replace("</head>", `${cssTag}\n</head>`)
      } else {
        htmlContent = `<head>${cssTag}</head>${htmlContent}`
      }
    }

    // حقن JavaScript
    if (jsFile && jsFile.content) {
      const jsTag = `<script>${jsFile.content}</script>`
      if (htmlContent.includes("</body>")) {
        htmlContent = htmlContent.replace("</body>", `${jsTag}\n</body>`)
      } else {
        htmlContent += jsTag
      }
    }

    // تحديث iframe المعاينة
    const previewFrame = document.getElementById("previewFrame")
    if (previewFrame) {
      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      previewFrame.src = url

      previewFrame.onload = () => {
        URL.revokeObjectURL(url)
      }
    }
  }

  togglePreview() {
    const previewPanel = document.getElementById("editorPreview")
    const workspace = document.getElementById("editorWorkspace")

    if (previewPanel.style.display === "none") {
      previewPanel.style.display = "block"
      workspace.style.width = "50%"
      previewPanel.style.width = "50%"
      this.updateLivePreview()
    } else {
      previewPanel.style.display = "none"
      workspace.style.width = "100%"
    }

    // إعادة تحجيم المحررات
    this.editors.forEach((editor) => {
      editor.layout()
    })
  }

  deployToDesign() {
    // نشر الكود إلى قسم التصميم للتعديل المرئي
    const htmlFile = this.fileSystem.currentProject.files.find((f) => f.type === "html")
    const cssFile = this.fileSystem.currentProject.files.find((f) => f.type === "css")
    const jsFile = this.fileSystem.currentProject.files.find((f) => f.type === "javascript")

    if (!htmlFile) {
      this.showNotification("يجب وجود ملف HTML للنشر", "error")
      return
    }

    // إنشاء مشروع تصميم
    const designProject = {
      id: Date.now(),
      name: this.fileSystem.currentProject.name,
      type: "custom_code",
      html: htmlFile.content,
      css: cssFile ? cssFile.content : "",
      js: jsFile ? jsFile.content : "",
      createdAt: new Date().toISOString(),
      isFromCodeEditor: true,
    }

    // حفظ المشروع في قسم التصميم
    localStorage.setItem("activeDesignProject", JSON.stringify(designProject))
    localStorage.setItem("customDesignFromCode", JSON.stringify(designProject))

    // إظهار رسالة نجاح
    this.showNotification("تم نشر المشروع لقسم التصميم بنجاح!", "success")

    // إظهار نافذة تأكيد للانتقال
    this.showDeployConfirmation()
  }

  showDeployConfirmation() {
    const modal = document.createElement("div")
    modal.className = "deploy-confirmation-overlay"
    modal.innerHTML = `
            <div class="deploy-confirmation-modal">
                <div class="confirmation-header">
                    <h3>🎨 تم النشر بنجاح!</h3>
                </div>
                
                <div class="confirmation-content">
                    <p>تم نشر مشروعك إلى قسم التصميم بنجاح.</p>
                    <p>يمكنك الآن التعديل عليه بصرياً باستخدام أدوات التصميم المتقدمة.</p>
                    
                    <div class="design-features">
                        <h4>ما يمكنك فعله في قسم التصميم:</h4>
                        <ul>
                            <li>✨ تعديل النصوص بالنقر المباشر</li>
                            <li>🎨 تغيير الألوان والخطوط</li>
                            <li>📱 معاينة على جميع الأجهزة</li>
                            <li>🖼️ تغيير الصور بسهولة</li>
                            <li>⚡ تعديلات فورية ومباشرة</li>
                        </ul>
                    </div>
                </div>
                
                <div class="confirmation-actions">
                    <button class="btn-secondary" onclick="this.closest('.deploy-confirmation-overlay').remove()">
                        البقاء في المحرر
                    </button>
                    <button class="btn-primary" onclick="advancedCodeEditor.goToDesignSection()">
                        <i class="fas fa-paint-brush"></i>
                        الانتقال للتصميم
                    </button>
                </div>
            </div>
        `

    document.body.appendChild(modal)
    this.addDeployConfirmationStyles()
  }

  goToDesignSection() {
    // إغلاق النافذة
    document.querySelector(".deploy-confirmation-overlay")?.remove()

    // الانتقال لقسم التصميم
    if (window.platform && window.platform.navigateTo) {
      window.platform.navigateTo("design")
    } else if (window.dashboardManager && window.dashboardManager.switchSection) {
      window.dashboardManager.switchSection("design")
    } else {
      // طريقة بديلة للانتقال
      const designLink = document.querySelector('[href="#design"], [data-section="design"]')
      if (designLink) {
        designLink.click()
      }
    }
  }

  newFile() {
    const fileName = prompt("اسم الملف الجديد (مع الامتداد):")
    if (!fileName) return

    const extension = fileName.split(".").pop().toLowerCase()
    const language = this.getLanguageFromExtension(extension)

    // التحقق من عدم وجود الملف
    if (this.fileSystem.currentProject.files.find((f) => f.name === fileName)) {
      this.showNotification("الملف موجود بالفعل!", "error")
      return
    }

    // إنشاء الملف
    const newFile = {
      name: fileName,
      type: language,
      content: this.getDefaultContentForLanguage(language),
    }

    this.fileSystem.currentProject.files.push(newFile)
    this.createEditor(fileName, language, newFile.content)
    this.updateFileExplorer()
    this.openFile(fileName)

    this.showNotification(`تم إنشاء الملف ${fileName}`, "success")
  }

  getLanguageFromExtension(extension) {
    const languageMap = {
      html: "html",
      htm: "html",
      css: "css",
      js: "javascript",
      ts: "typescript",
      json: "json",
      xml: "xml",
      md: "markdown",
    }
    return languageMap[extension] || "plaintext"
  }

  getDefaultContentForLanguage(language) {
    const templates = {
      html: "<!DOCTYPE html>\n<html>\n<head>\n    <title>صفحة جديدة</title>\n</head>\n<body>\n    \n</body>\n</html>",
      css: "/* أنماط CSS جديدة */\n",
      javascript: '// كود JavaScript جديد\nconsole.log("مرحباً!");\n',
      json: '{\n    "name": "مشروع جديد"\n}',
    }
    return templates[language] || ""
  }

  saveFile() {
    this.saveProject()

    // إزالة علامة التعديل من جميع التبويبات
    document.querySelectorAll(".editor-tab.modified").forEach((tab) => {
      tab.classList.remove("modified")
      const tabName = tab.querySelector(".tab-name")
      if (tabName) {
        tabName.textContent = tabName.textContent.replace(" ●", "")
      }
    })

    this.showNotification("تم حفظ جميع الملفات", "success")
  }

  saveProject() {
    // حفظ المشروع في localStorage
    localStorage.setItem("currentCodeProject", JSON.stringify(this.fileSystem.currentProject))

    // حفظ نسخة احتياطية
    const backup = {
      project: this.fileSystem.currentProject,
      timestamp: new Date().toISOString(),
    }

    let backups = JSON.parse(localStorage.getItem("codeProjectBackups") || "[]")
    backups.unshift(backup)

    // الاحتفاظ بآخر 10 نسخ احتياطية
    if (backups.length > 10) {
      backups = backups.slice(0, 10)
    }

    localStorage.setItem("codeProjectBackups", JSON.stringify(backups))
  }

  exportProject() {
    const projectData = {
      name: this.fileSystem.currentProject.name,
      files: this.fileSystem.currentProject.files,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `${this.fileSystem.currentProject.name}.json`
    a.click()

    URL.revokeObjectURL(url)
    this.showNotification("تم تصدير المشروع", "success")
  }

  updateFileExplorer() {
    const explorer = document.getElementById("fileExplorer")
    explorer.innerHTML = ""

    this.fileSystem.currentProject.files.forEach((file) => {
      const fileItem = document.createElement("div")
      fileItem.className = "file-item"
      fileItem.innerHTML = `
                <span class="file-icon">${this.getLanguageIcon(file.type)}</span>
                <span class="file-name">${file.name}</span>
                <div class="file-actions">
                    <button onclick="advancedCodeEditor.openFile('${file.name}')" title="فتح">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="advancedCodeEditor.deleteFile('${file.name}')" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `

      fileItem.addEventListener("dblclick", () => {
        this.openFile(file.name)
      })

      explorer.appendChild(fileItem)
    })
  }

  deleteFile(fileName) {
    if (confirm(`هل أنت متأكد من حذف الملف ${fileName}؟`)) {
      // حذف من المشروع
      this.fileSystem.currentProject.files = this.fileSystem.currentProject.files.filter((f) => f.name !== fileName)

      // حذف المحرر
      const editor = this.editors.get(fileName)
      if (editor) {
        editor.dispose()
        this.editors.delete(fileName)
      }

      // حذف التبويب
      const tab = document.querySelector(`[data-file="${fileName}"]`)
      if (tab) {
        tab.remove()
      }

      // حذف الحاوي
      const container = document.getElementById(`editor-${fileName}`)
      if (container) {
        container.remove()
      }

      // تحديث مستكشف الملفات
      this.updateFileExplorer()

      // فتح ملف آخر إذا كان متاحاً
      if (this.fileSystem.currentProject.files.length > 0) {
        this.openFile(this.fileSystem.currentProject.files[0].name)
      }

      this.showNotification(`تم حذف الملف ${fileName}`, "success")
    }
  }

  updateStatus(status) {
    const statusElement = document.getElementById("editorStatus")
    if (statusElement) {
      statusElement.textContent = status
    }
  }

  updateCursorPosition(position) {
    const positionElement = document.getElementById("cursorPosition")
    if (positionElement) {
      positionElement.textContent = `السطر ${position.lineNumber}، العمود ${position.column}`
    }
  }

  updateLanguageMode(language) {
    const languageElement = document.getElementById("languageMode")
    if (languageElement) {
      languageElement.textContent = language.toUpperCase()
    }
  }

  toggleTheme() {
    const themes = ["vs-dark", "vs", "hc-black"]
    const currentIndex = themes.indexOf(this.currentTheme)
    const nextIndex = (currentIndex + 1) % themes.length
    this.currentTheme = themes[nextIndex]

    // تطبيق المظهر على جميع المحررات
    this.editors.forEach((editor) => {
      this.monaco.editor.setTheme(this.currentTheme)
    })

    this.showNotification(`تم تغيير المظهر إلى ${this.currentTheme}`, "info")
  }

  showNotification(message, type = "info") {
    if (window.notificationSystem) {
      window.notificationSystem.show({
        title: "محرر الأكواد",
        message: message,
        type: type,
      })
    } else {
      // نظام إشعارات بسيط
      const notification = document.createElement("div")
      notification.className = `editor-notification ${type}`
      notification.textContent = message
      notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem;
                background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"};
                color: white;
                border-radius: 8px;
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
            `

      document.body.appendChild(notification)

      setTimeout(() => {
        notification.remove()
      }, 3000)
    }
  }

  addEditorStyles() {
    if (document.getElementById("advanced-editor-styles")) return

    const style = document.createElement("style")
    style.id = "advanced-editor-styles"
    style.textContent = `
            .advanced-editor-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #1e1e1e;
                color: #d4d4d4;
                display: flex;
                flex-direction: column;
                z-index: 9999;
                font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            }

            .editor-header {
                background: #2d2d2d;
                border-bottom: 1px solid #3e3e3e;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 1rem;
                height: 50px;
            }

            .editor-tabs {
                display: flex;
                gap: 2px;
                overflow-x: auto;
                flex: 1;
            }

            .editor-tab {
                background: #3c3c3c;
                border: 1px solid #3e3e3e;
                border-bottom: none;
                padding: 0.5rem 1rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                min-width: 120px;
                position: relative;
                transition: all 0.2s;
            }

            .editor-tab:hover {
                background: #404040;
            }

            .editor-tab.active {
                background: #1e1e1e;
                border-bottom: 2px solid #007acc;
            }

            .editor-tab.modified .tab-name {
                font-style: italic;
                color: #ffa500;
            }

            .tab-close {
                background: none;
                border: none;
                color: #d4d4d4;
                cursor: pointer;
                padding: 2px 4px;
                border-radius: 2px;
                margin-right: -4px;
            }

            .tab-close:hover {
                background: #e74c3c;
                color: white;
            }

            .editor-controls {
                display: flex;
                gap: 0.5rem;
            }

            .control-btn {
                background: #404040;
                border: 1px solid #3e3e3e;
                color: #d4d4d4;
                padding: 0.5rem;
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.2s;
            }

            .control-btn:hover {
                background: #505050;
                border-color: #007acc;
            }

            .editor-body {
                flex: 1;
                display: flex;
                overflow: hidden;
            }

            .editor-sidebar {
                width: 250px;
                background: #252526;
                border-right: 1px solid #3e3e3e;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
            }

            .sidebar-section {
                border-bottom: 1px solid #3e3e3e;
                padding: 1rem;
            }

            .sidebar-section h4 {
                margin: 0 0 1rem 0;
                color: #cccccc;
                font-size: 0.9rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .file-explorer {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }

            .file-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem;
                cursor: pointer;
                border-radius: 4px;
                transition: background 0.2s;
            }

            .file-item:hover {
                background: #2a2d2e;
            }

            .file-name {
                flex: 1;
                font-size: 0.9rem;
            }

            .file-actions {
                display: none;
                gap: 0.25rem;
            }

            .file-item:hover .file-actions {
                display: flex;
            }

            .file-actions button {
                background: none;
                border: none;
                color: #d4d4d4;
                cursor: pointer;
                padding: 2px 4px;
                border-radius: 2px;
                font-size: 0.8rem;
            }

            .file-actions button:hover {
                background: #404040;
            }

            .editor-main {
                flex: 1;
                display: flex;
                position: relative;
            }

            .editor-workspace {
                flex: 1;
                position: relative;
            }

            .monaco-editor-container {
                width: 100%;
                height: 100%;
            }

            .editor-preview {
                width: 50%;
                border-left: 1px solid #3e3e3e;
                display: flex;
                flex-direction: column;
            }

            .preview-header {
                background: #2d2d2d;
                padding: 0.5rem 1rem;
                border-bottom: 1px solid #3e3e3e;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .preview-controls {
                display: flex;
                gap: 0.5rem;
            }

            .preview-controls button {
                background: #404040;
                border: 1px solid #3e3e3e;
                color: #d4d4d4;
                padding: 0.25rem 0.5rem;
                cursor: pointer;
                border-radius: 4px;
                font-size: 0.8rem;
            }

            .preview-iframe {
                flex: 1;
                border: none;
                background: white;
            }

            .editor-footer {
                background: #007acc;
                color: white;
                padding: 0.5rem 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                height: 40px;
            }

            .status-bar {
                display: flex;
                gap: 2rem;
                font-size: 0.8rem;
            }

            .editor-actions {
                display: flex;
                gap: 1rem;
            }

            .btn-primary, .btn-secondary {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.8rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.2s;
            }

            .btn-primary {
                background: #0e639c;
                color: white;
            }

            .btn-primary:hover {
                background: #1177bb;
            }

            .btn-secondary {
                background: #3c3c3c;
                color: #d4d4d4;
            }

            .btn-secondary:hover {
                background: #505050;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `

    document.head.appendChild(style)
  }

  addDeployConfirmationStyles() {
    if (document.getElementById("deploy-confirmation-styles")) return

    const style = document.createElement("style")
    style.id = "deploy-confirmation-styles"
    style.textContent = `
            .deploy-confirmation-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 15000;
                backdrop-filter: blur(5px);
            }

            .deploy-confirmation-modal {
                background: white;
                border-radius: 16px;
                max-width: 500px;
                width: 90%;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                animation: modalSlideIn 0.3s ease-out;
            }

            .confirmation-header {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 2rem;
                text-align: center;
                border-radius: 16px 16px 0 0;
            }

            .confirmation-content {
                padding: 2rem;
            }

            .design-features {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 1.5rem;
                margin: 1.5rem 0;
            }

            .design-features h4 {
                margin-bottom: 1rem;
                color: #333;
            }

            .design-features ul {
                list-style: none;
                padding: 0;
            }

            .design-features li {
                padding: 0.5rem 0;
                color: #555;
            }

            .confirmation-actions {
                display: flex;
                gap: 1rem;
                margin-top: 2rem;
            }

            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
        `

    document.head.appendChild(style)
  }
}

// إنشاء مثيل عالمي
if (!window.advancedCodeEditor) {
  window.advancedCodeEditor = new AdvancedCodeEditor()
}
