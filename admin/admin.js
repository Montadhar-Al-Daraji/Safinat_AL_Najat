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

// تهيئة Supabase
async function initSupabase() {
    try {
        if (window.supabase && !isSupabaseInitialized) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase initialized successfully');
            
            // اختبار الاتصال
            try {
                const { error } = await supabase.from('books').select('id').limit(1);
                if (error) {
                    console.error('Failed to connect to database:', error);
                    isConnected = false;
                } else {
                    console.log('Database connection successful');
                    isConnected = true;
                }
            } catch (testError) {
                console.error('Error testing connection:', testError);
                isConnected = false;
            }
            
            isSupabaseInitialized = true;
            return isConnected;
        }
        return isConnected;
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        return false;
    }
}

// دالات المصادقة
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

function showLoginPage() {
    const loginContainer = document.getElementById('login-container');
    const adminContainer = document.getElementById('admin-container');
    
    if (loginContainer) loginContainer.classList.remove('hidden');
    if (adminContainer) adminContainer.classList.add('hidden');
}

function hideLoginPage() {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) loginContainer.classList.add('hidden');
}

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
            await logout();
            return false;
        }
        
        currentAdmin = JSON.parse(adminData);
        showAdminPage();
        return true;
    } catch (error) {
        await logout();
        return false;
    }
}

async function logout() {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminData');
    currentAdmin = null;
    showLoginPage();
}

// دالات إدارة البيانات
async function loadAdminData() {
    try {
        showLoading(true);
        
        if (isConnected) {
            const promises = [
                supabase.from(TABLES.BOOKS).select('*'),
                supabase.from(TABLES.NOVELS).select('*'),
                supabase.from(TABLES.FILES).select('*'),
                supabase.from(TABLES.PLATFORMS).select('*'),
                supabase.from(TABLES.APPS).select('*'),
                supabase.from(TABLES.SERVERS).select('*')
            ];
            
            const results = await Promise.all(promises);
            
            siteData.books = results[0].data || [];
            siteData.novels = results[1].data || [];
            siteData.files = results[2].data || [];
            siteData.platforms = results[3].data || [];
            siteData.apps = results[4].data || [];
            siteData.servers = results[5].data || [];
        }
        
        renderAllAdminLists();
        
    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
        showLoading(false);
    }
}

function renderAllAdminLists() {
    // يمكنك إضافة وظيفة العرض هنا لاحقًا
    console.log('Data loaded:', siteData);
}

// إعداد event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await login();
        });
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// دالة تسجيل الدخول
async function login() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorElement = document.getElementById('login-error');
    
    if (!emailInput || !passwordInput || !errorElement) return;
    
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
        if (!isConnected) {
            errorElement.textContent = 'لا يمكن الاتصال بقاعدة البيانات حالياً';
            return;
        }
        
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .eq('is_active', true)
            .maybeSingle();

        if (error || !admin) {
            errorElement.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            return;
        }
        
        if (password !== atob(admin.password_hash)) {
            errorElement.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            return;
        }
        
        // حفظ بيانات المشرف
        const token = btoa(JSON.stringify({
            id: admin.id,
            email: admin.email,
            role: admin.role,
            exp: Math.floor(Date.now() / 1000) + (60 * 60)
        }));
        
        sessionStorage.setItem('adminToken', token);
        sessionStorage.setItem('adminData', JSON.stringify(admin));
        currentAdmin = admin;
        
        showAdminPage();
        
    } catch (error) {
        console.error('Login error:', error);
        errorElement.textContent = 'حدث خطأ غير متوقع أثناء تسجيل الدخول';
    }
}

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', async function() {
    try {
        showLoginPage();
        await initSupabase();
        setupEventListeners();
        
        const token = sessionStorage.getItem('adminToken');
        if (token) {
            await checkAuth();
        }
    } catch (error) {
        console.error('Error initializing admin panel:', error);
    }
});
