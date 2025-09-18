// admin.js - الكود الكامل والمدمج
const SUPABASE_URL = 'https://xzltdsmmolyvcmkfzedf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhbmFzZSIsInJlZiI6Inh6bHRkc21tb2x5dmNta2Z6ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg1NzEsImV4cCI6MjA3MzI1NDU3MX0.3TJ49ctEhOT1KDIFtZXFw2jwTq57ujaWbqNNJ2Eeb1U';
const SESSION_TIMEOUT = 30 * 60;
const ITEMS_PER_PAGE = 10;

const TABLES = {
    BOOKS: 'books',
    NOVELS: 'novels',
    FILES: 'files',
    PLATFORMS: 'platforms',
    APPS: 'apps',
    SERVERS: 'servers',
    ADMINS: 'admins',
    SECURITY_LOGS: 'security_logs',
    SITE_SETTINGS: 'site_settings'
};

const CATEGORY_NAMES = {
    books: 'كتاب',
    novels: 'رواية',
    files: 'ملف',
    platforms: 'منصة',
    apps: 'تطبيق',
    servers: 'سيرفر'
};

// المتغيرات العامة
let supabase;
let isSupabaseInitialized = false;
let isConnected = false;
let currentAdmin = null;
let sessionTimer;
let siteData = {
    books: [],
    novels: [],
    files: [],
    platforms: [],
    apps: [],
    servers: [],
    admins: []
};

// ===== الدوال المساعدة =====

// دالة الإشعارات
function showNotification(message, type = 'info') {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.backgroundColor = type === 'error' ? '#f44336' : 
                                      type === 'success' ? '#4CAF50' : '#2196F3';
    
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
    }, 3000);
}

// دالة التحميل
function showLoading(show = true) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// تحقق من صحة البريد الإلكتروني
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// تحقق من قوة كلمة المرور
function isStrongPassword(password) {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return strongRegex.test(password);
}

// تهريب HTML
function escapeHtml(text) {
    if (typeof text !== 'string') {
        return text;
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== إدارة Supabase =====

// تهيئة Supabase
async function initSupabase() {
    try {
        if (window.supabase && !isSupabaseInitialized) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            });
            
            console.log('Supabase initialized successfully');
            
            // اختبار الاتصال باستخدام استعلام أبسط
            try {
                const { error } = await supabase
                    .from('books')
                    .select('id')
                    .limit(1);
                    
                if (error) {
                    console.error('Failed to connect to database:', error);
                    isConnected = false;
                } else {
                    console.log('Database connection successful');
                    isConnected = true;
                }
            } catch (testError) {
                console.error('Error testing database connection:', testError);
                isConnected = false;
            }
            
            isSupabaseInitialized = true;
            return isConnected;
        } else if (isSupabaseInitialized) {
            return isConnected;
        } else {
            console.error('Supabase library not loaded');
            isSupabaseInitialized = true;
            return false;
        }
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        isSupabaseInitialized = true;
        return false;
    }
}

// التأكد من اتصال Supabase
async function ensureSupabaseConnection() {
    if (!isSupabaseInitialized) {
        return await initSupabase();
    }
    return isConnected;
}

// ===== إدارة المصادقة والجلسات =====

// تحليل Token
function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

// عرض صفحة التسجيل
function showLoginPage() {
    const loginContainer = document.getElementById('login-container');
    const adminContainer = document.getElementById('admin-container');
    
    if (loginContainer) loginContainer.classList.remove('hidden');
    if (adminContainer) adminContainer.classList.add('hidden');
    
    document.addEventListener('keypress', handleLoginKeyPress);
}

// إخفاء صفحة التسجيل
function hideLoginPage() {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) loginContainer.classList.add('hidden');
    
    document.removeEventListener('keypress', handleLoginKeyPress);
}

// التعامل مع ضغط المفاتيح في التسجيل
function handleLoginKeyPress(e) {
    if (e.key === 'Enter') {
        login();
    }
}

// عرض لوحة التحكم
function showAdminPage() {
    hideLoginPage();
    const adminContainer = document.getElementById('admin-container');
    if (adminContainer) adminContainer.classList.remove('hidden');
    
    if (currentAdmin) {
        document.getElementById('admin-email').textContent = currentAdmin.email;
        document.getElementById('admin-role').textContent = currentAdmin.role === 'owner' ? 'مالك' : 'مشرف';
    }
    
    loadAdminData();
}

// بدء مؤقت الجلسة
function startSessionTimer() {
    clearInterval(sessionTimer);
    let timeLeft = SESSION_TIMEOUT;
    
    sessionTimer = setInterval(() => {
        timeLeft--;
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        document.getElementById('session-timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(sessionTimer);
            alert('انتهت مدة الجلسة، يرجى تسجيل الدخول مرة أخرى');
            logout();
        }
    }, 1000);
}

