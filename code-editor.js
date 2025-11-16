// محرر الأكواد الذكي مع المعاينة المباشرة
class SmartCodeEditor {
    constructor() {
        this.currentCode = {
            html: '',
            css: '',
            javascript: ''
        };
        this.previewFrame = null;
        this.autoSave = true;
        this.snippetLibrary = this.initSnippetLibrary();
        this.versions = [];
        this.currentVersion = 0;
    }

    // إظهار محرر الأكواد
    showCodeEditor(storeId) {
        const modal = document.createElement('div');
        modal.className = 'code-editor-modal';
        modal.innerHTML = `
            <div class="code-editor-container">
                <div class="editor-header">
                    <div class="editor-title">
                        <i class="fas fa-code"></i>
                        محرر الأكواد المتقدم
                    </div>
                    <div class="editor-controls">
                        <button class="control-btn" onclick="codeEditor.showSnippetsLibrary()">
                            <i class="fas fa-puzzle-piece"></i> مكتبة الأكواد
                        </button>
                        <button class="control-btn" onclick="codeEditor.showVersionHistory()">
                            <i class="fas fa-history"></i> الإصدارات
                        </button>
                        <button class="control-btn" onclick="codeEditor.saveVersion()">
                            <i class="fas fa-save"></i> حفظ إصدار
                        </button>
                        <button class="close-btn" onclick="codeEditor.closeEditor()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <div class="editor-body">
                    <div class="editor-sidebar">
                        <div class="language-tabs">
                            <button class="lang-tab active" data-lang="html" onclick="codeEditor.switchLanguage('html', this)">
                                <i class="fab fa-html5"></i> HTML
                            </button>
                            <button class="lang-tab" data-lang="css" onclick="codeEditor.switchLanguage('css', this)">
                                <i class="fab fa-css3-alt"></i> CSS
                            </button>
                            <button class="lang-tab" data-lang="javascript" onclick="codeEditor.switchLanguage('javascript', this)">
                                <i class="fab fa-js"></i> JavaScript
                            </button>
                        </div>

                        <div class="code-tools">
                            <div class="tool-section">
                                <h4>أدوات التحرير</h4>
                                <button class="tool-btn" onclick="codeEditor.formatCode()">
                                    <i class="fas fa-magic"></i> تنسيق الكود
                                </button>
                                <button class="tool-btn" onclick="codeEditor.validateCode()">
                                    <i class="fas fa-check-circle"></i> فحص الأخطاء
                                </button>
                                <button class="tool-btn" onclick="codeEditor.minifyCode()">
                                    <i class="fas fa-compress"></i> ضغط الكود
                                </button>
                            </div>

                            <div class="tool-section">
                                <h4>إعدادات المحرر</h4>
                                <label class="setting-item">
                                    <input type="checkbox" id="autoSave" checked onchange="codeEditor.toggleAutoSave()">
                                    حفظ تلقائي
                                </label>
                                <label class="setting-item">
                                    <input type="checkbox" id="livePreview" checked onchange="codeEditor.toggleLivePreview()">
                                    معاينة مباشرة
                                </label>
                                <label class="setting-item">
                                    <input type="checkbox" id="syntaxHighlight" checked onchange="codeEditor.toggleSyntaxHighlight()">
                                    تلوين الكود
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="editor-main">
                        <div class="code-input-area">
                            <div class="input-header">
                                <span class="current-lang">HTML</span>
                                <div class="input-controls">
                                    <span class="line-count">السطر: <span id="lineNumber">1</span></span>
                                    <span class="char-count">الأحرف: <span id="charCount">0</span></span>
                                </div>
                            </div>
                            <textarea id="codeInput" class="code-textarea" placeholder="ابدأ بكتابة الكود هنا..."></textarea>
                        </div>

                        <div class="preview-area">
                            <div class="preview-header">
                                <span>المعاينة المباشرة</span>
                                <div class="preview-controls">
                                    <button class="preview-btn" onclick="codeEditor.refreshPreview()">
                                        <i class="fas fa-sync"></i> تحديث
                                    </button>
                                    <button class="preview-btn" onclick="codeEditor.openInNewWindow()">
                                        <i class="fas fa-external-link-alt"></i> فتح منفصل
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
                        <span id="lastSaved"></span>
                    </div>
                    <div class="action-buttons">
                        <button class="btn-secondary" onclick="codeEditor.discardChanges()">
                            تراجع عن التغييرات
                        </button>
                        <button class="btn-primary" onclick="codeEditor.applyChanges('${storeId}')">
                            <i class="fas fa-check"></i> تطبيق التغييرات
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupCodeEditor();
        this.loadExistingCode(storeId);
        this.addCodeEditorStyles();
    }

    setupCodeEditor() {
        const codeInput = document.getElementById('codeInput');
        const previewFrame = document.getElementById('previewFrame');
        
        this.previewFrame = previewFrame;
        this.currentStoreId = arguments[0];

        // إعداد مستمعات الأحداث
        codeInput.addEventListener('input', (e) => {
            this.handleCodeInput(e);
            this.updateLineNumbers();
            this.updateCharCount();
            
            if (document.getElementById('livePreview')?.checked) {
                this.updatePreview();
            }
            
            if (this.autoSave) {
                this.saveCurrentCode();
            }
        });

        // إعداد اختصارات لوحة المفاتيح
        codeInput.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // تحديث أولي للمعاينة
        this.updatePreview();
    }

    switchLanguage(lang, button) {
        // حفظ الكود الحالي
        const currentLang = document.querySelector('.lang-tab.active')?.dataset.lang;
        if (currentLang) {
            this.currentCode[currentLang] = document.getElementById('codeInput').value;
        }

        // تحديث واجهة التبويبات
        document.querySelectorAll('.lang-tab').forEach(tab => tab.classList.remove('active'));
        button.classList.add('active');

        // تحميل كود اللغة الجديدة
        document.getElementById('codeInput').value = this.currentCode[lang] || '';
        document.querySelector('.current-lang').textContent = lang.toUpperCase();

        // تحديث المعاينة
        if (document.getElementById('livePreview')?.checked) {
            this.updatePreview();
        }

        this.updateCharCount();
        this.updateLineNumbers();
    }

    handleCodeInput(e) {
        const textarea = e.target;
        const value = textarea.value;
        const currentLang = document.querySelector('.lang-tab.active')?.dataset.lang;
        
        // حفظ الكود الحالي
        this.currentCode[currentLang] = value;

        // إضافة الإكمال التلقائي
        this.handleAutoCompletion(textarea, e);
        
        // تحديث حالة المحرر
        document.getElementById('editorStatus').textContent = 'يتم التحرير...';
    }

    handleAutoCompletion(textarea, e) {
        const value = textarea.value;
        const cursorPos = textarea.selectionStart;
        const currentLang = document.querySelector('.lang-tab.active')?.dataset.lang;

        // إكمال تلقائي للعلامات HTML
        if (currentLang === 'html' && e.inputType === 'insertText' && e.data === '>') {
            const beforeCursor = value.substring(0, cursorPos);
            const tagMatch = beforeCursor.match(/<(\w+)(?:\s[^>]*)?$/);
            
            if (tagMatch && !this.isSelfClosingTag(tagMatch[1])) {
                const tagName = tagMatch[1];
                const closingTag = `</${tagName}>`;
                const newValue = value.substring(0, cursorPos) + closingTag + value.substring(cursorPos);
                
                textarea.value = newValue;
                textarea.setSelectionRange(cursorPos, cursorPos);
                
                this.currentCode[currentLang] = newValue;
            }
        }

        // إكمال تلقائي للأقواس CSS
        if (currentLang === 'css' && e.inputType === 'insertText' && e.data === '{') {
            const newValue = value.substring(0, cursorPos) + '\n    \n}' + value.substring(cursorPos);
            textarea.value = newValue;
            textarea.setSelectionRange(cursorPos + 5, cursorPos + 5);
            this.currentCode[currentLang] = newValue;
        }
    }

    isSelfClosingTag(tagName) {
        const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
        return selfClosingTags.includes(tagName.toLowerCase());
    }

    updatePreview() {
        if (!this.previewFrame) return;

        const html = this.currentCode.html || '';
        const css = this.currentCode.css || '';
        const js = this.currentCode.javascript || '';

        const previewContent = `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>معاينة مباشرة</title>
                <style>
                    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                    ${css}
                </style>
            </head>
            <body>
                ${html}
                <script>
                    try {
                        ${js}
                    } catch (error) {
                        console.error('خطأ في JavaScript:', error);
                    }
                </script>
            </body>
            </html>
        `;

        const blob = new Blob([previewContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        this.previewFrame.src = url;

        // تنظيف URL بعد التحميل
        this.previewFrame.onload = () => {
            URL.revokeObjectURL(url);
        };
    }

    showSnippetsLibrary() {
        const snippetsModal = document.createElement('div');
        snippetsModal.className = 'snippets-modal-overlay';
        snippetsModal.innerHTML = `
            <div class="snippets-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-puzzle-piece"></i> مكتبة الأكواد الجاهزة</h3>
                    <button class="close-btn" onclick="this.closest('.snippets-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="snippets-content">
                    <div class="snippets-categories">
                        ${this.renderSnippetCategories()}
                    </div>
                    <div class="snippets-list">
                        ${this.renderSnippetsList('navigation')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(snippetsModal);
        this.addSnippetsModalStyles();
    }

    initSnippetLibrary() {
        return {
            navigation: [
                {
                    name: 'شريط تنقل أفقي',
                    description: 'شريط تنقل عصري مع قائمة منسدلة',
                    language: 'html',
                    code: `<nav class="main-nav">
    <div class="nav-container">
        <div class="nav-logo">
            <img src="logo.png" alt="الشعار">
        </div>
        <ul class="nav-menu">
            <li><a href="#home">الرئيسية</a></li>
            <li><a href="#products">المنتجات</a></li>
            <li><a href="#about">من نحن</a></li>
            <li><a href="#contact">اتصل بنا</a></li>
        </ul>
        <div class="nav-toggle">
            <span></span>
            <span></span>
            <span></span>
        </div>
    </div>
</nav>`
                },
                {
                    name: 'أنماط شريط التنقل',
                    description: 'تصميم CSS للشريط التنقل',
                    language: 'css',
                    code: `.main-nav {
    background: #fff;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 1000;
}

.nav-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
    margin: 0;
    padding: 0;
}

.nav-menu a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    transition: color 0.3s;
}

.nav-menu a:hover {
    color: #007bff;
}`
                }
            ],
            components: [
                {
                    name: 'بطاقة منتج',
                    description: 'بطاقة عرض منتج مع صورة وسعر',
                    language: 'html',
                    code: `<div class="product-card">
    <div class="product-image">
        <img src="product.jpg" alt="المنتج">
        <div class="product-badge">جديد</div>
    </div>
    <div class="product-info">
        <h3 class="product-title">اسم المنتج</h3>
        <p class="product-description">وصف المنتج...</p>
        <div class="product-price">
            <span class="current-price">299 ر.س</span>
            <span class="old-price">399 ر.س</span>
        </div>
        <button class="add-to-cart">إضافة للسلة</button>
    </div>
</div>`
                }
            ],
            forms: [
                {
                    name: 'نموذج اتصال',
                    description: 'نموذج اتصال تفاعلي',
                    language: 'html',
                    code: `<form class="contact-form">
    <div class="form-group">
        <label for="name">الاسم</label>
        <input type="text" id="name" required>
    </div>
    <div class="form-group">
        <label for="email">البريد الإلكتروني</label>
        <input type="email" id="email" required>
    </div>
    <div class="form-group">
        <label for="message">الرسالة</label>
        <textarea id="message" rows="5" required></textarea>
    </div>
    <button type="submit">إرسال</button>
</form>`
                }
            ]
        };
    }

    renderSnippetCategories() {
        const categories = Object.keys(this.snippetLibrary);
        const categoryNames = {
            navigation: 'التنقل',
            components: 'المكونات',
            forms: 'النماذج'
        };

        return categories.map(category => `
            <button class="category-btn ${category === 'navigation' ? 'active' : ''}" 
                    onclick="codeEditor.showCategorySnippets('${category}', this)">
                ${categoryNames[category] || category}
            </button>
        `).join('');
    }

    renderSnippetsList(category) {
        const snippets = this.snippetLibrary[category] || [];
        
        return snippets.map(snippet => `
            <div class="snippet-item">
                <div class="snippet-header">
                    <h4>${snippet.name}</h4>
                    <span class="snippet-lang">${snippet.language.toUpperCase()}</span>
                </div>
                <p class="snippet-description">${snippet.description}</p>
                <div class="snippet-actions">
                    <button class="btn-view" onclick="codeEditor.previewSnippet('${category}', '${snippet.name}')">
                        <i class="fas fa-eye"></i> معاينة
                    </button>
                    <button class="btn-insert" onclick="codeEditor.insertSnippet('${category}', '${snippet.name}')">
                        <i class="fas fa-plus"></i> إدراج
                    </button>
                </div>
            </div>
        `).join('');
    }

    showCategorySnippets(category, button) {
        // تحديث التبويبات
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // تحديث قائمة الأكواد
        document.querySelector('.snippets-list').innerHTML = this.renderSnippetsList(category);
    }

    insertSnippet(category, snippetName) {
        const snippet = this.snippetLibrary[category]?.find(s => s.name === snippetName);
        if (!snippet) return;

        // التبديل إلى اللغة المناسبة
        const langButton = document.querySelector(`[data-lang="${snippet.language}"]`);
        if (langButton) {
            this.switchLanguage(snippet.language, langButton);
        }

        // إدراج الكود
        const codeInput = document.getElementById('codeInput');
        const currentCode = codeInput.value;
        const newCode = currentCode + '\n' + snippet.code + '\n';
        
        codeInput.value = newCode;
        this.currentCode[snippet.language] = newCode;

        // تحديث المعاينة
        if (document.getElementById('livePreview')?.checked) {
            this.updatePreview();
        }

        // إغلاق مكتبة الأكواد
        document.querySelector('.snippets-modal-overlay')?.remove();

        this.showNotification('تم إدراج الكود بنجاح', 'success');
    }

    saveVersion() {
        const version = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            code: { ...this.currentCode },
            description: prompt('وصف الإصدار (اختياري):') || `إصدار ${this.versions.length + 1}`
        };

        this.versions.push(version);
        this.currentVersion = this.versions.length - 1;

        // حفظ الإصدارات
        localStorage.setItem(`code_versions_${this.currentStoreId}`, JSON.stringify(this.versions));
        
        this.showNotification('تم حفظ الإصدار الجديد', 'success');
    }

