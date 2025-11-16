// نظام المصادقة المحسن والآمن - الإصدار النهائي
class SecureAuthSystem {
  constructor() {
    this.currentSession = null
    this.emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    this.isInitialized = false
    this.sessionTimeout = 24 * 60 * 60 * 1000 // 24 ساعة
    this.maxLoginAttempts = 5
    this.lockoutTime = 15 * 60 * 1000 // 15 دقيقة
    this.init()
  }

  async init() {
    if (this.isInitialized) return

    try {
      
      this.checkExistingSession()
      this.setupSessionMonitoring()
      this.isInitialized = true
      console.log("Secure Auth System initialized successfully")
    } catch (error) {
      console.error("Error initializing auth system:", error)
      this.handleError("AUTH_INIT_ERROR", error)
    }
  }

  

  // تسجيل محسن مع تحقق شامل - متصل بالخادم
  async register(userData) {
    try {
        // التحقق الأولي في الواجهة الأمامية
        const validation = this.validateRegistrationData(userData);
        if (!validation.isValid) {
            return { success: false, message: validation.message, field: validation.field };
        }

        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: userData.name,
                email: userData.email,
                password: userData.password,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            // Server returned an error (e.g., 400, 409, 500)
            return { success: false, message: result.message || 'An error occurred', field: 'system' };
        }
        
        // Registration was successful on the server
        return {
            success: true,
            message: result.message || "تم إنشاء الحساب بنجاح. يمكنك الآن تسجيل الدخول.",
        };

    } catch (error) {
        this.handleError("REGISTRATION_ERROR", error);
        return {
            success: false,
            message: "فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى.",
            field: "system",
        };
    }
  }

  // التحقق من صحة بيانات التسجيل
  validateRegistrationData(userData) {
    const { name, email, password, confirmPassword } = userData

    if (!name || !email || !password || !confirmPassword) {
      return { isValid: false, message: "جميع الحقول مطلوبة", field: "all" }
    }

    if (name.length < 2 || name.length > 50) {
      return { isValid: false, message: "الاسم يجب أن يكون بين 2-50 حرف", field: "name" }
    }

    if (!this.validateEmail(email)) {
      return { isValid: false, message: "البريد الإلكتروني غير صحيح", field: "email" }
    }

    if (password !== confirmPassword) {
      return { isValid: false, message: "كلمة المرور غير متطابقة", field: "confirmPassword" }
    }

    const passwordValidation = this.validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return { isValid: false, message: passwordValidation.message, field: "password" }
    }

    return { isValid: true }
  }

  // تحقق من قوة كلمة المرور
  validatePasswordStrength(password) {
    if (password.length < 8) {
      return { isValid: false, message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل" }
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل" }
    }

    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل" }
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return { isValid: false, message: "كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل" }
    }

    return { isValid: true }
  }

  // تسجيل دخول محسن - متصل بالخادم
  async login(email, password) {
    try {
        // التحقق الأولي
        if (!email || !password) {
            return { success: false, message: "البريد الإلكتروني وكلمة المرور مطلوبان", field: "all" };
        }
        if (!this.validateEmail(email)) {
            return { success: false, message: "البريد الإلكتروني غير صحيح", field: "email" };
        }

        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (!response.ok) {
            return { success: false, message: result.message || 'بيانات تسجيل الدخول غير صحيحة', field: 'credentials' };
        }

        // Login successful, server sent back token and user data
        const sessionData = {
            userId: result.user.id,
            user: this.sanitizeUser(result.user), // Sanitize before saving
            token: result.token,
            loginTime: new Date().toISOString(),
            expiresAt: new Date().getTime() + this.sessionTimeout, 
        };
        
        // Save the new server-based session
        this.saveSession(sessionData);
        
        // Update current session state
        this.currentSession = {
            user: sessionData.user,
            loginTime: sessionData.loginTime,
            token: sessionData.token,
        };

        return {
            success: true,
            message: "تم تسجيل الدخول بنجاح",
            user: sessionData.user,
        };

    } catch (error) {
        this.handleError("LOGIN_ERROR", error);
        return {
            success: false,
            message: "فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى.",
            field: "system",
        };
    }
  }

  // التعامل مع فشل تسجيل الدخول
  handleFailedLogin(user) {
    user.loginAttempts = (user.loginAttempts || 0) + 1

    if (user.loginAttempts >= this.maxLoginAttempts) {
      user.lockedUntil = Date.now() + this.lockoutTime
      user.loginAttempts = 0
    }
  }

  // التعامل مع نجاح تسجيل الدخول
  handleSuccessfulLogin(user) {
    user.lastLogin = new Date().toISOString()
    user.loginAttempts = 0
    user.lockedUntil = null
    // إنشاء الجلسة
    const sessionData = {
      userId: user.id,
      loginTime: new Date().toISOString(),
      expiresAt: Date.now() + this.sessionTimeout,
      token: this.generateSessionToken(),
    }

    this.currentSession = {
      user: this.sanitizeUser(user),
      ...sessionData,
    }

    // حفظ الجلسة
    this.saveSession(sessionData)
  }

  // التحقق من قفل المستخدم
  isUserLocked(user) {
    return user.lockedUntil && user.lockedUntil > Date.now()
  }

  // إنشاء رمز جلسة آمن
  generateSessionToken() {
    return this.generateSecureId() + "_" + Date.now()
  }

  // إنشاء معرف آمن
  generateSecureId() {
    return Date.now() + "_" + Math.random().toString(36).substr(2, 9) + "_" + Math.random().toString(36).substr(2, 9)
  }

  // حفظ الجلسة بشكل آمن
  saveSession(sessionData) {
    try {
      localStorage.setItem("userSession", JSON.stringify(sessionData))
      localStorage.setItem("isLoggedIn", "true")
      localStorage.setItem("currentUser", JSON.stringify(this.currentSession.user))
    } catch (error) {
      this.handleError("SESSION_SAVE_ERROR", error)
    }
  }

  // مراقبة الجلسة
  setupSessionMonitoring() {
    // فحص الجلسة كل دقيقة
    setInterval(() => {
      this.validateCurrentSession()
    }, 60000)

    // فحص عند تفعيل النافذة
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.validateCurrentSession()
      }
    })
  }

  // التحقق من صحة الجلسة الحالية
  validateCurrentSession() {
    if (!this.isAuthenticated()) return

    const sessionData = localStorage.getItem("userSession")
    if (!sessionData) {
      this.logout()
      return
    }

    try {
      const session = JSON.parse(sessionData)
      if (session.expiresAt && session.expiresAt < Date.now()) {
        this.logout()
        this.showNotification("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى", "warning")
      }
    } catch (error) {
      this.logout()
    }
  }

  // تنظيف الجلسة المحسن
  clearSession() {
    localStorage.removeItem("userSession")
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("currentUser")
    this.currentSession = null
  }

  // إنشاء اسم مستخدم فريد
  generateUsername(name) {
    let username = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")

    // التأكد من عدم وجود نفس اسم المستخدم
    let counter = 1
    const originalUsername = username
    while (this.users.some((u) => u.username === username)) {
      username = originalUsername + "_" + counter
      counter++
    }

    return username
  }

  // تنظيف المدخلات
  sanitizeInput(input) {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
  }

  // إرسال بريد التحقق (محاكاة)
  sendVerificationEmail(user) {
    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    user.verificationCode = verificationCode
    user.verificationExpiry = Date.now() + 15 * 60 * 1000 // 15 دقيقة

    console.log(`Verification code for ${user.email}: ${verificationCode}`)

    // في التطبيق الحقيقي، ستتم إضافة خدمة إرسال البريد الإلكتروني هنا
    this.saveUsers()
  }

  // التحقق من البريد الإلكتروني
  verifyEmail(email, code) {
    const user = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase())

    if (!user) {
      return { success: false, message: "المستخدم غير موجود" }
    }

    if (user.emailVerified) {
      return { success: false, message: "البريد الإلكتروني مُحقق مسبقاً" }
    }

    if (!user.verificationCode || user.verificationCode !== code.toUpperCase()) {
      return { success: false, message: "رمز التحقق غير صحيح" }
    }

    if (user.verificationExpiry && user.verificationExpiry < Date.now()) {
      return { success: false, message: "انتهت صلاحية رمز التحقق" }
    }

    // تفعيل البريد الإلكتروني
    user.emailVerified = true
    user.verificationCode = null
    user.verificationExpiry = null
    this.saveUsers()

    return { success: true, message: "تم تحقق البريد الإلكتروني بنجاح" }
  }

  // معالجة الأخطاء
  handleError(errorType, error) {
    const errorLog = {
      type: errorType,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    }

    // حفظ سجل الأخطاء
    let errorLogs = JSON.parse(localStorage.getItem("errorLogs") || "[]")
    errorLogs.push(errorLog)

    // الاحتفاظ بآخر 100 خطأ فقط
    if (errorLogs.length > 100) {
      errorLogs = errorLogs.slice(-100)
    }

    localStorage.setItem("errorLogs", JSON.stringify(errorLogs))

    console.error("Auth System Error:", errorLog)
  }

  // عرض الإشعارات
  showNotification(message, type = "info") {
    if (window.notificationSystem) {
      window.notificationSystem.show(message, type)
    }
  }

  

  validateEmail(email) {
    return this.emailRegex.test(email)
  }

  sanitizeUser(user) {
    const { password, salt, verificationCode, ...sanitizedUser } = user
    return sanitizedUser
  }

  

  getCurrentUser() {
    return this.currentSession ? this.currentSession.user : null
  }

  isAuthenticated() {
    return this.currentSession !== null
  }

  logout() {
    this.clearSession()
    window.location.reload()
    return { success: true, message: "تم تسجيل الخروج بنجاح" }
  }

  checkExistingSession() {
    const sessionData = localStorage.getItem("userSession")
    const isLoggedIn = localStorage.getItem("isLoggedIn")

    if (sessionData && isLoggedIn === "true") {
      try {
        const session = JSON.parse(sessionData)

        // التحقق من انتهاء صلاحية الجلسة
        if (session.expiresAt && session.expiresAt < Date.now()) {
          this.clearSession()
          return false
        }

        const user = this.users.find((u) => u.id === session.userId)

        if (user && user.isActive) {
          this.currentSession = {
            user: this.sanitizeUser(user),
            loginTime: session.loginTime || new Date().toISOString(),
            token: session.token,
          }
          return true
        }
      } catch (error) {
        this.handleError("SESSION_CHECK_ERROR", error)
      }
    }

    this.clearSession()
    return false
  }
}

// إنشاء مثيل عالمي محسن
if (window.authSystem) {
  delete window.authSystem
}
window.authSystem = new SecureAuthSystem()

// تصدير للاستخدام العام
window.SecureAuthSystem = SecureAuthSystem
