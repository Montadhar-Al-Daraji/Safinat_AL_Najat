// تعريف المتغيرات العامة
let supabase;
let currentAdmin = null;
let siteData = {
    books: [],
    novels: [],
    files: [],
    platforms: [],
    apps: [],
    servers: []
};

// ثوابت Supabase - يجب تخزينها بشكل آمن في بيئة الإنتاج
const SUPABASE_URL = 'https://xzltdsmmolyvcmkfzedf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHRkc21tb2x5dmNta2Z6ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg�أكمل من فضلك، يبدو أن الرد كان طويلاً جداً وتوقف في منتصف ملف JavaScript. إليك باقي الملف:

```javascript
// ثوابت Supabase - يجب تخزينها بشكل آمن في بيئة الإنتاج
const SUPABASE_URL = 'https://xzltdsmmolyvcmkfzedf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHRkc21tb2x5dmNta2Z6ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg1NzEsImV4cCI6MjA3MzI1NDU3MX0.3TJ49ctEhOT1KDIFtZXFw2jwTq57ujaWbqNNJ2Eeb1U';

// تهيئة Supabase
function initSupabase() {
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
        return true;
    } else {
        console.error('Supabase library not loaded');
        return false;
    }
}

// التحقق من المصادقة عند تحميل الصفحة
function checkAuth() {
    const token = sessionStorage.getItem('adminToken');
    const adminData = sessionStorage.getItem('adminData');
    
    if (!token || !adminData) {
        showLoginPage();
        return false;
    }
    
    try {
        // التحقق من صلاحية التوكن
        const tokenData = parseJwt(token);
        if (tokenData.exp * 1000 < Date.now()) {
            console.error('Token expired');
            logout();
            return false;
        }
        
        currentAdmin = JSON.parse(adminData);
        showAdminPage();
        setupAdminInterface(currentAdmin.role);
        return true;
    } catch (error) {
        console.error('Error parsing admin data:', error);
        logout();
        return false;
    }
}

// تحليل JWT token
function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

// إظهار صفحة تسجيل الدخول
function showLoginPage() {
    const loginContainer = document.getElementById('login-container');
    const adminContainer = document.getElementById('admin-container');
    
    if (loginContainer) loginContainer.classList.remove('hidden');
    if (adminContainer) adminContainer.classList.add('hidden');
    
    // إضافة event listener للدخول بالضغط على Enter
    document.addEventListener('keypress', handleLoginKeyPress);
}

// إخفاء صفحة تسجيل الدخول
function hideLoginPage() {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) loginContainer.classList.add('hidden');
    
    // إزالة event listener للدخول بالضغط على Enter
    document.removeEventListener('keypress', handleLoginKeyPress);
}

// التعامل مع الضغط على Enter في تسجيل الدخول
function handleLoginKeyPress(e) {
    if (e.key === 'Enter') {
        login();
    }
}

// إظهار لوحة التحكم
function showAdminPage() {
    hideLoginPage();
    const adminContainer = document.getElementById('admin-container');
    if (adminContainer) adminContainer.classList.remove('hidden');
}

// تسجيل الدخول
async function login() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorElement = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn');
    
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
    
    // التحقق من صحة البريد الإلكتروني
    if (!isValidEmail(email)) {
        errorElement.textContent = 'صيغة البريد الإلكتروني غير صحيحة';
        return;
    }
    
    try {
        // إظهار تحميل
        const originalText = loginBtn.textContent;
        loginBtn.textContent = 'جاري تسجيل الدخول...';
        loginBtn.disabled = true;
        
        // البحث عن المشرف في قاعدة البيانات
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !admin) {
            errorElement.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
            return;
        }
        
        // التحقق من كلمة المرور (يجب استخدام مقارنة آمنة في بيئة الإنتاج)
        if (password !== atob(admin.password_hash)) {
            errorElement.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
            
            // تسجيل محاولة الدخول الفاشلة
            logLoginAttempt(email, false);
            return;
        }
        
        // إنشاء توكن وهمي (يجب استخدام JWT حقيقي من الخادم في بيئة الإنتاج)
        const fakeToken = btoa(JSON.stringify({
            id: admin.id,
            email: admin.email,
            role: admin.role,
            exp: Math.floor(Date.now() / 1000) + (60 * 60) // انتهاء الصلاحية بعد ساعة
        }));
        
        // حفظ بيانات المشرف
        sessionStorage.setItem('adminToken', fakeToken);
        sessionStorage.setItem('adminData', JSON.stringify(admin));
        currentAdmin = admin;
        
        // تسجيل محاولة الدخول الناجحة
        logLoginAttempt(email, true);
        
        // إظهار لوحة التحكم
        showAdminPage();
        
        // تحميل البيانات وإعداد الواجهة
        await loadAdminData();
        setupAdminInterface(admin.role);
        
        // إعادة تعيين الزر
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
        
    } catch (error) {
        console.error('Login error:', error);
        if (errorElement) {
            errorElement.textContent = 'حدث خطأ أثناء تسجيل الدخول';
        }
        
        // إعادة تعيين الزر في حالة الخطأ
        if (loginBtn) {
            loginBtn.textContent = 'دخول';
            loginBtn.disabled = false;
        }
    }
}

// التحقق من صحة البريد الإلكتروني
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// تسجيل محاولات الدخول
async function logLoginAttempt(email, success) {
    try {
        await supabase
            .from('login_attempts')
            .insert([{
                email: email,
                success: success,
                ip: await getClientIP(),
                user_agent: navigator.userAgent,
                timestamp: new Date()
            }]);
    } catch (error) {
        console.error('Error logging login attempt:', error);
    }
}

// الحصول على IP العميل (وهمي - يحتاج إلى تطبيق في الخادم)
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

// تسجيل الخروج
function logout() {
    // تسجيل حدث تسجيل الخروج
    logLogoutEvent(currentAdmin.email);
    
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminData');
    currentAdmin = null;
    
    showLoginPage();
    
    // مسح الحقول
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorElement = document.getElementById('login-error');
    
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (errorElement) errorElement.textContent = '';
}

// تسجيل حدث تسجيل الخروج
async function logLogoutEvent(email) {
    try {
        await supabase
            .from('logout_events')
            .insert([{
                email: email,
                timestamp: new Date()
            }]);
    } catch (error) {
        console.error('Error logging logout event:', error);
    }
}

// إعداد واجهة المشرفين حسب الصلاحية
function setupAdminInterface(role) {
    const adminsTab = document.getElementById('admins-tab');
    const adminsPanel = document.getElementById('admins-panel');
    
    if (adminsTab && adminsPanel) {
        if (role === 'owner') {
            adminsTab.style.display = 'block';
            loadAdminsList();
        } else {
            adminsTab.style.display = 'none';
            adminsPanel.style.display = 'none';
            
            // إذا كان التبويب النشط هو تبويب المشرفين، نغير إلى تبويب آخر
            const activeTab = document.querySelector('.tab-button.active');
            if (activeTab && activeTab.dataset.tab === 'admins') {
                const booksTab = document.querySelector('[data-tab="books"]');
                if (booksTab) booksTab.click();
            }
        }
    }
}

// تحميل البيانات من Supabase
async function loadAdminData() {
    if (!supabase) {
        if (!initSupabase()) {
            alert('خطأ في تهيئة قاعدة البيانات');
            return;
        }
    }
    
    try {
        // إظهار تحميل في جميع الأقسام
        document.querySelectorAll('.items-list').forEach(list => {
            if (list) list.innerHTML = '<p class="no-items">جاري تحميل البيانات...</p>';
        });
        
        // جلب البيانات من كل جدول
        const [booksData, novelsData, filesData, platformsData, appsData, serversData] = await Promise.all([
            supabase.from('books').select('*'),
            supabase.from('novels').select('*'),
            supabase.from('files').select('*'),
            supabase.from('platforms').select('*'),
            supabase.from('apps').select('*'),
            supabase.from('servers').select('*')
        ]);

        // معالجة البيانات
        siteData.books = booksData.data || [];
        siteData.novels = novelsData.data || [];
        siteData.files = filesData.data || [];
        siteData.platforms = platformsData.data || [];
        siteData.apps = appsData.data || [];
        siteData.servers = serversData.data || [];

        renderAllAdminLists();
        setupSearchFunctionality();
        
    } catch (error) {
        console.error('Error loading data:', error);
        alert('حدث خطأ في تحميل البيانات: ' + error.message);
    }
}

// تحميل قائمة المشرفين
async function loadAdminsList() {
    if (!currentAdmin || currentAdmin.role !== 'owner') {
        return;
    }
    
    try {
        const { data: admins, error } = await supabase
            .from('admins')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Error loading admins:', error);
            document.getElementById('admins-list').innerHTML = '<p class="no-items">خطأ في تحميل قائمة المشرفين</p>';
            return;
        }
        
        renderAdminsList(admins);
    } catch (error) {
        console.error('Error loading admins:', error);
        document.getElementById('admins-list').innerHTML = '<p class="no-items">خطأ في تحميل قائمة المشرفين</p>';
    }
}

// عرض قائمة المشرفين
function renderAdminsList(admins) {
    const listElement = document.getElementById('admins-list');
    
    if (!admins || admins.length === 0) {
        listElement.innerHTML = '<p class="no-items">لا يوجد مشرفين</p>';
        return;
    }
    
    let html = '';
    admins.forEach(admin => {
        const isCurrentAdmin = currentAdmin && admin.id === currentAdmin.id;
        
        html += `
            <div class="admin-item">
                <div class="admin-info">
                    <h3>${escapeHtml(admin.email)}</h3>
                    <p>تم الإنشاء: ${new Date(admin.created_at).toLocaleDateString('ar-EG')}</p>
                    <span class="admin-role role-${admin.role}">${admin.role === 'owner' ? 'مالك' : 'مشرف'}</span>
                </div>
                <div class="admin-actions">
                    ${!isCurrentAdmin && currentAdmin.role === 'owner' ? 
                        `<button class="delete-admin" onclick="deleteAdmin('${admin.id}', '${escapeHtml(admin.email)}')">حذف</button>` : 
                        '<span style="color: #ccc;">لا يمكن حذف حسابك</span>'
                    }
                </div>
            </div>
        `;
    });
    
    listElement.innerHTML = html;
}

// إضافة مشرف جديد
async function addAdmin(email, password, role) {
    if (!currentAdmin || currentAdmin.role !== 'owner') {
        alert('只有所有者可以添加管理员');
        return false;
    }
    
    // التحقق من صحة البريد الإلكتروني
    if (!isValidEmail(email)) {
        alert('صيغة البريد الإلكتروني غير صحيحة');
        return false;
    }
    
    // التحقق من قوة كلمة المرور
    if (!isStrongPassword(password)) {
        alert('كلمة المرور يجب أن تحتوي على الأقل على 8 أحرف، وتشمل أحرف كبيرة وصغيرة وأرقام');
        return false;
    }
    
    try {
        // تشفير كلمة المرور (يجب استخدام طريقة أكثر أماناً في بيئة الإنتاج)
        const passwordHash = btoa(password);
        
        const { data, error } = await supabase
            .from('admins')
            .insert([{ 
                email, 
                password_hash: passwordHash, 
                role,
                created_at: new Date(),
                updated_at: new Date()
            }])
            .select();
            
        if (error) {
            console.error('Error adding admin:', error);
            alert('حدث خطأ أثناء إضافة المشرف: ' + error.message);
            return false;
        }
        
        alert('تمت إضافة المشرف بنجاح');
        loadAdminsList(); // إعادة تحميل قائمة المشرفين
        return true;
    } catch (error) {
        console.error('Error adding admin:', error);
        alert('حدث خطأ أثناء إضافة المشرف');
        return false;
    }
}

// التحقق من قوة كلمة المرور
function isStrongPassword(password) {
    // يجب أن تحتوي على الأقل على 8 أحرف، أحرف كبيرة وصغيرة وأرقام
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return strongRegex.test(password);
}

// حذف مشرف
async function deleteAdmin(adminId, adminEmail) {
    if (!currentAdmin || currentAdmin.role !== 'owner') {
        alert('只有所有者可以删除管理员');
        return;
    }
    
    if (confirm(`هل أنت متأكد من حذف المشرف ${adminEmail}؟`)) {
        try {
            const { error } = await supabase
                .from('admins')
                .delete()
                .eq('id', adminId);
                
            if (error) {
                console.error('Error deleting admin:', error);
                alert('حدث خطأ أثناء حذف المشرف: ' + error.message);
                return;
            }
            
            alert('تم حذف المشرف بنجاح');
            loadAdminsList();
        } catch (error) {
            console.error('Error deleting admin:', error);
            alert('حدث خطأ أثناء حذف المشرف');
        }
    }
}

// حفظ البيانات إلى Supabase
async function saveItemToSupabase(table, item) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }
    
    // تسجيل من قام بالإضافة
    item.added_by = currentAdmin.id;
    item.added_at = new Date();
    
    const { data, error } = await supabase
        .from(table)
        .insert([item])
        .select();

    if (error) {
        console.error('Error saving item:', error);
        throw error;
    }

    return data[0];
}

// حذف عنصر من Supabase
async function deleteItemFromSupabase(table, id) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }
    
    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting item:', error);
        throw error;
    }
    
    // تسجيل عملية الحذف
    logDeletionEvent(table, id);
}

// تسجيل أحداث الحذف
async function logDeletionEvent(table, itemId) {
    try {
        await supabase
            .from('deletion_logs')
            .insert([{
                admin_id: currentAdmin.id,
                admin_email: currentAdmin.email,
                table_name: table,
                item_id: itemId,
                timestamp: new Date()
            }]);
    } catch (error) {
        console.error('Error logging deletion:', error);
    }
}

// تحسين دالة الحذف
async function deleteItem(section, id, title) {
    if (confirm(`هل أنت متأكد من حذف ${title}؟`)) {
        try {
            // إظهار مؤشر تحميل
            const deleteBtn = event.target;
            const originalText = deleteBtn.textContent;
            deleteBtn.textContent = 'جاري الحذف...';
            deleteBtn.disabled = true;
            
            await deleteItemFromSupabase(section, id);
            await loadAdminData();
            
            // إعادة تعيين الزر
            deleteBtn.textContent = originalText;
            deleteBtn.disabled = false;
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('حدث خطأ أثناء حذف العنصر: ' + error.message);
            
            // إعادة تعيين الزر في حالة الخطأ
            const deleteBtn = event.target;
            deleteBtn.textContent = 'حذف';
            deleteBtn.disabled = false;
        }
    }
}

// عرض جميع القوائم في لوحة التحكم
function renderAllAdminLists() {
    renderAdminList('books', siteData.books);
    renderAdminList('novels', siteData.novels);
    renderAdminList('files', siteData.files);
    renderAdminList('platforms', siteData.platforms);
    renderAdminList('apps', siteData.apps);
    renderAdminList('servers', siteData.servers);
}

// عرض قائمة العناصر في لوحة التحكم
function renderAdminList(section, items) {
    const listElement = document.getElementById(`${section}-list`);
    if (!listElement) return;
    
    listElement.innerHTML = '';
    
    if (items.length === 0) {
        listElement.innerHTML = '<p class="no-items">لا توجد عناصر</p>';
        return;
    }
    
    items.forEach((item) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-card';
        
        let infoHtml = `
            <div class="item-info">
                <h3>${escapeHtml(item.title)}</h3>
        `;
        
        if (item.description) {
            infoHtml += `<p>${escapeHtml(item.description.substring(0, 50))}...</p>`;
        }
        
        infoHtml += `</div>`;
        
        itemElement.innerHTML = infoHtml + `
            <div class="item-actions">
                <button onclick="deleteItem('${section}', ${item.id}, '${escapeHtml(item.title.replace(/'/g, "\\'"))}')">حذف</button>
            </div>
        `;
        
        listElement.appendChild(itemElement);
    });
}

// منع هجمات XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// إعداد وظيفة البحث
function setupSearchFunctionality() {
    // إعداد البحث للكتب
    const booksSearch = document.getElementById('books-search');
    if (booksSearch) {
        booksSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredBooks = siteData.books.filter(book => 
                book.title.toLowerCase().includes(searchTerm) || 
                (book.description && book.description.toLowerCase().includes(searchTerm))
            );
            renderAdminList('books', filteredBooks);
        });
    }
    
    // إعداد البحث للروايات
    const novelsSearch = document.getElementById('novels-search');
    if (novelsSearch) {
        novelsSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredNovels = siteData.novels.filter(novel => 
                novel.title.toLowerCase().includes(searchTerm) || 
                (novel.description && novel.description.toLowerCase().includes(searchTerm))
            );
            renderAdminList('novels', filteredNovels);
        });
    }
    
    // إعداد البحث للملفات
    const filesSearch = document.getElementById('files-search');
    if (filesSearch) {
        filesSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredFiles = siteData.files.filter(file => 
                file.title.toLowerCase().includes(searchTerm) || 
                (file.description && file.description.toLowerCase().includes(searchTerm))
            );
            renderAdminList('files', filteredFiles);
        });
    }
    
    // إعداد البحث للمنصات
    const platformsSearch = document.getElementById('platforms-search');
    if (platformsSearch) {
        platformsSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredPlatforms = siteData.platforms.filter(platform => 
                platform.title.toLowerCase().includes(searchTerm)
            );
            renderAdminList('platforms', filteredPlatforms);
        });
    }
    
    // إعداد البحث للتطبيقات
    const appsSearch = document.getElementById('apps-search');
    if (appsSearch) {
        appsSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredApps = siteData.apps.filter(app => 
                app.title.toLowerCase().includes(searchTerm) || 
                (app.description && app.description.toLowerCase().includes(searchTerm))
            );
            renderAdminList('apps', filteredApps);
        });
    }
    
    // إعداد البحث للسيرفرات
    const serversSearch = document.getElementById('servers-search');
    if (serversSearch) {
        serversSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredServers = siteData.servers.filter(server => 
                server.title.toLowerCase().includes(searchTerm) || 
                (server.description && server.description.toLowerCase().includes(searchTerm))
            );
            renderAdminList('servers', filteredServers);
        });
    }
    
    // إعداد البحث للمشرفين
    const adminsSearch = document.getElementById('admins-search');
    if (adminsSearch) {
        adminsSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            // سيتم تطبيق البحث على المشرفين عندما يتم تحميلهم
            // هذه الوظيفة تحتاج إلى تعديل عندما يكون هناك طريقة لجلب المشرفين
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
            
            // إخفاء جميع اللوحات
            panels.forEach(panel => {
                panel.classList.remove('active');
            });
            
            // إلغاء تنشيط جميع الأزرار
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // إظهار اللوحة المحددة
            const targetPanel = document.getElementById(`${tabName}-panel`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                button.classList.add('active');
            }
        });
    });
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة Supabase
    initSupabase();
    
    // إعداد event listeners بعد التأكد من تحميل DOM بالكامل
    if (document.readyState === 'complete') {
        setupEventListeners();
    } else {
        window.addEventListener('load', setupEventListeners);
    }
    
    // التحقق من المصادقة
    checkAuth();
});

// إعداد جميع event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // إعداد نموذج تسجيل الدخول
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }
    
    // إضافة event listener لزر الدخول
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            login();
        });
    }
    
    // إعداد زر تسجيل الخروج
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // إعداد نموذج إضافة مشرف
    const addAdminForm = document.getElementById('add-admin-form');
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('new-admin-email')?.value;
            const password = document.getElementById('new-admin-password')?.value;
            const role = document.getElementById('new-admin-role')?.value;
            
            if (email && password && role) {
                addAdmin(email, password, role).then(success => {
                    if (success && addAdminForm.reset) {
                        addAdminForm.reset();
                    }
                });
            }
        });
    }
    
    // إعداد التبويبات
    setupTabs();
}

// معالجة إرسال نماذج العناصر
async function handleServerSubmit(e) {
    e.preventDefault();
    
    const newServer = {
        title: document.getElementById('server-title').value,
        description: document.getElementById('server-description').value,
        image: document.getElementById('server-image').value,
        link: document.getElementById('server-link').value
    };
    
    try {
        const savedServer = await saveItemToSupabase('servers', newServer);
        siteData.servers.push(savedServer);
        renderAdminList('servers', siteData.servers);
        this.reset();
        alert('تم إضافة السيرفر بنجاح!');
    } catch (error) {
        console.error('Error adding server:', error);
        alert('حدث خطأ أثناء إضافة السيرفر: ' + error.message);
    }
}

async function handleBookSubmit(e) {
    e.preventDefault();
    
    const newBook = {
        title: document.getElementById('book-title').value,
        description: document.getElementById('book-description').value,
        image: document.getElementById('book-image').value,
        drive_link: document.getElementById('book-drive-link').value
    };
    
    try {
        const savedBook = await saveItemToSupabase('books', newBook);
        siteData.books.push(savedBook);
        renderAdminList('books', siteData.books);
        this.reset();
        alert('تم إضافة الكتاب بنجاح!');
    } catch (error) {
        console.error('Error adding book:', error);
        alert('حدث خطأ أثناء إضافة الكتاب: ' + error.message);
    }
}

async function handleNovelSubmit(e) {
    e.preventDefault();
    
    const imageInputs = document.querySelectorAll('.novel-image-input');
    const images = [];
    
    imageInputs.forEach(input => {
        if (input.value.trim() !== '') {
            images.push(input.value);
        }
    });
    
    const newNovel = {
        title: document.getElementById('novel-title').value,
        description: document.getElementById('novel-description').value,
        images: images
    };
    
    try {
        const savedNovel = await saveItemToSupabase('novels', newNovel);
        siteData.novels.push(savedNovel);
        renderAdminList('novels', siteData.novels);
        this.reset();
        
        // إعادة تعيين حقل الصور
        const imagesContainer = document.getElementById('novel-images-container');
        imagesContainer.innerHTML = '<input type="url" class="novel-image-input" placeholder="رابط الصورة">';
        alert('تم إضافة الرواية بنجاح!');
    } catch (error) {
        console.error('Error adding novel:', error);
        alert('حدث خطأ أثناء إضافة الرواية: ' + error.message);
    }
}

async function handleFileSubmit(e) {
    e.preventDefault();
    
    const newFile = {
        title: document.getElementById('file-title').value,
        description: document.getElementById('file-description').value,
        image: document.getElementById('file-image').value,
        drive_link: document.getElementById('file-drive-link').value
    };
    
    try {
        const savedFile = await saveItemToSupabase('files', newFile);
        siteData.files.push(savedFile);
        renderAdminList('files', siteData.files);
        this.reset();
        alert('تم إضافة الملف بنجاح!');
    } catch (error) {
        console.error('Error adding file:', error);
        alert('حدث خطأ أثناء إضافة الملف: ' + error.message);
    }
}

async function handlePlatformSubmit(e) {
    e.preventDefault();
    
    const newPlatform = {
        title: document.getElementById('platform-title').value,
        image: document.getElementById('platform-image').value,
        link: document.getElementById('platform-link').value
    };
    
    try {
        const savedPlatform = await saveItemToSupabase('platforms', newPlatform);
        siteData.platforms.push(savedPlatform);
        renderAdminList('platforms', siteData.platforms);
        this.reset();
        alert('تم إضافة المنصة بنجاح!');
    } catch (error) {
        console.error('Error adding platform:', error);
        alert('حدث خطأ أثناء إضافة المنصة: ' + error.message);
    }
}

async function handleAppSubmit(e) {
    e.preventDefault();
    
    const newApp = {
        title: document.getElementById('app-title').value,
        description: document.getElementById('app-description').value,
        image: document.getElementById('app-image').value,
        download_link: document.getElementById('app-download-link').value
    };
    
    try {
        const savedApp = await saveItemToSupabase('apps', newApp);
        siteData.apps.push(savedApp);
        renderAdminList('apps', siteData.apps);
        this.reset();
        alert('تم إضافة التطبيق بنجاح!');
    } catch (error) {
        console.error('Error adding app:', error);
        alert('حدث خطأ أثناء إضافة التطبيق: ' + error.message);
    }
}