// إعادة تعيين الجلسة
function resetSession() {
    startSessionTimer();
    alert('تم تجديد الجلسة بنجاح');
}

// تسجيل الخروج
async function logout() {
    if (currentAdmin) {
        // محاولة تسجيل event الخروج إذا كان هناك اتصال
        try {
            const connected = await ensureSupabaseConnection();
            if (connected) {
                const ip = await getClientIP();
                await supabase
                    .from('security_logs')
                    .insert([{
                        admin_id: currentAdmin.id,
                        admin_email: currentAdmin.email,
                        action_type: 'logout',
                        details: { email: currentAdmin.email },
                        ip_address: ip,
                        user_agent: navigator.userAgent,
                        status: 'success',
                        created_at: new Date().toISOString()
                    }]);
            }
        } catch (error) {
            console.error('Error logging logout event:', error);
        }
    }
    
    clearInterval(sessionTimer);
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminData');
    currentAdmin = null;
    
    showLoginPage();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorElement = document.getElementById('login-error');
    
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (errorElement) errorElement.textContent = '';
}

// التحقق من المصادقة
async function checkAuth() {
    const token = sessionStorage.getItem('adminToken');
    const adminData = sessionStorage.getItem('adminData');
    
    if (!token || !adminData) {
        showLoginPage();
        return false;
    }
    
    try {
        const tokenData = parseJwt(token);
        if (tokenData.exp * 1000 < Date.now()) {
            console.error('Token expired');
            await logout();
            return false;
        }
        
        currentAdmin = JSON.parse(adminData);
        showAdminPage();
        setupAdminInterface(currentAdmin.role);
        startSessionTimer();
        
        return true;
    } catch (error) {
        console.error('Error parsing admin data:', error);
        await logout();
        return false;
    }
}

// إعداد واجهة المشرف
function setupAdminInterface(role) {
    const adminsTab = document.getElementById('admins-tab');
    const securityTab = document.getElementById('security-tab');
    
    if (adminsTab) {
        adminsTab.style.display = role === 'owner' ? 'block' : 'none';
    }
    
    if (securityTab) {
        securityTab.style.display = role === 'owner' ? 'block' : 'none';
    }
}

// الحصول على IP العميل
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

// ===== إدارة البيانات =====

// تسجيل الدخول
async function login() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorElement = document.getElementById('login-error');
    const loginBtn = document.querySelector('.login-btn');
    
    if (!emailInput || !passwordInput || !errorElement || !loginBtn) {
        console.error('Login elements not found');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    errorElement.textContent = '';
    
    if (!email || !password) {
        errorElement.textContent = 'يرجى ملء جميع الحقول';
        return;
    }
    
    if (!isValidEmail(email)) {
        errorElement.textContent = 'صيغة البريد الإلكتروني غير صحيحة';
        return;
    }
    
    try {
        // التأكد من اتصال Supabase
        const connected = await ensureSupabaseConnection();
        if (!connected) {
            errorElement.textContent = 'لا يمكن الاتصال بقاعدة البيانات حالياً';
            return;
        }
        
        // إظهار تحميل
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
        loginBtn.disabled = true;
        
        // البحث عن المشرف في قاعدة البيانات
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .eq('is_active', true)
            .maybeSingle();

        if (error) {
            console.error('Supabase error:', error);
            
            if (error.code === '42501' || error.message.includes('permission')) {
                errorElement.textContent = 'لا تملك الصلاحية للوصول إلى بيانات المشرفين';
            } else if (error.code === '401') {
                errorElement.textContent = 'مفتاح API غير صالح أو منتهي الصلاحية';
            } else {
                errorElement.textContent = 'خطأ في الاتصال بقاعدة البيانات: ' + error.message;
            }
            return;
        }

        if (!admin) {
            errorElement.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            return;
        }
        
        // التحقق من كلمة المرور
        if (password !== atob(admin.password_hash)) {
            errorElement.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            return;
        }
        
        // تحديث آخر وقت دخول
        const { error: updateError } = await supabase
            .from('admins')
            .update({ last_login: new Date().toISOString() })
            .eq('id', admin.id);

        if (updateError) {
            console.error('Error updating last login:', updateError);
        }

        // إنشاء توكن
        const tokenPayload = {
            id: admin.id,
            email: admin.email,
            role: admin.role,
            exp: Math.floor(Date.now() / 1000) + (60 * 60)
        };
        
        const token = btoa(JSON.stringify(tokenPayload));
        
        // حفظ بيانات المشرف
        sessionStorage.setItem('adminToken', token);
        sessionStorage.setItem('adminData', JSON.stringify(admin));
        currentAdmin = admin;
        
        // تسجيل محاولة الدخول الناجحة
        await logLoginAttempt(email, true);
        
        // إظهار لوحة التحكم
        showAdminPage();
        
    } catch (error) {
        console.error('Login error:', error);
        errorElement.textContent = 'حدث خطأ غير متوقع أثناء تسجيل الدخول: ' + error.message;
    } finally {
        // إعادة تعيين الزر في جميع الحالات
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> دخول';
            loginBtn.disabled = false;
        }
    }
}

