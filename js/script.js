// تهيئة Supabase
const SUPABASE_URL = 'https://xzltdsmmolyvcmkfzedf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHRkc21tb2x5dmNta2Z6ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg1NzEsImV4cCI6MjA3MzI1NDU3MX0.3TJ49ctEhOT1KDIFtZXFw2jwTq57ujaWbqNNJ2Eeb1U';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// بيانات الموقع (سيتم استبدالها بالبيانات من Supabase)
let siteData = {
    books: [],
    novels: [],
    files: [],
    platforms: [],
    apps: []
};

// تحميل البيانات من Supabase
async function loadData() {
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

        renderAllSections();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// عرض جميع الأقسام
function renderAllSections() {
    renderSection('books', siteData.books, renderBookItem);
    renderSection('novels', siteData.novels, renderNovelItem);
    renderSection('files', siteData.files, renderFileItem);
    renderSection('platforms', siteData.platforms, renderPlatformItem);
    renderSection('apps', siteData.apps, renderAppItem);
}

// عرض قسم معين
function renderSection(sectionId, items, renderFunction) {
    const container = document.getElementById(`${sectionId}-container`);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (items.length === 0) {
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
        <a href="${book.driveLink}" target="_blank" class="item-button">تحميل الكتاب</a>
    `;
    return div;
}

// عرض عنصر رواية
function renderNovelItem(novel) {
    const div = document.createElement('div');
    div.className = 'item';
    
    let imagesHtml = '';
    if (novel.images && novel.images.length > 0) {
        imagesHtml = '<div class="novel-images">';
        novel.images.forEach(img => {
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

// عرض عنصر ملف
function renderFileItem(file) {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
        ${file.image ? `<img src="${file.image}" alt="${file.title}" class="item-image">` : ''}
        <h3>${file.title}</h3>
        <p>${file.description}</p>
        <a href="${file.driveLink}" target="_blank" class="item-button">تحميل الملف</a>
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

// عرض عنرق تطبيق
function renderAppItem(app) {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
        ${app.image ? `<img src="${app.image}" alt="${app.title}" class="item-image">` : ''}
        <h3>${app.title}</h3>
        <p>${app.description}</p>
        <a href="${app.downloadLink}" class="item-button">تحميل التطبيق</a>
    `;
    return div;
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
