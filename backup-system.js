// نظام النسخ الاحتياطي التلقائي
class BackupSystem {
  constructor() {
    this.backupInterval = 30 * 60 * 1000 // كل 30 دقيقة
    this.maxBackups = 10
    this.backupKeys = [
      "platformUsers",
      "storeProducts",
      "storeOrders",
      "storeCustomers",
      "storeSettings",
      "userStores",
      "storeCustomizations",
    ]
    this.isRunning = false
    this.init()
  }

  init() {
    this.startAutoBackup()
    this.setupEventListeners()
    this.cleanOldBackups()
  }

  startAutoBackup() {
    if (this.isRunning) return

    this.isRunning = true

    // نسخة احتياطية فورية
    this.createBackup()

    // نسخ احتياطية دورية
    this.backupIntervalId = setInterval(() => {
      this.createBackup()
    }, this.backupInterval)
  }

  stopAutoBackup() {
    if (this.backupIntervalId) {
      clearInterval(this.backupIntervalId)
      this.backupIntervalId = null
    }
    this.isRunning = false
  }

  setupEventListeners() {
    // نسخة احتياطية عند إغلاق النافذة
    window.addEventListener("beforeunload", () => {
      this.createBackup()
    })

    // نسخة احتياطية عند فقدان التركيز
    window.addEventListener("blur", () => {
      this.createBackup()
    })

    // نسخة احتياطية عند تغيير البيانات المهمة
    this.watchForDataChanges()
  }

  watchForDataChanges() {
    // مراقبة تغييرات localStorage
    const originalSetItem = localStorage.setItem
    localStorage.setItem = (key, value) => {
      originalSetItem.call(localStorage, key, value)

      if (this.backupKeys.includes(key)) {
        // تأخير قصير لتجنب النسخ المتكررة
        clearTimeout(this.dataChangeTimeout)
        this.dataChangeTimeout = setTimeout(() => {
          this.createIncrementalBackup(key, value)
        }, 5000)
      }
    }
  }

  createBackup() {
    try {
      const backupData = this.gatherBackupData()
      const backup = {
        id: this.generateBackupId(),
        timestamp: new Date().toISOString(),
        type: "full",
        data: backupData,
        checksum: this.calculateChecksum(backupData),
        version: this.getAppVersion(),
        userAgent: navigator.userAgent,
      }

      this.saveBackup(backup)
      this.notifyBackupCreated(backup)

      return backup
    } catch (error) {
      this.handleBackupError("CREATE_BACKUP_ERROR", error)
    }
  }

  createIncrementalBackup(key, value) {
    try {
      const backup = {
        id: this.generateBackupId(),
        timestamp: new Date().toISOString(),
        type: "incremental",
        key: key,
        data: value,
        checksum: this.calculateChecksum({ [key]: value }),
        version: this.getAppVersion(),
      }

      this.saveIncrementalBackup(backup)
    } catch (error) {
      this.handleBackupError("CREATE_INCREMENTAL_BACKUP_ERROR", error)
    }
  }

  gatherBackupData() {
    const data = {}

    this.backupKeys.forEach((key) => {
      const value = localStorage.getItem(key)
      if (value) {
        try {
          // محاولة تحليل JSON للتحقق من صحة البيانات
          JSON.parse(value)
          data[key] = value
        } catch (error) {
          console.warn(`Invalid JSON data for key ${key}:`, error)
        }
      }
    })

    // إضافة بيانات إضافية
    data.currentUser = localStorage.getItem("currentUser")
    data.userSession = localStorage.getItem("userSession")
    data.appSettings = this.getAppSettings()

    return data
  }

  getAppSettings() {
    return {
      language: localStorage.getItem("selectedLanguage") || "ar",
      theme: localStorage.getItem("selectedTheme") || "light",
      lastActiveTemplate: localStorage.getItem("lastActiveTemplate"),
      debugMode: localStorage.getItem("debugMode") === "true",
    }
  }

  calculateChecksum(data) {
    const str = JSON.stringify(data)
    let hash = 0

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // تحويل إلى 32bit integer
    }