// تحميل بيانات المشرف
async function loadAdminData() {
    try {
        showLoading(true);
        
        // محاولة تحميل البيانات من Supabase إذا كان متصلاً
        try {
            await ensureSupabaseConnection();
            
            const promises = [
                supabase.from(TABLES.BOOKS).select('*'),
                supabase.from(TABLES.NOVELS).select('*'),
                supabase.from(TABLES.FILES).select('*'),
                supabase.from(TABLES.PLATFORMS).select('*'),
                supabase.from(TABLES.APPS).select('*'),
                supabase.from(TABLES.SERVERS).select('*')
            ];
            
            if (currentAdmin.role === 'owner') {
                promises.push(supabase.from(TABLES.ADMINS).select('*'));
            } else {
                promises.push(Promise.resolve({ data: [] }));
            }
            
            const [
                booksData, 
                novelsData, 
                filesData, 
                platformsData, 
                appsData, 
                serversData, 
                adminsData
            ] = await Promise.all(promises);

            siteData.books = booksData.data || [];
            siteData.novels = novelsData.data || [];
            siteData.files = filesData.data || [];
            siteData.platforms = platformsData.data || [];
            siteData.apps = appsData.data || [];
            siteData.servers = serversData.data || [];
            siteData.admins = adminsData.data || [];
        } catch (error) {
            console.error('Error loading data from Supabase:', error);
            // إذا فشل تحميل البيانات من Supabase، نستخدم بيانات افتراضية فارغة
            siteData.books = [];
            siteData.novels = [];
            siteData.files = [];
            siteData.platforms = [];
            siteData.apps = [];
            siteData.servers = [];
            siteData.admins = [];
        }

        renderAllAdminLists();
        setupSearchFunctionality();
        
        if (currentAdmin.role === 'owner') {
            updateAdminStats();
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('حدث خطأ في تحميل البيانات: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// عرض جميع القوائم
function renderAllAdminLists() {
    renderAdminList('books', siteData.books);
    renderAdminList('novels', siteData.novels);
    renderAdminList('files', siteData.files);
    renderAdminList('platforms', siteData.platforms);
    renderAdminList('apps', siteData.apps);
    renderAdminList('servers', siteData.servers);
    
    if (currentAdmin.role === 'owner') {
        renderAdminsList(siteData.admins);
    }
}

// عرض قائمة المشرفين
function renderAdminsList(admins) {
    const listElement = document.getElementById('admins-list');
    if (!listElement) return;
    
    listElement.innerHTML = '';
    
    if (!admins || admins.length === 0) {
        listElement.innerHTML = '<p class="no-items">لا يوجد مشرفين</p>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    admins.forEach(admin => {
        const isCurrentAdmin = currentAdmin && admin.id === currentAdmin.id;
        
        const adminItem = document.createElement('div');
        adminItem.className = 'admin-item';
        
        const adminInfo = document.createElement('div');
        adminInfo.className = 'admin-info';
        
        const emailHeading = document.createElement('h3');
        emailHeading.textContent = escapeHtml(admin.email);
        
        const fullName = document.createElement('p');
        fullName.textContent = `الاسم: ${admin.full_name || 'غير محدد'}`;
        
        const createdAt = document.createElement('p');
        createdAt.textContent = `تم الإنشاء: ${new Date(admin.created_at).toLocaleDateString('ar-EG')}`;
        
        const lastLogin = document.createElement('p');
        lastLogin.textContent = `آخر دخول: ${admin.last_login ? new Date(admin.last_login).toLocaleDateString('ar-EG') : 'لم يسجل دخول بعد'}`;
        
        const roleSpan = document.createElement('span');
        roleSpan.className = `admin-role role-${admin.role}`;
        roleSpan.textContent = admin.role === 'owner' ? 'مالك' : 'مشرف';
        
        adminInfo.appendChild(emailHeading);
        adminInfo.appendChild(fullName);
        adminInfo.appendChild(createdAt);
        adminInfo.appendChild(lastLogin);
        adminInfo.appendChild(roleSpan);
        
        const adminActions = document.createElement('div');
        adminActions.className = 'admin-actions';
        
        if (!isCurrentAdmin && currentAdmin.role === 'owner') {
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-admin';
            deleteButton.textContent = 'حذف';
            deleteButton.addEventListener('click', () => {
                deleteAdmin(admin.id, admin.email);
            });
            adminActions.appendChild(deleteButton);
        } else {
            const noDeleteSpan = document.createElement('span');
            noDeleteSpan.style.color = '#ccc';
            noDeleteSpan.textContent = 'لا يمكن حذف حسابك';
            adminActions.appendChild(noDeleteSpan);
        }
        
        adminItem.appendChild(adminInfo);
        adminItem.appendChild(adminActions);
        
        fragment.appendChild(adminItem);
    });
    
    listElement.innerHTML = '';
    listElement.appendChild(fragment);
}

// تحديث إحصائيات المشرفين
function updateAdminStats() {
    const totalAdmins = siteData.admins.length;
    const totalOwners = siteData.admins.filter(admin => admin.role === 'owner').length;
    const totalAdminsCount = siteData.admins.filter(admin => admin.role === 'admin').length;
    
    document.getElementById('total-admins').textContent = totalAdmins;
    document.getElementById('total-owners').textContent = totalOwners;
    document.getElementById('total-admins-count').textContent = totalAdminsCount;
}

// ===== إعداد event listeners =====

// إعداد جميع event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // إعداد نموذج تسجيل الدخول
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await login();
        });
    }
    
    const togglePasswordBtn = document.getElementById('toggle-password');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                passwordInput.type = 'password';
                this.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    const addAdminForm = document.getElementById('add-admin-form');
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('new-admin-email').value;
            const password = document.getElementById('new-admin-password').value;
            const role = document.getElementById('new-admin-role').value;
            
            if (email && password && role) {
                const success = await addAdmin(email, password, role);
                if (success) {
                    this.reset();
                }
            }
        });
    }
    
    const refreshAdminsBtn = document.getElementById('refresh-admins-btn');
    if (refreshAdminsBtn) {
        refreshAdminsBtn.addEventListener('click', function() {
            loadAdminsList();
        });
    }
    
    const resetSessionBtn = document.getElementById('reset-session-btn');
    if (resetSessionBtn) {
        resetSessionBtn.addEventListener('click', resetSession);
    }
    
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', changePassword);
    }
    
    const closePasswordModal = document.getElementById('close-password-modal');
    if (closePasswordModal) {
        closePasswordModal.addEventListener('click', function() {
            closeModal('password-modal');
        });
    }
    
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('سيتم تنفيذ تغيير كلمة المرور هنا');
            closeModal('password-modal');
        });
    }
    
    setupTabs();
    
    window.addEventListener('click', function(event) {
        const passwordModal = document.getElementById('password-modal');
        if (event.target === passwordModal) {
            closeModal('password-modal');
        }
    });
    
    // إعداد أزرار الإضافة
    const addButtons = [
        'add-book-btn', 'add-novel-btn', 'add-file-btn', 
        'add-platform-btn', 'add-app-btn', 'add-server-btn'
    ];

    addButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            const section = buttonId.replace('add-', '').replace('-btn', '');
            button.addEventListener('click', () => openAddItemModal(section));
        }
    });

    // إعداد نموذج العنصر
    const itemForm = document.getElementById('item-form');
    if (itemForm) {
        itemForm.addEventListener('submit', saveItem);
    }

    const closeItemModal = document.getElementById('close-item-modal');
    if (closeItemModal) {
        closeItemModal.addEventListener('click', function() {
            closeModal('item-modal');
        });
    }
}

// إعداد التبويبات
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const panels = document.querySelectorAll('.admin-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            panels.forEach(panel => {
                panel.classList.remove('active');
            });
            
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            const targetPanel = document.getElementById(`${tabName}-panel`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                button.classList.add('active');
                
                if (tabName === 'admins' && currentAdmin.role === 'owner') {
                    loadAdminsList();
                }
            }
        });
    });
}

// ===== التهيئة الرئيسية =====

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // إظهار واجهة تسجيل الدخول أولاً
        showLoginPage();
        
        // محاولة تهيئة Supabase في الخلفية
        setTimeout(async () => {
            try {
                const supabaseInitialized = await initSupabase();
                if (!supabaseInitialized) {
                    console.warn('فشل في تهيئة قاعدة البيانات، سيتم العمل في وضع عدم الاتصال');
                }
                
                setupEventListeners();
                
                // التحقق من المصادقة إذا كان هناك token مخزن
                const token = sessionStorage.getItem('adminToken');
                if (token) {
                    await checkAuth();
                }
            } catch (error) {
                console.error('Error in background initialization:', error);
            }
        }, 100);
    } catch (error) {
        console.error('Error initializing admin panel:', error);
    }
});
