// تهيئة Supabase
const SUPABASE_URL = 'https://xzltdsmmolyvcmkfzedf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHRkc21tb2x5dmNta2Z6ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg1NzEsImV4cCI6MjA3MzI1NDU3MX0.3TJ49ctEhOT1KDIFtZXFw2jwTq57ujaWbqNNJ2Eeb1U';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// بيانات الموقع
let siteData = {
    books: [],
    novels: [],
    files: [],
    platforms: [],
    apps: [],
    servers: [] // تأكد من وجود مصفوفة السيرفرات
};


// تحميل البيانات من Supabase
async function loadData() {
    try {
        // جلب البيانات من كل جدول
        const { data: books, error: booksError } = await supabaseClient.from('books').select('*');
        const { data: novels, error: novelsError } = await supabaseClient.from('novels').select('*');
        const { data: files, error: filesError } = await supabaseClient.from('files').select('*');
        const { data: platforms, error: platformsError } = await supabaseClient.from('platforms').select('*');
        const { data: apps, error: appsError } = await supabaseClient.from('apps').select('*');
        const { data: servers, error: serversError } = await supabaseClient.from('servers').select('*'); // جلب السيرفرات

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

        renderAllSections();
    } catch (error) {
        console.error('Error loading data:', error);
        // عرض رسالة توضح أن البيانات غير متوفرة
        document.querySelectorAll('.items-container').forEach(container => {
            container.innerHTML = '<p class="no-items">لا توجد عناصر لعرضها حالياً</p>';
        });
    }
}


function renderServerItem(server) {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
        ${server.image ? `<img src="${server.image}" alt="${server.title}" class="item-image">` : ''}
        <h3>${server.title}</h3>
        <p>${server.description}</p>
        <a href="${server.link}" target="_blank" class="item-button">انضم إلى السيرفر</a>
    `;
    return div;
}
// عرض جميع الأقسام
function renderAllSections() {
    renderSection('books', siteData.books, renderBookItem);
    renderSection('novels', siteData.novels, renderNovelItem);
    renderSection('files', siteData.files, renderFileItem);
    renderSection('platforms', siteData.platforms, renderPlatformItem);
    renderSection('apps', siteData.apps, renderAppItem);
    renderSection('servers', siteData.servers, renderServerItem); // عرض السيرفرات
}

// عرض قسم معين
function renderSection(sectionId, items, renderFunction) {
    const container = document.getElementById(`${sectionId}-container`);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p class="no-items">لا توجد عناصر لعرضها</p>';
        return;
    }
    
    items.forEach(item => {
        const itemElement = renderFunction(item);
        container.appendChild(itemElement);
    });
}



// عرض عنصر كتاب
function renderBookItem(book) {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
        ${book.image ? `<img src="${book.image}" alt="${book.title}" class="item-image">` : ''}
        <h3>${book.title}</h3>
        <p>${book.description}</p>
        <a href="${book.drive_link}" target="_blank" class="item-button">تحميل الكتاب</a>
    `;
    return div;
}
// عرض عنصر رواية
function renderNovelItem(novel) {
    const div = document.createElement('div');
    div.className = 'item';
    
    let imagesHtml = '';
    
    // محاولة تحليل images إذا كانت نصًا (JSON)
    let imagesArray = [];
    if (novel.images) {
        if (typeof novel.images === 'string') {
            try {
                imagesArray = JSON.parse(novel.images);
            } catch (e) {
                console.error('Error parsing images JSON:', e);
                // إذا فشل التحليل، نعتبرها مصفوفة تحتوي على عنصر واحد
                imagesArray = [novel.images];
            }
        } else if (Array.isArray(novel.images)) {
            imagesArray = novel.images;
        }
    }
    
    if (imagesArray.length > 0) {
        imagesHtml = '<div class="novel-images">';
        imagesArray.forEach(img => {
            imagesHtml += `<img src="${img}" alt="صورة الرواية">`;
        });
        imagesHtml += '</div>';
    }
    
    div.innerHTML = `
        <h3>${novel.title}</h3>
        ${imagesHtml}
        <p>${novel.description}</p>
    `;
    return div;
}

