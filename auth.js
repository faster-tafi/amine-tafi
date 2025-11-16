// نظام إدارة المصادقة المحسن
class AuthenticationSystem {
    constructor() {
        this.users = [];
        this.currentSession = null;
        this.emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        this.isInitialized = false;
    }

    // تهيئة النظام
    async init() {
        if (this.isInitialized) return Promise.resolve();
        
        try {
            await this.loadUsers();
            this.checkExistingSession();
            this.isInitialized = true;
            console.log('Auth system initialized successfully');
            return Promise.resolve();
        } catch (error) {
            console.error('Error during auth system initialization:', error);
            this.isInitialized = false;
            return Promise.reject(error);
        }
    }

    // تحميل المستخدمين من localStorage
    async loadUsers() {
        try {
            const storedUsers = localStorage.getItem('platformUsers');
            if (storedUsers) {
                this.users = JSON.parse(storedUsers);
            } else {
                this.users = [];
            }
        } catch (error) {
            console.error('خطأ في تحميل بيانات المستخدمين:', error);
            this.users = [];
        }
    }

    // حفظ المستخدمين
    saveUsers() {
        try {
            localStorage.setItem('platformUsers', JSON.stringify(this.users));
            return true;
        } catch (error) {
            console.error('خطأ في حفظ بيانات المستخدمين:', error);
            return false;
        }
    }

    // التحقق من وجود جلسة مفتوحة
    checkExistingSession() {
        const sessionData = localStorage.getItem('userSession');
        const isLoggedIn = localStorage.getItem('isLoggedIn');

        if (sessionData && isLoggedIn === 'true') {
            try {
                const session = JSON.parse(sessionData);
                const user = this.users.find(u => u.id === session.userId);

                if (user && user.isActive) {
                    this.currentSession = {
                        user: this.sanitizeUser(user),
                        loginTime: session.loginTime || new Date().toISOString()
                    };
                    return true;
                }
            } catch (error) {
                console.error('خطأ في استرجاع الجلسة:', error);
            }
        }

        this.clearSession();
        return false;
    }

    // تنظيف الجلسة
    clearSession() {
        localStorage.removeItem('userSession');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        this.currentSession = null;
    }

    // التحقق من صحة البريد الإلكتروني
    validateEmail(email) {
        return this.emailRegex.test(email);
    }

    // التحقق من قوة كلمة المرور
    validatePassword(password) {
        return password && password.length >= 6;
    }

    // التحقق من وجود المستخدم
    userExists(email) {
        return this.users.some(user => 
            user.email && user.email.toLowerCase() === email.toLowerCase()
        );
    }

    // تشفير كلمة المرور البسيط
    hashPassword(password) {
        return btoa(password + 'storebuilder_salt_2024');
    }

