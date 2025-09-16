// تعريف المتغيرات العامة
let supabase;
let currentAdmin = null;
let sessionTimer;
let sessionTimeout = 30 * 60; // 30 دقيقة بالثواني
let siteData = {
    books: [],
    novels: [],
    files: [],
    platforms: [],
    apps: [],
    servers: [],
    admins: []
};

// ثوابت Supabase - يجب تخزينها بشكل آمن في بيئة الإنتاج
const SUPABASE_URL = 'https://xzltdsmmolyvcmkfzedf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhbmFzZSIsInJlZiI6Inh6bHRkc21tb2x5dmNta2Z6ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg1NzEsImV4cCI6MjA3MzI1NDU3MX0.3TJ49ctEhOT1KDIFtZXFw2jwTq57ujaWbqNNJ2Eeb1U';

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
        startSessionTimer();
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
    
    // تحديث معلومات المستخدم
    document.getElementById('admin-email').textContent = currentAdmin.email;
    document.getElementById('admin-role').textContent = currentAdmin.role === 'owner' ? 'مالك' : 'مشرف';
    
    // تحميل البيانات
    loadAdminData();
}

// بدء مؤقت الجلسة
function startSessionTimer() {
    clearInterval(sessionTimer);
    let timeLeft = sessionTimeout;
    
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
// إعادة تعيين مؤقت الجلسة
function resetSession() {
    startSessionTimer();
    alert('تم تجديد الجلسة بنجاح');
}
// فتح نموذج إضافة عنصر جديد
function openAddItemModal(section) {
    const modal = document.getElementById('item-modal');
    const modalTitle = document.getElementById('item-modal-title');
    const form = document.getElementById('item-form');
    const itemId = document.getElementById('item-id');
    const itemType = document.getElementById('item-type');
    
    // إعداد النموذج للإضافة
    modalTitle.textContent = `إضافة ${categoryNames[section]}`;
    itemId.value = '';
    itemType.value = section;
    form.reset();
    
    // إخفاء جميع حقول النوع وإظهار الحقول المناسبة
    document.querySelectorAll('.item-type-fields').forEach(field => {
        field.style.display = 'none';
    });
    document.getElementById(`item-fields-${section}`).style.display = 'block';
    
    modal.style.display = 'block';
}

// فتح نموذج تعديل عنصر
function openEditItemModal(section, id) {
    const item = siteData[section].find(item => item.id === id);
    if (!item) return;
    
    const modal = document.getElementById('item-modal');
    const modalTitle = document.getElementById('item-modal-title');
    const form = document.getElementById('item-form');
    const itemId = document.getElementById('item-id');
    const itemType = document.getElementById('item-type');
    
    // إعداد النموذج للتعديل
    modalTitle.textContent = `تعديل ${categoryNames[section]}`;
    itemId.value = id;
    itemType.value = section;
    form.reset();
    
    // تعبئة البيانات الأساسية
    document.getElementById('item-title').value = item.title || '';
    document.getElementById('item-description').value = item.description || '';
    document.getElementById('item-image').value = item.image || '';
    document.getElementById('item-drive-link').value = item.drive_link || item.download_link || item.link || '';
    
    // تعبئة الحقول حسب النوع
    switch(section) {
        case 'books':
            document.getElementById('item-author').value = item.author || '';
            document.getElementById('item-publisher').value = item.publisher || '';
            document.getElementById('item-pages').value = item.pages || '';
            document.getElementById('item-language').value = item.language || 'العربية';
            document.getElementById('item-format').value = item.file_format || 'PDF';
            document.getElementById('item-size').value = item.file_size || '';
            break;
        case 'novels':
            document.getElementById('item-author-novel').value = item.author || '';
            document.getElementById('item-publisher-novel').value = item.publisher || '';
            document.getElementById('item-pages-novel').value = item.pages || '';
            document.getElementById('item-language-novel').value = item.language || 'العربية';
            document.getElementById('item-format-novel').value = item.file_format || 'PDF';
            document.getElementById('item-size-novel').value = item.file_size || '';
            break;
        case 'files':
            document.getElementById('item-file-type').value = item.file_type || 'document';
            document.getElementById('item-format-file').value = item.file_format || '';
            document.getElementById('item-size-file').value = item.file_size || '';
            break;
        case 'platforms':
            document.getElementById('item-platform-type').value = item.platform_type || 'website';
            document.getElementById('item-link-url').value = item.link || '';
            break;
        case 'apps':
            document.getElementById('item-developer').value = item.developer || '';
            document.getElementById('item-version').value = item.version || '';
            document.getElementById('item-platform-app').value = item.platform || 'android';
            document.getElementById('item-size-app').value = item.file_size || '';
            break;
        case 'servers':
            document.getElementById('item-server-type').value = item.server_type || 'discord';
            document.getElementById('item-invite-link').value = item.invite_link || '';
            document.getElementById('item-members-count').value = item.members_count || 0;
            break;
    }
    
    // إخفاء جميع حقول النوع وإظهار الحقول المناسبة
    document.querySelectorAll('.item-type-fields').forEach(field => {
        field.style.display = 'none';
    });
    document.getElementById(`item-fields-${section}`).style.display = 'block';
    
    modal.style.display = 'block';
}

// حفظ العنصر (إضافة أو تعديل)
async function saveItem(e) {
    e.preventDefault();
    
    const form = document.getElementById('item-form');
    const itemId = document.getElementById('item-id').value;
    const itemType = document.getElementById('item-type').value;
    
    // جمع البيانات من النموذج
    const itemData = {
        title: document.getElementById('item-title').value,
        description: document.getElementById('item-description').value,
        image: document.getElementById('item-image').value,
        drive_link: document.getElementById('item-drive-link').value
    };
    
    // إضافة الحقول الخاصة بكل نوع
    switch(itemType) {
        case 'books':
            itemData.author = document.getElementById('item-author').value;
            itemData.publisher = document.getElementById('item-publisher').value;
            itemData.pages = parseInt(document.getElementById('item-pages').value) || 0;
            itemData.language = document.getElementById('item-language').value;
            itemData.file_format = document.getElementById('item-format').value;
            itemData.file_size = document.getElementById('item-size').value;
            break;
        case 'novels':
            itemData.author = document.getElementById('item-author-novel').value;
            itemData.publisher = document.getElementById('item-publisher-novel').value;
            itemData.pages = parseInt(document.getElementById('item-pages-novel').value) || 0;
            itemData.language = document.getElementById('item-language-novel').value;
            itemData.file_format = document.getElementById('item-format-novel').value;
            itemData.file_size = document.getElementById('item-size-novel').value;
            break;
        case 'files':
            itemData.file_type = document.getElementById('item-file-type').value;
            itemData.file_format = document.getElementById('item-format-file').value;
            itemData.file_size = document.getElementById('item-size-file').value;
            break;
        case 'platforms':
            itemData.platform_type = document.getElementById('item-platform-type').value;
            itemData.link = document.getElementById('item-link-url').value;
            break;
        case 'apps':
            itemData.developer = document.getElementById('item-developer').value;
            itemData.version = document.getElementById('item-version').value;
            itemData.platform = document.getElementById('item-platform-app').value;
            itemData.file_size = document.getElementById('item-size-app').value;
            break;
        case 'servers':
            itemData.server_type = document.getElementById('item-server-type').value;
            itemData.invite_link = document.getElementById('item-invite-link').value;
            itemData.members_count = parseInt(document.getElementById('item-members-count').value) || 0;
            break;
    }
    
    try {
        if (itemId) {
            // تعديل العنصر الموجود
            await supabase
                .from(itemType)
                .update(itemData)
                .eq('id', itemId);
            alert('تم تعديل العنصر بنجاح');
        } else {
            // إضافة عنصر جديد
            await saveItemToSupabase(itemType, itemData);
            alert('تم إضافة العنصر بنجاح');
        }
        
        // إعادة تحميل البيانات
        await loadAdminData();
        // إغلاق النموذج
        closeModal('item-modal');
    } catch (error) {
        console.error('Error saving item:', error);
        alert('حدث خطأ أثناء حفظ العنصر: ' + error.message);
    }
}
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
    
    // التحقق من صحة البريد الإلكتروني
    if (!isValidEmail(email)) {
        errorElement.textContent = 'صيغة البريد الإلكتروني غير صحيحة';
        return;
    }
    
    try {
        // إظهار تحميل
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
        loginBtn.disabled = true;
        
        // البحث عن المشرف في قاعدة البيانات
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !admin) {
            errorElement.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
            return;
        }
        
        // التحقق من كلمة المرور (يجب استخدام مقارنة آمنة في بيئة الإنتاج)
        if (password !== atob(admin.password_hash)) {
            errorElement.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            loginBtn.innerHTML = originalText;
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
        
        // إعادة تعيين الزر
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
        
    } catch (error) {
        console.error('Login error:', error);
        if (errorElement) {
            errorElement.textContent = 'حدث خطأ أثناء تسجيل الدخول';
        }
        
        // إعادة تعيين الزر في حالة الخطأ
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> دخول';
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
    if (currentAdmin) {
        logLogoutEvent(currentAdmin.email);
    }
    
    clearInterval(sessionTimer);
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
    const securityTab = document.getElementById('security-tab');
    
    if (adminsTab) {
        if (role === 'owner') {
            adminsTab.style.display = 'block';
        } else {
            adminsTab.style.display = 'none';
        }
    }
    
    if (securityTab) {
        if (role === 'owner') {
            securityTab.style.display = 'block';
        } else {
            securityTab.style.display = 'none';
        }
    }
}

// تحميل البيانات من Supabase مع الحقول المحسنة
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
            if (list) list.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>جاري تحميل البيانات...</p></div>';
        });
        
        // جلب البيانات من كل جدول مع الحقول الجديدة
        const [booksData, novelsData, filesData, platformsData, appsData, serversData, adminsData] = await Promise.all([
            supabase.from('books').select('*, admins:added_by(email, full_name)'),
            supabase.from('novels').select('*, admins:added_by(email, full_name)'),
            supabase.from('files').select('*, admins:added_by(email, full_name)'),
            supabase.from('platforms').select('*, admins:added_by(email, full_name)'),
            supabase.from('apps').select('*, admins:added_by(email, full_name)'),
            supabase.from('servers').select('*, admins:added_by(email, full_name)'),
            currentAdmin.role === 'owner' ? supabase.from('admins').select('*') : { data: [] }
        ]);

        // معالجة البيانات
        siteData.books = booksData.data || [];
        siteData.novels = novelsData.data || [];
        siteData.files = filesData.data || [];
        siteData.platforms = platformsData.data || [];
        siteData.apps = appsData.data || [];
        siteData.servers = serversData.data || [];
        siteData.admins = adminsData.data || [];

        renderAllAdminLists();
        setupSearchFunctionality();
        
        // تحديث إحصائيات المشرفين
        if (currentAdmin.role === 'owner') {
            updateAdminStats();
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        alert('حدث خطأ في تحميل البيانات: ' + error.message);
    }
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

