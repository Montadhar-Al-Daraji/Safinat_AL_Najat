// تعريف المتغيرات العامة
let supabase;
let siteData = {
    books: [],
    novels: [],
    files: [],
    platforms: [],
    apps: [],
    servers: [] // إضافة مصفوفة السيرفرات
};
// تهيئة Supabase

// تهيئة Supabase بعد تحميل المكتبة
function initSupabase() {
    const SUPABASE_URL = 'https://xzltdsmmolyvcmkfzedf.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHRkc21tb2x5dmNta2Z6ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg1NzEsImV4cCI6MjA3MzI1NDU3MX0.3TJ49ctEhOT1KDIFtZXFw2jwTq57ujaWbqNNJ2Eeb1U';

    let supabase;
    let currentAdmin = null;

    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
        return true;
    } else {
        console.error('Supabase library not loaded');
        return false;
    }
}


// تهيئة Supabase بعد تحميل المكتبة
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

// تحميل البيانات من Supabase
async function loadAdminData() {
    if (!supabase) {
        if (!initSupabase()) {
            alert('خطأ في تهيئة قاعدة البيانات');
            return;
        }
    }
    
    try {
        // جلب البيانات من كل جدول
        const { data: books, error: booksError } = await supabase.from('books').select('*');
        const { data: novels, error: novelsError } = await supabase.from('novels').select('*');
        const { data: files, error: filesError } = await supabase.from('files').select('*');
        const { data: platforms, error: platformsError } = await supabase.from('platforms').select('*');
        const { data: apps, error: appsError } = await supabase.from('apps').select('*');
        const { data: servers, error: serversError } = await supabase.from('servers').select('*'); // جلب بيانات السيرفرات

        if (booksError) throw booksError;
        if (novelsError) throw novelsError;
        if (filesError) throw filesError;
        if (platformsError) throw platformsError;
        if (appsError) throw appsError;
        if (serversError) throw serversError;

        siteData.books = books || [];
        siteData.novels = novels || [];
        siteData.files = files || [];
        siteData.platforms = platforms || [];
        siteData.apps = apps || [];
        siteData.servers = servers || []; // تعيين بيانات السيرفرات

        renderAllAdminLists();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('حدث خطأ في تحميل البيانات: ' + error.message);
    }
}

// حفظ البيانات إلى Supabase
async function saveItemToSupabase(table, item) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }
    
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


// إعداد واجهة المشرفين حسب الصلاحية
function setupAdminInterface(role) {
    const adminManagement = document.getElementById('admin-management');
    
    if (role === 'owner') {
        adminManagement.style.display = 'block';
    } else {
        adminManagement.style.display = 'none';
    }
}


// تسجيل الدخول مع تشفير كلمة المرور
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');
    
    errorElement.textContent = '';
    
    if (!email || !password) {
        errorElement.textContent = 'يرجى ملء جميع الحقول';
        return;
    }
    
    try {
        // البحث عن المشرف في قاعدة البيانات
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !admin) {
            errorElement.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            return;
        }
        
        // التحقق من كلمة المرور (في الواقع، يجب استخدام مقارنة مشفرة)
        // هذا مثال مبسط، في التطبيق الحقيقي يجب استخدام hashing مثل bcrypt
        if (password !== atob(admin.password_hash)) {
            errorElement.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            return;
        }
        
        // حفظ بيانات المشرف في sessionStorage
        sessionStorage.setItem('adminAuthenticated', 'true');
        sessionStorage.setItem('adminData', JSON.stringify(admin));
        currentAdmin = admin;
        
        // إظهار لوحة التحكم
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('admin-container').classList.remove('hidden');
        
        // تحميل البيانات وإدارة واجهة المشرفين
        loadAdminData();
        setupAdminInterface(admin.role);
        
    } catch (error) {
        console.error('Login error:', error);
        errorElement.textContent = 'حدث خطأ أثناء تسجيل الدخول';
    }
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
}


