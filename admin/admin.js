// تهيئة Supabase
const SUPABASE_URL = 'https://xzltdsmmolyvcmkfzedf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHRkc21tb2x5dmNta2Z6ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg1NzEsImV4cCI6MjA3MzI1NDU3MX0.3TJ49ctEhOT1KDIFtZXFw2jwTq57ujaWbqNNJ2Eeb1U';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// بيانات الموقع
let siteData = {
    books: [],
    novels: [],
    files: [],
    platforms: [],
    apps: []
};

// تحميل البيانات من Supabase
async function loadAdminData() {
    try {
        // جلب البيانات من كل جدول
        const { data: books, error: booksError } = await supabase.from('books').select('*');
        const { data: novels, error: novelsError } = await supabase.from('novels').select('*');
        const { data: files, error: filesError } = await supabase.from('files').select('*');
        const { data: platforms, error: platformsError } = await supabase.from('platforms').select('*');
        const { data: apps, error: appsError } = await supabase.from('apps').select('*');

        if (booksError) throw booksError;
        if (novelsError) throw novelsError;
        if (filesError) throw filesError;
        if (platformsError) throw platformsError;
        if (appsError) throw appsError;

        siteData.books = books || [];
        siteData.novels = novels || [];
        siteData.files = files || [];
        siteData.platforms = platforms || [];
        siteData.apps = apps || [];

        renderAllAdminLists();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('حدث خطأ في تحميل البيانات: ' + error.message);
    }
}

// حفظ البيانات إلى Supabase
async function saveItemToSupabase(table, item) {
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
    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting item:', error);
        throw error;
    }
}

// عرض جميع القوائم في لوحة التحكم
function renderAllAdminLists() {
    renderAdminList('books', siteData.books);
    renderAdminList('novels', siteData.novels);
    renderAdminList('files', siteData.files);
    renderAdminList('platforms', siteData.platforms);
    renderAdminList('apps', siteData.apps);
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
                <button onclick="deleteItem('${section}', ${item.id})">حذف</button>
            </div>
        `;
        
        listElement.appendChild(itemElement);
    });
}

// حذف عنصر
async function deleteItem(section, id) {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
        try {
            await deleteItemFromSupabase(section, id);
            // إعادة تحميل البيانات من Supabase
            await loadAdminData();
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('حدث خطأ أثناء حذف العنصر: ' + error.message);
        }
    }
}

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
    // إخفاء لوحة التحكم حتى تسجيل الدخول
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
