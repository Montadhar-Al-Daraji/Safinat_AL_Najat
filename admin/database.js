// تعريف دالة showNotification إذا لم تكن معرّفة
if (typeof showNotification !== 'function') {
    function showNotification(message, type = 'info') {
        // إنشاء عنصر الإشعار إذا لم يكن موجودًا
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
        
        // تعيين النص والنمط حسب النوع
        notification.textContent = message;
        notification.style.backgroundColor = type === 'error' ? '#f44336' : 
                                          type === 'success' ? '#4CAF50' : '#2196F3';
        
        // إظهار الإشعار
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
        
        // إخفاء الإشعار بعد 3 ثوان
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
        }, 3000);
    }
}

// admin/database.js
const SUPABASE_URL = 'https://xzltdsmmolyvcmkfzedf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhbmFzZSIsInJlZiI6Inh6bHRkc21tb2x5dmNta2Z6ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg1NzEsImV4cCI6MjA3MzI1NDU3MX0.3TJ49ctEhOT1KDIFtZXFw2jwTq57ujaWbqNNJ2Eeb1U';

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

let supabase;
let isSupabaseInitialized = false;


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
            const { error } = await supabase
                .from('books')
                .select('id')
                .limit(1);
                
            if (error) {
                console.error('Failed to connect to database:', error);
                // حتى لو فشل الاتصال، نعتبر Supabase مهيأ للاستخدام في الوضع غير المتصل
                isSupabaseInitialized = true;
                return false;
            }
            
            console.log('Database connection successful');
            isSupabaseInitialized = true;
            return true;
        } else if (isSupabaseInitialized) {
            return true;
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

async function ensureSupabaseConnection() {
    if (!isSupabaseInitialized) {
        const initialized = await initSupabase();
        if (!initialized) {
            // إذا فشل الاتصال، نرمي خطأ ولكننا نسمح للتطبيق بالاستمرار
            throw new Error('فشل في الاتصال بقاعدة البيانات');
        }
    }
    return true;
}

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
        // إظهار تحميل
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
        loginBtn.disabled = true;
        
        // محاولة الاتصال بـ Supabase
        let admin = null;
        try {
            await ensureSupabaseConnection();
            
            // البحث عن المشرف في قاعدة البيانات
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .eq('email', email)
                .eq('is_active', true)
                .maybeSingle();

            if (error) {
                console.error('Supabase error:', error);
                // حتى لو كان هناك خطأ، نستمر في محاولة التسجيل باستخدام البيانات المحلية
            } else {
                admin = data;
            }
        } catch (connectionError) {
            console.error('Connection error, using offline mode:', connectionError);
            // في حالة عدم الاتصال، نستخدم البيانات من sessionStorage إذا كانت موجودة
            const storedAdminData = sessionStorage.getItem('adminData');
            if (storedAdminData) {
                const storedAdmin = JSON.parse(storedAdminData);
                if (storedAdmin.email === email) {
                    admin = storedAdmin;
                }
            }
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
        
        // إظهار لوحة التحكم
        showAdminPage();
        
    } catch (error) {
        console.error('Login error:', error);
        errorElement.textContent = 'حدث خطأ غير متوقع أثناء تسجيل الدخول: ' + error.message;
    } finally {
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> دخول';
            loginBtn.disabled = false;
        }
    }
}

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

async function saveItemToSupabase(table, item) {
    await ensureSupabaseConnection();
    
    // إضافة الحقول الإضافية بناءً على الجدول
    switch(table) {
        case 'books':
        case 'novels':
            item.publication_year = item.publication_year || new Date().getFullYear();
            item.language = item.language || 'العربية';
            item.file_format = item.file_format || 'PDF';
            item.is_featured = item.is_featured || false;
            item.views_count = item.views_count || 0;
            item.downloads_count = item.downloads_count || 0;
            item.is_active = item.is_active !== undefined ? item.is_active : true;
            break;
            
        case 'files':
            item.is_featured = item.is_featured || false;
            item.views_count = item.views_count || 0;
            item.downloads_count = item.downloads_count || 0;
            item.is_active = item.is_active !== undefined ? item.is_active : true;
            break;
            
        case 'platforms':
            item.is_featured = item.is_featured || false;
            item.views_count = item.views_count || 0;
            item.is_active = item.is_active !== undefined ? item.is_active : true;
            break;
            
        case 'apps':
            item.is_featured = item.is_featured || false;
            item.views_count = item.views_count || 0;
            item.downloads_count = item.downloads_count || 0;
            item.is_active = item.is_active !== undefined ? item.is_active : true;
            break;
            
        case 'servers':
            item.members_count = item.members_count || 0;
            item.is_featured = item.is_featured || false;
            item.views_count = item.views_count || 0;
            item.is_active = item.is_active !== undefined ? item.is_active : true;
            break;
    }
    
    item.updated_at = new Date().toISOString();
    
    if (!item.id) {
        // عنصر جديد
        item.added_by = currentAdmin.id;
        item.created_at = new Date().toISOString();
        
        const { data, error } = await supabase
            .from(table)
            .insert([item])
            .select();

        if (error) {
            console.error('Error saving item:', error);
            throw error;
        }

        return data[0];
    } else {
        // تحديث عنصر موجود
        const { data, error } = await supabase
            .from(table)
            .update(item)
            .eq('id', item.id)
            .select();

        if (error) {
            console.error('Error updating item:', error);
            throw error;
        }

        return data[0];
    }
}