    updateLineNumbers() {
        const codeInput = document.getElementById('codeInput');
        const lines = codeInput.value.split('\n').length;
        const currentLine = codeInput.value.substr(0, codeInput.selectionStart).split('\n').length;
        
        document.getElementById('lineNumber').textContent = currentLine;
    }

    updateCharCount() {
        const codeInput = document.getElementById('codeInput');
        document.getElementById('charCount').textContent = codeInput.value.length;
    }

    formatCode() {
        const currentLang = document.querySelector('.lang-tab.active')?.dataset.lang;
        const codeInput = document.getElementById('codeInput');
        let code = codeInput.value;

        if (currentLang === 'html') {
            code = this.formatHTML(code);
        } else if (currentLang === 'css') {
            code = this.formatCSS(code);
        } else if (currentLang === 'javascript') {
            code = this.formatJS(code);
        }

        codeInput.value = code;
        this.currentCode[currentLang] = code;
        this.updatePreview();
    }

    formatHTML(html) {
        // تنسيق HTML بسيط
        return html.replace(/></g, '>\n<').replace(/^\s+|\s+$/g, '');
    }

    formatCSS(css) {
        // تنسيق CSS بسيط
        return css.replace(/;/g, ';\n    ').replace(/\{/g, ' {\n    ').replace(/\}/g, '\n}\n');
    }