    // التحقق من كلمة المرور
    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    }

    // تسجيل مستخدم جديد
    register(userData) {
        const { name, email, password, confirmPassword } = userData;

        // التحقق من الحقول المطلوبة
        if (!name || !email || !password || !confirmPassword) {
            return { 
                success: false, 
                message: 'جميع الحقول مطلوبة',
                field: 'all'
            };
        }

        // التحقق من صحة البريد الإلكتروني
        if (!this.validateEmail(email)) {
            return { 
                success: false, 
                message: 'البريد الإلكتروني غير صحيح',
                field: 'email'
            };
        }

        // التحقق من تطابق كلمة المرور
        if (password !== confirmPassword) {
            return { 
                success: false, 
                message: 'كلمة المرور غير متطابقة',
                field: 'confirmPassword'
            };
        }

        // التحقق من قوة كلمة المرور
        if (!this.validatePassword(password)) {
            return { 
                success: false, 
                message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
                field: 'password'
            };
        }

        // التحقق من وجود المستخدم
        if (this.userExists(email)) {
            return { 
                success: false, 
                message: 'البريد الإلكتروني مسجل مسبقاً',
                field: 'email'
            };
        }

        // إنشاء المستخدم الجديد
        const newUser = {
            id: Date.now() + Math.random(),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: this.hashPassword(password),
            username: name.trim().toLowerCase().replace(/\s+/g, '_'),
            registrationDate: new Date().toISOString(),
            lastLogin: null,
            isActive: true,
            hasFullAccess: false,
            stores: [],
            settings: {
                language: 'ar',
                theme: 'light'
            }
        };

        this.users.push(newUser);

        if (this.saveUsers()) {
            return { 
                success: true, 
                message: 'تم إنشاء الحساب بنجاح', 
                user: this.sanitizeUser(newUser) 
            };
        } else {
            return { 
                success: false, 
                message: 'حدث خطأ أثناء حفظ البيانات',
                field: 'system'
            };
        }
    }

    // تسجيل الدخول
    login(email, password) {
        if (!email || !password) {
            return { 
                success: false, 
                message: 'البريد الإلكتروني وكلمة المرور مطلوبان',
                field: 'all'
            };
        }

        if (!this.validateEmail(email)) {
            return { 
                success: false, 
                message: 'البريد الإلكتروني غير صحيح',
                field: 'email'
            };
        }

        const user = this.users.find(u => 
            u.email && u.email.toLowerCase() === email.toLowerCase()
        );

        if (!user) {
            return { 
                success: false, 
                message: 'البريد الإلكتروني غير مسجل',
                field: 'email'
            };
        }

        if (!user.isActive) {
            return { 
                success: false, 
                message: 'الحساب معطل، يرجى التواصل مع الدعم',
                field: 'account'
            };
        }

        if (!this.verifyPassword(password, user.password)) {
            return { 
                success: false, 
                message: 'كلمة المرور غير صحيحة',
                field: 'password'
            };
        }

        // تحديث آخر تسجيل دخول
        user.lastLogin = new Date().toISOString();
        this.saveUsers();

        // إنشاء الجلسة
        const sessionData = {
            userId: user.id,
            loginTime: new Date().toISOString()
        };

        this.currentSession = {
            user: this.sanitizeUser(user),
            loginTime: sessionData.loginTime
        };

        // حفظ الجلسة
        localStorage.setItem('userSession', JSON.stringify(sessionData));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify(this.currentSession.user));

        return { 
            success: true, 
            message: 'تم تسجيل الدخول بنجاح', 
            user: this.currentSession.user 
        };
    }

    // تنظيف بيانات المستخدم
    sanitizeUser(user) {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }

    // تسجيل الخروج
    logout() {
        this.clearSession();
        return { success: true, message: 'تم تسجيل الخروج بنجاح' };
    }

    // نسيان كلمة المرور
    forgotPassword(email) {
        if (!email || !this.validateEmail(email)) {
            return { 
                success: false, 
                message: 'البريد الإلكتروني غير صحيح',
                field: 'email'
            };
        }

        const user = this.users.find(u => 
            u.email && u.email.toLowerCase() === email.toLowerCase()
        );

        if (!user) {
            return { 
                success: false, 
                message: 'البريد الإلكتروني غير مسجل',
                field: 'email'
            };
        }

        // إنشاء كود إعادة التعيين
        const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        user.resetCode = resetCode;
        user.resetExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 دقيقة

        this.saveUsers();

        // محاكاة إرسال الإيميل
        console.log(`كود إعادة التعيين للمستخدم ${email}: ${resetCode}`);

        return { 
            success: true, 
            message: 'تم إرسال كود إعادة تعيين كلمة المرور',
            resetCode: resetCode // في الإنتاج، لا ترسل الكود
        };
    }

    // إعادة تعيين كلمة المرور
    resetPassword(email, resetCode, newPassword) {
        if (!email || !resetCode || !newPassword) {
            return { 
                success: false, 
                message: 'جميع الحقول مطلوبة',
                field: 'all'
            };
        }

        if (!this.validatePassword(newPassword)) {
            return { 
                success: false, 
                message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
                field: 'password'
            };
        }

        const user = this.users.find(u => 
            u.email && u.email.toLowerCase() === email.toLowerCase()
        );

        if (!user) {
            return { 
                success: false, 
                message: 'البريد الإلكتروني غير مسجل',
                field: 'email'
            };
        }

        if (!user.resetCode || user.resetCode !== resetCode.toUpperCase()) {
            return { 
                success: false, 
                message: 'كود إعادة التعيين غير صحيح',
                field: 'resetCode'
            };
        }

        if (new Date() > new Date(user.resetExpiry)) {
            return { 
                success: false, 
                message: 'كود إعادة التعيين منتهي الصلاحية',
                field: 'resetCode'
            };
        }

        // تحديث كلمة المرور
        user.password = this.hashPassword(newPassword);
        user.resetCode = null;
        user.resetExpiry = null;

        this.saveUsers();

        return { success: true, message: 'تم تحديث كلمة المرور بنجاح' };
    }

    // الحصول على المستخدم الحالي
    getCurrentUser() {
        return this.currentSession ? this.currentSession.user : null;
    }

    // التحقق من حالة المصادقة
    isAuthenticated() {
        return this.currentSession !== null;
    }

    // فتح جميع القوالب
    unlockAllTemplates(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.hasFullAccess = true;
            this.saveUsers();
            return { success: true, message: 'تم فتح جميع القوالب بنجاح' };
        }
        return { success: false, message: 'المستخدم غير موجود' };
    }
}

// إنشاء مثيل عالمي
if (!window.authSystem) {
    window.authSystem = new AuthenticationSystem();
}

// التأكد من تحميل النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تأخير قصير للتأكد من تحميل جميع العناصر
    setTimeout(() => {
        if (window.authSystem && !window.authSystem.isInitialized) {
            window.authSystem.init().catch(error => {
                console.error('Error initializing auth system:', error);
            });
        }
    }, 100);
});

// إضافة تحقق إضافي في حالة عدم تحميل النظام
window.addEventListener('load', function() {
    if (!window.authSystem) {
        console.error('Auth system not loaded, reinitializing...');
        window.authSystem = new AuthenticationSystem();
        window.authSystem.init();
    }
});