// عرض قائمة العناصر في لوحة التحكم مع البيانات المحسنة
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
        itemElement.setAttribute('data-id', item.id);
        
        let infoHtml = `
            <div class="item-info">
                <h3>${escapeHtml(item.title)}</h3>
        `;
        
        // إضافة معلومات إضافية حسب النوع
        switch(section) {
            case 'books':
                if (item.author) infoHtml += `<p><strong>المؤلف:</strong> ${escapeHtml(item.author)}</p>`;
                if (item.publisher) infoHtml += `<p><strong>الناشر:</strong> ${escapeHtml(item.publisher)}</p>`;
                if (item.pages) infoHtml += `<p><strong>الصفحات:</strong> ${escapeHtml(item.pages)}</p>`;
                if (item.language) infoHtml += `<p><strong>اللغة:</strong> ${escapeHtml(item.language)}</p>`;
                break;
            case 'novels':
                if (item.author) infoHtml += `<p><strong>المؤلف:</strong> ${escapeHtml(item.author)}</p>`;
                if (item.publisher) infoHtml += `<p><strong>الناشر:</strong> ${escapeHtml(item.publisher)}</p>`;
                if (item.pages) infoHtml += `<p><strong>الصفحات:</strong> ${escapeHtml(item.pages)}</p>`;
                if (item.language) infoHtml += `<p><strong>اللغة:</strong> ${escapeHtml(item.language)}</p>`;
                break;
            case 'files':
                if (item.file_type) infoHtml += `<p><strong>النوع:</strong> ${escapeHtml(item.file_type)}</p>`;
                if (item.file_format) infoHtml += `<p><strong>الصيغة:</strong> ${escapeHtml(item.file_format)}</p>`;
                if (item.file_size) infoHtml += `<p><strong>الحجم:</strong> ${escapeHtml(item.file_size)}</p>`;
                break;
            case 'platforms':
                if (item.platform_type) infoHtml += `<p><strong>نوع المنصة:</strong> ${escapeHtml(item.platform_type)}</p>`;
                break;
            case 'apps':
                if (item.developer) infoHtml += `<p><strong>المطور:</strong> ${escapeHtml(item.developer)}</p>`;
                if (item.version) infoHtml += `<p><strong>الإصدار:</strong> ${escapeHtml(item.version)}</p>`;
                if (item.platform) infoHtml += `<p><strong>المنصة:</strong> ${escapeHtml(item.platform)}</p>`;
                if (item.file_size) infoHtml += `<p><strong>الحجم:</strong> ${escapeHtml(item.file_size)}</p>`;
                break;
            case 'servers':
                if (item.server_type) infoHtml += `<p><strong>نوع السيرفر:</strong> ${escapeHtml(item.server_type)}</p>`;
                if (item.members_count) infoHtml += `<p><strong>عدد الأعضاء:</strong> ${escapeHtml(item.members_count)}</p>`;
                break;
        }
        
        // إضافة إحصائيات إذا كانت متوفرة
        if (item.views_count !== undefined) {
            infoHtml += `<p><strong>المشاهدات:</strong> ${item.views_count}</p>`;
        }
        
        if (item.downloads_count !== undefined) {
            infoHtml += `<p><strong>التحميلات:</strong> ${item.downloads_count}</p>`;
        }
        
        // إضافة معلومات المضافة إذا كانت متوفرة
        if (item.added_by && item.admins) {
            infoHtml += `<p><strong>أضيف بواسطة:</strong> ${escapeHtml(item.admins.full_name || item.admins.email)}</p>`;
        }
        
        infoHtml += `</div>`;
        
        itemElement.innerHTML = infoHtml + `
            <div class="item-actions">
                <button class="edit-btn" onclick="editItem('${section}', '${item.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="delete-btn" onclick="deleteItem('${section}', '${item.id}', '${escapeHtml(item.title.replace(/'/g, "\\'"))}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        `;
        
        listElement.appendChild(itemElement);
    });
}