// التحقق من صحة تسجيل الدخول عند تحميل الصفحة
function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('adminAuthenticated');
    const adminData = sessionStorage.getItem('adminData');
    
    if (!isAuthenticated || !adminData) {
        document.getElementById('login-container').classList.remove('hidden');
        document.getElementById('admin-container').classList.add('hidden');
        return false;
    }
    
    try {
        currentAdmin = JSON.parse(adminData);
        setupAdminInterface(currentAdmin.role);
        return true;
    } catch (error) {
        console.error('Error parsing admin data:', error);
        logout();
        return false;
    }
}

// إضافة مشرف جديد (للمالك فقط)
async function addAdmin(email, password, role) {
    if (!currentAdmin || currentAdmin.role !== 'owner') {
        alert('只有所有者可以添加管理员');
        return false;
    }
    
    try {
        // تشفير كلمة المرور (بشكل أساسي، في الواقع يجب استخدام hashing قوي)
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
        return true;
    } catch (error) {
        console.error('Error adding admin:', error);
        alert('حدث خطأ أثناء إضافة المشرف');
        return false;
    }
}


// تسجيل الخروج
function logout() {
    sessionStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('adminData');
    currentAdmin = null;
    
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('admin-container').classList.add('hidden');
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('login-error').textContent = '';
}

// تعديل事件 التحميل الأولي
document.addEventListener('DOMContentLoaded', function() {
    initSupabase();
    
    // إضافة event listener للنموذج
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });
    
    // إضافة event listener للنموذج
    document.getElementById('add-admin-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('new-admin-email').value;
        const password = document.getElementById('new-admin-password').value;
        const role = document.getElementById('new-admin-role').value;
        
        addAdmin(email, password, role).then(success => {
            if (success) {
                this.reset();
            }
        });
    });
    
    // التحقق من المصادقة
    checkAuth();
});

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
    renderAdminList('servers', siteData.servers); // عرض السيرفرات
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
                <h3>${item.title}</h3>
        `;
        
        if (item.description) {
            infoHtml += `<p>${item.description.substring(0, 50)}...</p>`;
        }
        
        infoHtml += `</div>`;
        
        itemElement.innerHTML = infoHtml + `
            <div class="item-actions">
                <button onclick="deleteItem('${section}', ${item.id}, '${item.title.replace(/'/g, "\\'")}')">حذف</button>
            </div>
        `;
        
        listElement.appendChild(itemElement);
    });
}

// إضافة سيرفر جديد
document.getElementById('server-form').addEventListener('submit', async function(e) {
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
});

// إضافة كتاب جديد
document.getElementById('book-form').addEventListener('submit', async function(e) {
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
});

// إضافة رواية جديدة
document.getElementById('novel-form').addEventListener('submit', async function(e) {
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
});

// إضافة صورة أخرى للرواية
document.getElementById('add-novel-image').addEventListener('click', function() {
    const imagesContainer = document.getElementById('novel-images-container');
    const newInput = document.createElement('input');
    newInput.type = 'url';
    newInput.className = 'novel-image-input';
    newInput.placeholder = 'رابط الصورة';
    imagesContainer.appendChild(newInput);
});

// إضافة ملف جديد
document.getElementById('file-form').addEventListener('submit', async function(e) {
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
});

// إضافة منصة جديدة
document.getElementById('platform-form').addEventListener('submit', async function(e) {
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
});

// إضافة تطبيق جديد
document.getElementById('app-form').addEventListener('submit', async function(e) {
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
});

// تسجيل الدخول
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');
    
    // مسح أي رسائل خطأ سابقة
    errorElement.textContent = '';
    
    if (username === 'bahlol121212' && password === 'labaik313') {
        // تسجيل الدخول ناجح
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('admin-container').classList.remove('hidden');
        // تحميل البيانات
        loadAdminData();
    } else {
        errorElement.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
    }
}

// إغلاق نافذة التسجيل
function closeLogin() {
    document.getElementById('login-container').classList.add('hidden');
}

// تسجيل الخروج
function logout() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('admin-container').classList.add('hidden');
    // مسح الحقول
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('login-error').textContent = '';
}

// تهيئة لوحة التحكم عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة Supabase
    initSupabase();
    
    // التأكد من إظهار نافذة التسجيل وإخفاء لوحة التحكم في البداية
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('admin-container').classList.add('hidden');
    
    // إضافة event listener لحقول الإدخال للسماح بالدخول بالزر Enter
    document.getElementById('username').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
});