// عرض مؤشر تحميل
function showLoader() {
    document.querySelectorAll('.items-container').forEach(container => {
        container.innerHTML = '<div class="loader">جاري تحميل المحتوى...</div>';
    });
}

// إخفاء مؤشر تحميل
function hideLoader() {
    document.querySelectorAll('.loader').forEach(loader => {
        loader.remove();
    });
}
// عرض عنصر ملف
function renderFileItem(file) {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
        ${file.image ? `<img src="${file.image}" alt="${file.title}" class="item-image">` : ''}
        <h3>${file.title}</h3>
        <p>${file.description}</p>
        <a href="${file.drive_link}" target="_blank" class="item-button">تحميل الملف</a>
    `;
    return div;
}

// عرض عنصر سيرفر
function renderServerItem(server) {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
        ${server.image ? `<img src="${server.image}" alt="${server.title}" class="item-image">` : ''}
        <h3>${server.title}</h3>
        <p>${server.description}</p>
        <a href="${server.link}" target="_blank" class="item-button">انضم إلى السيرفر</a>
    `;
    return div;
}

// فتح صفحة تفاصيل العنصر
function openItemDetails(itemType, itemId) {
    window.location.href = `item-details.html?type=${itemType}&id=${itemId}`;
}

// تعديل دوال العرض لإضافة حدث النقر
function renderBookItem(book) {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
        ${book.image ? `<img src="${book.image}" alt="${book.title}" class="item-image">` : ''}
        <h3>${book.title}</h3>
        <p>${book.description}</p>
        <a href="${book.drive_link}" target="_blank" class="item-button">تحميل الكتاب</a>
    `;
    
    // إضافة حدث النقر لفتح التفاصيل
    div.addEventListener('click', () => openItemDetails('books', book.id));
    
    return div;
}

// عرض عنصر ملف
function renderFileItem(file) {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
        ${file.image ? `<img src="${file.image}" alt="${file.title}" class="item-image">` : ''}
        <h3>${file.title}</h3>
        <p>${file.description}</p>
        <a href="${file.drive_link}" target="_blank" class="item-button">تحميل الملف</a>
    `;
    return div;
}

// عرض عنصر منصة
function renderPlatformItem(platform) {
    const div = document.createElement('div');
    div.className = 'item platform-item';
    div.innerHTML = `
        <img src="${platform.image}" alt="${platform.title}" class="platform-image">
        <h3>${platform.title}</h3>
        <a href="${platform.link}" target="_blank" class="item-button">زيارة المنصة</a>
    `;
    return div;
}

// عرض عنصر تطبيق
function renderAppItem(app) {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
        ${app.image ? `<img src="${app.image}" alt="${app.title}" class="item-image">` : ''}
        <h3>${app.title}</h3>
        <p>${app.description}</p>
        <a href="${app.download_link}" class="item-button">تحميل التطبيق</a>
    `;
    return div;
}
// دالة لتحديث الموقع الرئيسي بعد الإضافة
async function refreshMainSite() {
    try {
        // إرسال طلب إلى الموقع الرئيسي لتحديث البيانات
        const response = await fetch('/');
        if (response.ok) {
            console.log('تم تحديث الموقع الرئيسي بنجاح');
        }
    } catch (error) {
        console.error('Error refreshing main site:', error);
    }
}

// مثال في دالة addItemToSiteData:
async function addItemToSiteData(table, item, formElement) {
    try {
        const savedItem = await saveItemToSupabase(table, item);
        
        if (!siteData[table]) {
            siteData[table] = [];
        }
        
        siteData[table].push(savedItem);
        renderAdminList(table, siteData[table]);
        
        if (formElement) {
            formElement.reset();
        }
        
        // تحديث الموقع الرئيسي
        await refreshMainSite();
        
        alert(`تم الإضافة بنجاح!`);
        return true;
    } catch (error) {
        console.error(`Error adding to ${table}:`, error);
        alert(`حدث خطأ أثناء الإضافة: ${error.message}`);
        return false;
    }
}
// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    
    // إضافة تأثيرات للتنقل بين الأقسام
    const navLinks = document.querySelectorAll('.main-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
});
