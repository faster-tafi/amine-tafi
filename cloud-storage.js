// Cloud Storage System - نظام حفظ البيانات في السحابة
class CloudStorageSystem {
    constructor() {
        this.apiEndpoint = 'https://api.storebuilder.pro/v1'; // سيتم استبداله بـ API حقيقي
        this.isOnline = navigator.onLine;
        this.syncInterval = 30000; // 30 ثانية
        this.pendingSync = [];
        this.lastSyncTime = null;
        this.deviceId = this.generateDeviceId();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startAutoSync();
        this.loadUserData();
        this.updateSyncIndicators();
    }

    generateDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    setupEventListeners() {
        // مراقبة حالة الإنترنت
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncPendingData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateSyncIndicators();
        });

        // حفظ تلقائي عند تغيير البيانات
        window.addEventListener('beforeunload', () => {
            this.saveDataLocally();
        });

        // مراقبة تغييرات localStorage
        this.watchLocalStorage();
    }

    watchLocalStorage() {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = (key, value) => {
            originalSetItem.call(localStorage, key, value);
            if (this.shouldSync(key)) {
                this.queueForSync(key, value);
            }
        };
    }

    shouldSync(key) {
        const syncKeys = [
            'currentUser',
            'storeProducts',
            'storeOrders',
            'storeCustomers',
            'storeSettings',
            'storeCustomizations',
            'storeAnalytics'
        ];
        return syncKeys.includes(key);
    }

    queueForSync(key, value) {
        const syncItem = {
            key: key,
            value: value,
            timestamp: new Date().toISOString(),
            deviceId: this.deviceId,
            synced: false
        };

        this.pendingSync.push(syncItem);
        this.saveDataLocally();

        if (this.isOnline) {
            this.syncPendingData();
        }
    }

    async syncPendingData() {
        if (!this.isOnline || this.pendingSync.length === 0) return;

        try {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (!user.id) return;

            const syncData = {
                userId: user.id,
                deviceId: this.deviceId,
                timestamp: new Date().toISOString(),
                data: this.pendingSync.filter(item => !item.synced)
            };

            // محاكاة إرسال البيانات للخادم
            const response = await this.sendToServer(syncData);
            
            if (response.success) {
                this.pendingSync = this.pendingSync.map(item => ({
                    ...item,
                    synced: true
                }));
                
                this.lastSyncTime = new Date().toISOString();
                localStorage.setItem('lastSyncTime', this.lastSyncTime);
                
                this.updateSyncIndicators();
                console.log('Data synced successfully');
            }
        } catch (error) {
            console.error('Sync failed:', error);
            this.updateSyncIndicators();
        }
    }

    async sendToServer(data) {
        // محاكاة إرسال البيانات للخادم
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, message: 'Data synced' });
            }, 1000);
        });
    }

    saveDataLocally() {
        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                deviceId: this.deviceId,
                data: this.getAllUserData(),
                pendingSync: this.pendingSync
            };

            localStorage.setItem('localBackup', JSON.stringify(backupData));
            localStorage.setItem('lastBackupTime', backupData.timestamp);
        } catch (error) {
            console.error('Local backup failed:', error);
        }
    }

    getAllUserData() {
        const userData = {};
        const keys = [
            'currentUser', 'storeProducts', 'storeOrders', 'storeCustomers',
            'storeSettings', 'storeCustomizations', 'storeAnalytics',
            'uploadedImages', 'activeStore'
        ];

        keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                userData[key] = value;
            }
        });

        return userData;
    }

    async loadUserData() {
        try {
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (!user.id) return;

            // محاولة تحميل البيانات من الخادم
            if (this.isOnline) {
                const serverData = await this.loadFromServer(user.id);
                if (serverData && serverData.data) {
                    this.mergeServerData(serverData.data);
                }
            }

            // تحميل البيانات المحلية كنسخة احتياطية
            this.loadLocalBackup();
        } catch (error) {
            console.error('Failed to load user data:', error);
            this.loadLocalBackup();
        }
    }

    async loadFromServer(userId) {
        // محاكاة تحميل البيانات من الخادم
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, data: null });
            }, 500);
        });
    }

    loadLocalBackup() {
        try {
            const backup = localStorage.getItem('localBackup');
            if (backup) {
                const backupData = JSON.parse(backup);
                console.log('Local backup loaded from:', backupData.timestamp);
            }
        } catch (error) {
            console.error('Failed to load local backup:', error);
        }
    }

    mergeServerData(serverData) {
        Object.keys(serverData).forEach(key => {
            const localData = localStorage.getItem(key);
            const localTimestamp = this.getLocalTimestamp(key);
            const serverTimestamp = serverData[key].timestamp;

            // استخدام البيانات الأحدث
            if (!localData || new Date(serverTimestamp) > new Date(localTimestamp)) {
                localStorage.setItem(key, serverData[key].value);
            }
        });
    }

    getLocalTimestamp(key) {
        return localStorage.getItem(key + '_timestamp') || '1970-01-01T00:00:00.000Z';
    }

    startAutoSync() {
        setInterval(() => {
            if (this.isOnline) {
                this.syncPendingData();
            }
            this.saveDataLocally();
            this.updateSyncIndicators();
        }, this.syncInterval);
    }

    updateSyncIndicators() {
        // تحديث مؤشرات المزامنة في الواجهة
        const lastSaveTime = document.getElementById('lastSaveTime');
        const lastBackupTime = document.getElementById('lastBackupTime');
        const syncIndicator = document.querySelector('.sync-indicator');

        if (lastSaveTime) {
            const time = this.getTimeAgo(this.lastSyncTime || localStorage.getItem('lastSyncTime'));
            lastSaveTime.textContent = time;
        }

        if (lastBackupTime) {
            const time = this.getTimeAgo(localStorage.getItem('lastBackupTime'));
            lastBackupTime.textContent = time;
        }

        if (syncIndicator) {
            if (this.isOnline && this.pendingSync.every(item => item.synced)) {
                syncIndicator.innerHTML = '<i class="fas fa-check-circle text-success"></i><span>متزامن</span>';
            } else if (!this.isOnline) {
                syncIndicator.innerHTML = '<i class="fas fa-wifi text-warning"></i><span>غير متصل</span>';
            } else {
                syncIndicator.innerHTML = '<i class="fas fa-sync fa-spin text-primary"></i><span>جاري المزامنة...</span>';
            }
        }
    }

    getTimeAgo(timestamp) {
        if (!timestamp) return 'غير محدد';
        
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
        if (diffHours < 24) return `منذ ${diffHours} ساعة`;
        return `منذ ${diffDays} يوم`;
    }

    // وظائف التصدير والاستيراد
    async exportUserData() {
        try {
            const userData = this.getAllUserData();
            const exportData = {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                data: userData
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `storebuilder_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (window.dashboardManager) {
                window.dashboardManager.showNotification('تم تصدير البيانات بنجاح!', 'success');
            }
        } catch (error) {
            console.error('Export failed:', error);
            if (window.dashboardManager) {
                window.dashboardManager.showNotification('فشل في تصدير البيانات', 'error');
            }
        }
    }

    async backupAllData() {
        this.saveDataLocally();
        await this.syncPendingData();
        
        if (window.dashboardManager) {
            window.dashboardManager.showNotification('تم إنشاء نسخة احتياطية بنجاح!', 'success');
        }
        
        this.updateSyncIndicators();
    }

    getDeviceCount() {
        // محاكاة عدد الأجهزة المربوطة
        return parseInt(localStorage.getItem('deviceCount') || '1');
    }
}

// تهيئة النظام عند تحميل الصفحة
window.cloudStorage = new CloudStorageSystem();

// وظائف عامة للواجهة
function exportUserData() {
    window.cloudStorage.exportUserData();
}

function backupAllData() {
    window.cloudStorage.backupAllData();
}

function viewSubscriptionPlan() {
    if (window.dashboardManager) {
        window.dashboardManager.showNotification('صفحة الباقات قيد التطوير...', 'info');
    }
}

function accessSupport() {
    const phoneNumber = '0631906492';
    const message = 'مرحباً، أحتاج مساعدة في منصة StoreBuilderPro';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function viewAnalytics() {
    if (window.dashboardManager) {
        window.dashboardManager.switchSection('analytics');
    }
}