    return hash.toString(36)
  }

  saveBackup(backup) {
    const backups = this.getBackupsList()

    // إضافة النسخة الاحتياطية الجديدة
    backups.unshift(backup)

    // الاحتفاظ بالعدد المحدد من النسخ الاحتياطية
    if (backups.length > this.maxBackups) {
      const removedBackups = backups.splice(this.maxBackups)
      this.cleanupBackups(removedBackups)
    }

    localStorage.setItem("systemBackups", JSON.stringify(backups))

    // حفظ النسخة الاحتياطية في مفتاح منفصل
    localStorage.setItem(`backup_${backup.id}`, JSON.stringify(backup.data))
  }

  saveIncrementalBackup(backup) {
    let incrementalBackups = JSON.parse(localStorage.getItem("incrementalBackups") || "[]")

    incrementalBackups.unshift(backup)

    // الاحتفاظ بآخر 50 نسخة احتياطية تدريجية
    if (incrementalBackups.length > 50) {
      incrementalBackups = incrementalBackups.slice(0, 50)
    }

    localStorage.setItem("incrementalBackups", JSON.stringify(incrementalBackups))
  }

  getBackupsList() {
    try {
      return JSON.parse(localStorage.getItem("systemBackups") || "[]")
    } catch (error) {
      console.error("Error loading backups list:", error)
      return []
    }
  }

  getBackup(backupId) {
    try {
      const backupData = localStorage.getItem(`backup_${backupId}`)
      return backupData ? JSON.parse(backupData) : null
    } catch (error) {
      console.error("Error loading backup:", error)
      return null
    }
  }

  restoreBackup(backupId) {
    try {
      const backups = this.getBackupsList()
      const backup = backups.find((b) => b.id === backupId)

      if (!backup) {
        throw new Error("Backup not found")
      }

      const backupData = this.getBackup(backupId)
      if (!backupData) {
        throw new Error("Backup data not found")
      }

      // التحقق من سلامة البيانات
      const checksum = this.calculateChecksum(backupData)
      if (checksum !== backup.checksum) {
        throw new Error("Backup data corrupted")
      }

      // إنشاء نسخة احتياطية من الوضع الحالي قبل الاستعادة
      const currentBackup = this.createBackup()

      // استعادة البيانات
      Object.entries(backupData).forEach(([key, value]) => {
        if (key !== "appSettings") {
          localStorage.setItem(key, value)
        }
      })

      // استعادة إعدادات التطبيق
      if (backupData.appSettings) {
        this.restoreAppSettings(backupData.appSettings)
      }

      this.notifyBackupRestored(backup, currentBackup)

      return {
        success: true,
        message: "تم استعادة النسخة الاحتياطية بنجاح",
        backup: backup,
        rollbackBackup: currentBackup,
      }
    } catch (error) {
      this.handleBackupError("RESTORE_BACKUP_ERROR", error)
      return {
        success: false,
        message: `فشل في استعادة النسخة الاحتياطية: ${error.message}`,
      }
    }
  }

  restoreAppSettings(settings) {
    if (settings.language) {
      localStorage.setItem("selectedLanguage", settings.language)
    }
    if (settings.theme) {
      localStorage.setItem("selectedTheme", settings.theme)
    }
    if (settings.lastActiveTemplate) {
      localStorage.setItem("lastActiveTemplate", settings.lastActiveTemplate)
    }
    if (settings.debugMode !== undefined) {
      localStorage.setItem("debugMode", settings.debugMode.toString())
    }
  }

  deleteBackup(backupId) {
    try {
      let backups = this.getBackupsList()
      backups = backups.filter((b) => b.id !== backupId)

      localStorage.setItem("systemBackups", JSON.stringify(backups))
      localStorage.removeItem(`backup_${backupId}`)

      return { success: true, message: "تم حذف النسخة الاحتياطية بنجاح" }
    } catch (error) {
      this.handleBackupError("DELETE_BACKUP_ERROR", error)
      return { success: false, message: "فشل في حذف النسخة الاحتياطية" }
    }
  }

  exportBackup(backupId) {
    try {
      const backups = this.getBackupsList()
      const backup = backups.find((b) => b.id === backupId)

      if (!backup) {
        throw new Error("Backup not found")
      }

      const backupData = this.getBackup(backupId)
      if (!backupData) {
        throw new Error("Backup data not found")
      }

      const exportData = {
        ...backup,
        data: backupData,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `backup_${backup.timestamp.split("T")[0]}_${backup.id.slice(0, 8)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      this.notifyBackupExported(backup)
    } catch (error) {
      this.handleBackupError("EXPORT_BACKUP_ERROR", error)
    }
  }

  importBackup(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result)

          // التحقق من صحة البيانات المستوردة
          if (!this.validateImportedBackup(importedData)) {
            throw new Error("Invalid backup file format")
          }

          // إنشاء نسخة احتياطية جديدة من البيانات المستوردة
          const newBackup = {
            ...importedData,
            id: this.generateBackupId(),
            timestamp: new Date().toISOString(),
            imported: true,
            originalId: importedData.id,
          }

          this.saveBackup(newBackup)
          this.notifyBackupImported(newBackup)

          resolve({
            success: true,
            message: "تم استيراد النسخة الاحتياطية بنجاح",
            backup: newBackup,
          })
        } catch (error) {
          this.handleBackupError("IMPORT_BACKUP_ERROR", error)
          reject({
            success: false,
            message: "فشل في استيراد النسخة الاحتياطية",
          })
        }
      }

      reader.onerror = () => {
        reject({
          success: false,
          message: "فشل في قراءة الملف",
        })
      }

      reader.readAsText(file)
    })
  }

  validateImportedBackup(data) {
    return data.id && data.timestamp && data.data && typeof data.data === "object" && data.checksum
  }

  cleanOldBackups() {
    try {
      const backups = this.getBackupsList()
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

      const oldBackups = backups.filter((backup) => new Date(backup.timestamp).getTime() < thirtyDaysAgo)

      if (oldBackups.length > 0) {
        this.cleanupBackups(oldBackups)

        const remainingBackups = backups.filter((backup) => new Date(backup.timestamp).getTime() >= thirtyDaysAgo)

        localStorage.setItem("systemBackups", JSON.stringify(remainingBackups))
      }
    } catch (error) {
      this.handleBackupError("CLEAN_OLD_BACKUPS_ERROR", error)
    }
  }

  cleanupBackups(backupsToRemove) {
    backupsToRemove.forEach((backup) => {
      localStorage.removeItem(`backup_${backup.id}`)
    })
  }

  getBackupStats() {
    const backups = this.getBackupsList()
    const incrementalBackups = JSON.parse(localStorage.getItem("incrementalBackups") || "[]")

    return {
      totalBackups: backups.length,
      incrementalBackups: incrementalBackups.length,
      oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
      newestBackup: backups.length > 0 ? backups[0].timestamp : null,
      totalSize: this.calculateBackupsSize(backups),
      autoBackupEnabled: this.isRunning,
    }
  }

  calculateBackupsSize(backups) {
    let totalSize = 0

    backups.forEach((backup) => {
      const backupData = localStorage.getItem(`backup_${backup.id}`)
      if (backupData) {
        totalSize += new Blob([backupData]).size
      }
    })

    return totalSize
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  showBackupPanel() {
    const stats = this.getBackupStats()
    const backups = this.getBackupsList()

    const panel = document.createElement("div")
    panel.id = "backup-panel"
    panel.innerHTML = `
            <div class="backup-overlay" onclick="this.parentElement.remove()"></div>
            <div class="backup-content">
                <div class="backup-header">
                    <h3>إدارة النسخ الاحتياطية</h3>
                    <button onclick="this.closest('#backup-panel').remove()" class="close-btn">×</button>
                </div>
                
                <div class="backup-stats">
                    <div class="stat-item">
                        <span class="stat-label">إجمالي النسخ:</span>
                        <span class="stat-value">${stats.totalBackups}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">حجم البيانات:</span>
                        <span class="stat-value">${this.formatFileSize(stats.totalSize)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">النسخ التلقائي:</span>
                        <span class="stat-value ${stats.autoBackupEnabled ? "enabled" : "disabled"}">
                            ${stats.autoBackupEnabled ? "مفعل" : "معطل"}
                        </span>
                    </div>
                </div>
                
                <div class="backup-actions">
                    <button onclick="backupSystem.createBackup()" class="btn-primary">
                        <i class="fas fa-plus"></i> إنشاء نسخة احتياطية
                    </button>
                    <button onclick="backupSystem.triggerImport()" class="btn-secondary">
                        <i class="fas fa-upload"></i> استيراد نسخة احتياطية
                    </button>
                    <button onclick="backupSystem.toggleAutoBackup()" class="btn-secondary">
                        <i class="fas fa-cog"></i> ${stats.autoBackupEnabled ? "إيقاف" : "تفعيل"} النسخ التلقائي
                    </button>
                </div>
                
                <div class="backups-list">
                    <h4>النسخ الاحتياطية المحفوظة</h4>
                    ${backups.length > 0 ? this.renderBackupsList(backups) : '<p class="no-backups">لا توجد نسخ احتياطية محفوظة</p>'}
                </div>
                
                <input type="file" id="backup-import-input" accept=".json" style="display: none;" onchange="backupSystem.handleImportFile(this)">
            </div>
        `

    document.body.appendChild(panel)
    this.addBackupPanelStyles()
  }

  renderBackupsList(backups) {
    return backups
      .map(
        (backup) => `
            <div class="backup-item">
                <div class="backup-info">
                    <div class="backup-date">${new Date(backup.timestamp).toLocaleString("ar")}</div>
                    <div class="backup-type">${backup.type === "full" ? "نسخة كاملة" : "نسخة تدريجية"}</div>
                    ${backup.imported ? '<span class="backup-badge">مستوردة</span>' : ""}
                </div>
                <div class="backup-actions-small">
                    <button onclick="backupSystem.restoreBackup('${backup.id}')" class="btn-restore" title="استعادة">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button onclick="backupSystem.exportBackup('${backup.id}')" class="btn-export" title="تصدير">
                        <i class="fas fa-download"></i>
                    </button>
                    <button onclick="backupSystem.deleteBackup('${backup.id}')" class="btn-delete" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `,
      )
      .join("")
  }

  triggerImport() {
    document.getElementById("backup-import-input").click()
  }

  handleImportFile(input) {
    const file = input.files[0]
    if (file) {
      this.importBackup(file)
        .then((result) => {
          if (window.notificationSystem) {
            window.notificationSystem.success(result.message)
          }
          // إعادة تحميل اللوحة
          document.getElementById("backup-panel")?.remove()
          this.showBackupPanel()
        })
        .catch((error) => {
          if (window.notificationSystem) {
            window.notificationSystem.error(error.message)
          }
        })
    }
  }

  toggleAutoBackup() {
    if (this.isRunning) {
      this.stopAutoBackup()
      if (window.notificationSystem) {
        window.notificationSystem.info("تم إيقاف النسخ الاحتياطي التلقائي")
      }
    } else {
      this.startAutoBackup()
      if (window.notificationSystem) {
        window.notificationSystem.success("تم تفعيل النسخ الاحتياطي التلقائي")
      }
    }

    // إعادة تحميل اللوحة
    document.getElementById("backup-panel")?.remove()
    this.showBackupPanel()
  }

  // دوال الإشعارات
  notifyBackupCreated(backup) {
    if (window.notificationSystem) {
      window.notificationSystem.success("تم إنشاء نسخة احتياطية جديدة", {
        duration: 3000,
      })
    }
  }

  notifyBackupRestored(backup, rollbackBackup) {
    if (window.notificationSystem) {
      window.notificationSystem.success("تم استعادة النسخة الاحتياطية بنجاح", {
        actions: [
          {
            id: "rollback",
            label: "تراجع",
            handler: () => this.restoreBackup(rollbackBackup.id),
          },
        ],
      })
    }
  }

  notifyBackupExported(backup) {
    if (window.notificationSystem) {
      window.notificationSystem.success("تم تصدير النسخة الاحتياطية بنجاح")
    }
  }

  notifyBackupImported(backup) {
    if (window.notificationSystem) {
      window.notificationSystem.success("تم استيراد النسخة الاحتياطية بنجاح")
    }
  }

  handleBackupError(errorType, error) {
    console.error(`Backup System Error [${errorType}]:`, error)

    if (window.errorHandler) {
      window.errorHandler.handleError({
        type: "backup",
        subType: errorType,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      })
    }
  }

  generateBackupId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  getAppVersion() {
    return "1.0.0" // يتم تحديثها في البناء
  }

  addBackupPanelStyles() {
    if (document.getElementById("backup-panel-styles")) return

    const style = document.createElement("style")
    style.id = "backup-panel-styles"
    style.textContent = `
            #backup-panel {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10003;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .backup-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }

            .backup-content {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
                z-index: 1;
            }

            .backup-header {
                padding: 1.5rem;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .backup-header h3 {
                margin: 0;
                color: #1f2937;
            }

            .close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: #6b7280;
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 4px;
                transition: all 0.2s;
            }

            .close-btn:hover {
                color: #374151;
                background: #f3f4f6;
            }

            .backup-stats {
                padding: 1rem 1.5rem;
                background: #f9fafb;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
            }

            .stat-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
            }

            .stat-label {
                font-size: 0.875rem;
                color: #6b7280;
                margin-bottom: 0.25rem;
            }

            .stat-value {
                font-size: 1.25rem;
                font-weight: 600;
                color: #1f2937;
            }

            .stat-value.enabled {
                color: #10b981;
            }

            .stat-value.disabled {
                color: #ef4444;
            }

            .backup-actions {
                padding: 1.5rem;
                display: flex;
                gap: 0.75rem;
                flex-wrap: wrap;
            }

            .backup-actions .btn-primary,
            .backup-actions .btn-secondary {
                padding: 0.75rem 1rem;
                border-radius: 8px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
            }

            .backup-actions .btn-primary {
                background: #3b82f6;
                color: white;
            }

            .backup-actions .btn-primary:hover {
                background: #2563eb;
            }

            .backup-actions .btn-secondary {
                background: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;
            }

            .backup-actions .btn-secondary:hover {
                background: #e5e7eb;
            }

            .backups-list {
                padding: 0 1.5rem 1.5rem;
            }

            .backups-list h4 {
                margin: 0 0 1rem 0;
                color: #374151;
                font-size: 1rem;
            }

            .backup-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                margin-bottom: 0.75rem;
                transition: all 0.2s;
            }

            .backup-item:hover {
                border-color: #3b82f6;
                background: #f8fafc;
            }

            .backup-info {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }

            .backup-date {
                font-weight: 500;
                color: #1f2937;
            }

            .backup-type {
                font-size: 0.875rem;
                color: #6b7280;
            }

            .backup-badge {
                display: inline-block;
                background: #3b82f6;
                color: white;
                padding: 0.125rem 0.5rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 500;
                margin-top: 0.25rem;
            }

            .backup-actions-small {
                display: flex;
                gap: 0.5rem;
            }

            .backup-actions-small button {
                width: 32px;
                height: 32px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.875rem;
            }

            .btn-restore {
                background: #10b981;
                color: white;
            }

            .btn-restore:hover {
                background: #059669;
            }

            .btn-export {
                background: #3b82f6;
                color: white;
            }

            .btn-export:hover {
                background: #2563eb;
            }

            .btn-delete {
                background: #ef4444;
                color: white;
            }

            .btn-delete:hover {
                background: #dc2626;
            }

            .no-backups {
                text-align: center;
                color: #6b7280;
                font-style: italic;
                padding: 2rem;
            }

            @media (max-width: 768px) {
                .backup-content {
                    width: 95%;
                    margin: 1rem;
                }

                .backup-actions {
                    flex-direction: column;
                }

                .backup-actions .btn-primary,
                .backup-actions .btn-secondary {
                    width: 100%;
                    justify-content: center;
                }

                .backup-item {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 1rem;
                }

                .backup-actions-small {
                    width: 100%;
                    justify-content: center;
                }
            }
        `

    document.head.appendChild(style)
  }
}

// إنشاء مثيل عالمي
if (!window.backupSystem) {
  window.backupSystem = new BackupSystem()
}