// عرض قائمة المشرفين (الدالة المصححة)
function renderAdminsList(admins) {
    const listElement = document.getElementById('admins-list');
    
    if (!admins || admins.length === 0) {
        listElement.innerHTML = '<p class="no-items">لا يوجد مشرفين</p>';
        return;
    }
    
    // استخدام DocumentFragment لتحسين الأداء
    const fragment = document.createDocumentFragment();
    
    admins.forEach(admin => {
        const isCurrentAdmin = currentAdmin && admin.id === currentAdmin.id;
        
        const adminItem = document.createElement('div');
        adminItem.className = 'admin-item';
        
        const adminInfo = document.createElement('div');
        adminInfo.className = 'admin-info';
        
        const emailHeading = document.createElement('h3');
        emailHeading.textContent = escapeHtml(admin.email);
        
        const createdAt = document.createElement('p');
        createdAt.textContent = `تم الإنشاء: ${new Date(admin.created_at).toLocaleDateString('ar-EG')}`;
        
        const roleSpan = document.createElement('span');
        roleSpan.className = `admin-role role-${admin.role}`;
        roleSpan.textContent = admin.role === 'owner' ? 'مالك' : 'مشرف';
        
        adminInfo.appendChild(emailHeading);
        adminInfo.appendChild(createdAt);
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
    
    // مسح المحتوى القديم وإضافة الجديد
    listElement.innerHTML = '';
    listElement.appendChild(fragment);
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

// حفظ البيانات إلى Supabase مع الحقول الجديدة
async function saveItemToSupabase(table, item) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }
    
    // تسجيل من قام بالإضافة
    item.added_by = currentAdmin.id;
    item.added_at = new Date();
    item.updated_at = new Date();
    
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
    
    if (currentAdmin.role === 'owner') {
        renderAdminsList(siteData.admins);
    }
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

// منع هجمات XSS (نسخة محسنة)
function escapeHtml(text) {
    if (typeof text !== 'string') {
        return text;
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
            const filteredAdmins = siteData.admins.filter(admin => 
                admin.email.toLowerCase().includes(searchTerm)
            );
            renderAdminsList(filteredAdmins);
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
                
                // تحميل البيانات الخاصة باللوحة إذا لزم الأمر
                if (tabName === 'admins' && currentAdmin.role === 'owner') {
                    loadAdminsList();
                }
            }
        });
    });
}