    formatJS(js) {
        // تنسيق JavaScript بسيط
        return js.replace(/;/g, ';\n').replace(/\{/g, ' {\n    ').replace(/\}/g, '\n}');
    }

    closeEditor() {
        if (confirm('هل تريد حفظ التغييرات قبل الإغلاق؟')) {
            this.applyChanges(this.currentStoreId);
        }
        document.querySelector('.code-editor-modal')?.remove();
    }

    applyChanges(storeId) {
        // حفظ الكود في المتجر
        const codeData = {
            html: this.currentCode.html,
            css: this.currentCode.css,
            javascript: this.currentCode.javascript,
            lastModified: new Date().toISOString()
        };

        localStorage.setItem(`store_${storeId}_custom_code`, JSON.stringify(codeData));
        
        this.showNotification('تم تطبيق التغييرات بنجاح', 'success');
        document.querySelector('.code-editor-modal')?.remove();
        
        // إعادة تحميل المتجر لإظهار التغييرات
        if (window.dashboardManager?.refreshStorePreview) {
            window.dashboardManager.refreshStorePreview(storeId);
        }
    }

    loadExistingCode(storeId) {
        try {
            const savedCode = localStorage.getItem(`store_${storeId}_custom_code`);
            if (savedCode) {
                const codeData = JSON.parse(savedCode);
                this.currentCode = { ...codeData };
                
                // تحميل الكود في المحرر
                document.getElementById('codeInput').value = this.currentCode.html || '';
                this.updatePreview();
            }

            // تحميل الإصدارات المحفوظة
            const savedVersions = localStorage.getItem(`code_versions_${storeId}`);
            if (savedVersions) {
                this.versions = JSON.parse(savedVersions);
            }
        } catch (error) {
            console.error('خطأ في تحميل الكود:', error);
        }
    }