async function deleteItemFromSupabase(table, id) {
    await ensureSupabaseConnection();
    
    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting item:', error);
        throw error;
    }
}

async function addAdmin(email, password, role) {
    await ensureSupabaseConnection();
    
    if (!currentAdmin || currentAdmin.role !== 'owner') {
        showNotification('只有所有者可以添加管理员', 'error');
        return false;
    }
    
    if (!isValidEmail(email) || !email.endsWith('@gmail.com')) {
        showNotification('يجب أن يكون البريد الإلكتروني من نوع @gmail.com', 'error');
        return false;
    }
    
    if (!isStrongPassword(password)) {
        showNotification('كلمة المرور يجب أن تحتوي على الأقل على 8 أحرف، وتشمل أحرف كبيرة وصغيرة وأرقام', 'error');
        return false;
    }
    
    try {
        const passwordHash = btoa(password);
        
        const { data, error } = await supabase
            .from(TABLES.ADMINS)
            .insert([{ 
                email, 
                password_hash: passwordHash, 
                role,
                full_name: email.split('@')[0], // استخدام جزء من الإيميل كاسم
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select();
            
        if (error) {
            console.error('Error adding admin:', error);
            showNotification('حدث خطأ أثناء إضافة المشرف: ' + error.message, 'error');
            return false;
        }
        
        showNotification('تمت إضافة المشرف بنجاح', 'success');
        await loadAdminsList();
        return true;
    } catch (error) {
        console.error('Error adding admin:', error);
        showNotification('حدث خطأ أثناء إضافة المشرف', 'error');
        return false;
    }
}

function isStrongPassword(password) {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return strongRegex.test(password);
}

async function logLoginAttempt(email, success) {
    try {
        await ensureSupabaseConnection();
        const ip = await getClientIP();
        const { error } = await supabase
            .from('security_logs')
            .insert([{
                admin_id: currentAdmin?.id || null,
                admin_email: email,
                action_type: 'login_attempt',
                details: { success, email },
                ip_address: ip,
                user_agent: navigator.userAgent,
                status: success ? 'success' : 'failed',
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('Error logging login attempt:', error);
        }
    } catch (error) {
        console.error('Error logging login attempt (connection issue):', error);
        // لا نرمي الخطأ حتى لا نؤثر على تدفق التطبيق
    }
}

async function logLogoutEvent(email) {
    try {
        await ensureSupabaseConnection();
        const ip = await getClientIP();
        const { error } = await supabase
            .from('security_logs')
            .insert([{
                admin_id: currentAdmin?.id || null,
                admin_email: email,
                action_type: 'logout',
                details: { email },
                ip_address: ip,
                user_agent: navigator.userAgent,
                status: 'success',
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('Error logging logout event:', error);
        }
    } catch (error) {
        console.error('Error logging logout event:', error);
    }
}

async function logDeletionEvent(table, itemId, itemTitle) {
    try {
        await ensureSupabaseConnection();
        const { error } = await supabase
            .from('security_logs')
            .insert([{
                admin_id: currentAdmin.id,
                admin_email: currentAdmin.email,
                action_type: 'delete',
                target_table: table,
                target_id: itemId,
                details: { table, item_id: itemId, item_title: itemTitle },
                status: 'success',
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('Error logging deletion event:', error);
        }
    } catch (error) {
        console.error('Error logging deletion event:', error);
    }
}