// تغيير كلمة المرور
function changePassword() {
    document.getElementById('password-modal').style.display = 'block';
}

// إغلاق النافذة المنبثقة
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة Supabase
    initSupabase();
    
    // إعداد event listeners
    setupEventListeners();
    
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
    
    // إعداد زر إظهار/إخفاء كلمة المرور
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
            const email = document.getElementById('new-admin-email').value;
            const password = document.getElementById('new-admin-password').value;
            const role = document.getElementById('new-admin-role').value;
            
            if (email && password && role) {
                addAdmin(email, password, role).then(success => {
                    if (success) {
                        this.reset();
                    }
                });
            }
        });
    }
    
    // إعداد زر تحديث المشرفين
    const refreshAdminsBtn = document.getElementById('refresh-admins-btn');
    if (refreshAdminsBtn) {
        refreshAdminsBtn.addEventListener('click', function() {
            loadAdminsList();
        });
    }
    
    // إعداد زر تجديد الجلسة
    const resetSessionBtn = document.getElementById('reset-session-btn');
    if (resetSessionBtn) {
        resetSessionBtn.addEventListener('click', resetSession);
    }
    
    // إعداد زر تغيير كلمة المرور
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', changePassword);
    }
    
    // إعداد زر إغلاق نافذة كلمة المرور
    const closePasswordModal = document.getElementById('close-password-modal');
    if (closePasswordModal) {
        closePasswordModal.addEventListener('click', function() {
            closeModal('password-modal');
        });
    }
    
    // إعداد نموذج تغيير كلمة المرور
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // هنا سيتم إضافة منطق تغيير كلمة المرور
            alert('سيتم تنفيذ تغيير كلمة المرور هنا');
            closeModal('password-modal');
        });
    }
    
    // إعداد التبويبات
    setupTabs();
    
    // النقر خارج النافذة المنبثقة يغلقها
    window.addEventListener('click', function(event) {
        const passwordModal = document.getElementById('password-modal');
        if (event.target === passwordModal) {
            closeModal('password-modal');
        }
    });
}