    showNotification(message, type) {
        if (window.platformManager?.showNotification) {
            window.platformManager.showNotification(message, type);
        }
    }

    addCodeEditorStyles() {
        if (document.getElementById('code-editor-styles')) return;

        const style = document.createElement('style');
        style.id = 'code-editor-styles';
        style.textContent = `
            .code-editor-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .code-editor-container {
                width: 95%;
                height: 95%;
                background: #1e1e1e;
                border-radius: 12px;
                display: flex;
                flex-direction: column;
                color: white;
                overflow: hidden;
            }

            .editor-header {
                background: #2d2d2d;
                padding: 1rem 2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #404040;
            }

            .editor-title {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: 600;
                font-size: 1.1rem;
            }

            .editor-controls {
                display: flex;
                gap: 1rem;
            }

            .control-btn, .close-btn {
                background: #404040;
                border: none;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.2s;
            }

            .control-btn:hover {
                background: #505050;
            }

            .close-btn {
                background: #e74c3c;
            }

            .close-btn:hover {
                background: #c0392b;
            }

            .editor-body {
                flex: 1;
                display: flex;
                overflow: hidden;
            }

            .editor-sidebar {
                width: 250px;
                background: #2d2d2d;
                border-left: 1px solid #404040;
                display: flex;
                flex-direction: column;
            }

            .language-tabs {
                display: flex;
                flex-direction: column;
                padding: 1rem;
                gap: 0.5rem;
            }

            .lang-tab {
                background: #404040;
                border: none;
                color: white;
                padding: 0.75rem;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.2s;
            }

            .lang-tab.active, .lang-tab:hover {
                background: #667eea;
            }

            .code-tools {
                flex: 1;
                padding: 1rem;
                overflow-y: auto;
            }

            .tool-section {
                margin-bottom: 2rem;
            }

            .tool-section h4 {
                margin: 0 0 1rem 0;
                color: #ccc;
                font-size: 0.9rem;
                text-transform: uppercase;
            }

            .tool-btn {
                width: 100%;
                background: #404040;
                border: none;
                color: white;
                padding: 0.75rem;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
                transition: all 0.2s;
            }

            .tool-btn:hover {
                background: #505050;
            }

            .setting-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
                color: #ccc;
                cursor: pointer;
            }

            .editor-main {
                flex: 1;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1px;
                background: #404040;
            }

            .code-input-area, .preview-area {
                background: #1e1e1e;
                display: flex;
                flex-direction: column;
            }

            .input-header, .preview-header {
                background: #2d2d2d;
                padding: 0.75rem 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #404040;
            }

            .current-lang {
                font-weight: 600;
                color: #667eea;
            }

            .input-controls, .preview-controls {
                display: flex;
                gap: 1rem;
                font-size: 0.8rem;
                color: #ccc;
            }

            .preview-btn {
                background: #404040;
                border: none;
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.8rem;
            }

            .code-textarea {
                flex: 1;
                background: #1e1e1e;
                color: #f8f8f2;
                border: none;
                padding: 1rem;
                font-family: 'Fira Code', monospace;
                font-size: 14px;
                line-height: 1.5;
                resize: none;
                outline: none;
            }

            .preview-iframe {
                flex: 1;
                border: none;
                background: white;
            }

            .editor-footer {
                background: #2d2d2d;
                padding: 1rem 2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 1px solid #404040;
            }

            .status-bar {
                display: flex;
                gap: 2rem;
                color: #ccc;
                font-size: 0.9rem;
            }

            .action-buttons {
                display: flex;
                gap: 1rem;
            }

            .btn-primary, .btn-secondary {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .btn-primary {
                background: #667eea;
                color: white;
            }

            .btn-secondary {
                background: #6b7280;
                color: white;
            }

            .snippets-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 20000;
            }

            .snippets-modal {
                background: white;
                border-radius: 12px;
                width: 80%;
                max-width: 800px;
                max-height: 80vh;
                overflow: hidden;
            }

            .snippets-content {
                display: grid;
                grid-template-columns: 200px 1fr;
                height: 500px;
            }

            .snippets-categories {
                background: #f8f9fa;
                padding: 1rem;
                border-left: 1px solid #e5e7eb;
            }

            .category-btn {
                width: 100%;
                background: none;
                border: none;
                padding: 0.75rem;
                text-align: right;
                cursor: pointer;
                border-radius: 6px;
                margin-bottom: 0.5rem;
            }

            .category-btn.active, .category-btn:hover {
                background: #667eea;
                color: white;
            }

            .snippets-list {
                padding: 1rem;
                overflow-y: auto;
            }

            .snippet-item {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
            }

            .snippet-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }

            .snippet-lang {
                background: #667eea;
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.8rem;
            }

            .snippet-actions {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;
            }

            .btn-view, .btn-insert {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.9rem;
            }

            .btn-view {
                background: #6b7280;
                color: white;
            }

            .btn-insert {
                background: #10b981;
                color: white;
            }
        `;

        document.head.appendChild(style);
    }
}

// إنشاء مثيل عالمي
if (!window.codeEditor) {
    window.codeEditor = new SmartCodeEditor();
}

// دوال مساعدة
function showCodeEditor(storeId) {
    if (window.codeEditor) {
        window.codeEditor.showCodeEditor(storeId);
    }
}
