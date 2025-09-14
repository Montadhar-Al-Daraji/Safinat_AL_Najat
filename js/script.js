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
    servers: []
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
        const { data: servers, error: serversError } = await supabaseClient.from('servers').select('*');

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
        siteData.servers = servers || [];

        renderAllSections();
        setupTabs();
        setupSearch();
        
    } catch (error) {
        console.error('Error loading data:', error);
        // عرض رسالة توضح أن البيانات غير متوفرة
        document.querySelectorAll('.items-container').forEach(container => {
            container.innerHTML = '<p class="no-items">لا توجد عناصر لعرضها حالياً</p>';
        });
    }
}

// إعداد نظام التبويبات
function setupTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // إلغاء تنشيط جميع التبويبات
            tabs.forEach(t => t.classList.remove('active'));
            
            // تنشيط التبويب الحالي
            this.classList.add('active');
            
            // إخفاء جميع الأقسام
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // إظهار القسم المحدد
            const tabName = this.getAttribute('data-tab');
            if (tabName === 'all') {
                document.getElementById('all-content').classList.add('active');
                renderHighlights();
            } else {
                document.getElementById(`${tabName}-content`).classList.add('active');
            }
        });
    });
}

// إعداد نظام البحث
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const searchResults = document.getElementById('search-results');
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    function performSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (searchTerm.length < 2) {
            searchResults.classList.remove('active');
            return;
        }
        
        // البحث في جميع البيانات
        const results = [];
        
        Object.keys(siteData).forEach(category => {
            siteData[category].forEach(item => {
                if (item.title && item.title.toLowerCase().includes(searchTerm) ||
                    (item.description && item.description.toLowerCase().includes(searchTerm))) {
                    results.push({
                        category: category,
                        item: item
                    });
                }
            });
        });
        
        // عرض نتائج البحث
        if (results.length > 0) {
            let html = '';
            results.forEach(result => {
                const categoryNames = {
                    'books': 'كتاب',
                    'novels': 'رواية',
                    'files': 'ملف',
                    'platforms': 'منصة',
                    'apps': 'تطبيق',
                    'servers': 'سيرفر'
                };
                
                html += `
                    <div class="search-item" data-category="${result.category}" data-id="${result.item.id}">
                        <strong>${result.item.title}</strong>
                        <span>(${categoryNames[result.category]})</span>
                    </div>
                `;
            });
            
            searchResults.innerHTML = html;
            searchResults.classList.add('active');
            
            // إضافة event listeners للنتائج
            document.querySelectorAll('.search-item').forEach(item => {
                item.addEventListener('click', function() {
                    const category = this.getAttribute('data-category');
                    const id = this.getAttribute('data-id');
                    
                    // الانتقال إلى القسم المناسب
                    document.querySelectorAll('.nav-tab').forEach(tab => {
                        tab.classList.remove('active');
                        if (tab.getAttribute('data-tab') === category) {
                            tab.classList.add('active');
                        }
                    });
                    
                    document.querySelectorAll('.content-section').forEach(section => {
                        section.classList.remove('active');
                    });
                    
                    document.getElementById(`${category}-content`).classList.add('active');
                    
                    // إخفاء نتائج البحث
                    searchResults.classList.remove('active');
                    searchInput.value = '';
                    
                    // التمرير إلى العنصر المحدد
                    setTimeout(() => {
                        const element = document.querySelector(`[data-item-id="${id}"]`);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            element.classList.add('highlight');
                            setTimeout(() => element.classList.remove('highlight'), 2000);
                        }
                    }, 300);
                });
            });
            
        } else {
            searchResults.innerHTML = '<p class="no-items">لا توجد نتائج للبحث</p>';
            searchResults.classList.add('active');
        }
    }
    
    // إغلاق نتائج البحث عند النقر خارجها
    document.addEventListener('click', function(e) {
        if (!searchResults.contains(e.target) && e.target !== searchInput && e.target !== searchBtn) {
            searchResults.classList.remove('active');
        }
    });
}

// عرض المحتوى البارز على الصفحة الرئيسية
function renderHighlights() {
    const container = document.getElementById('highlights-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // اختيار عناصر عشوائية من كل قسم لعرضها
    const highlights = [];
    
    Object.keys(siteData).forEach(category => {
        if (siteData[category].length > 0) {
            const randomIndex = Math.floor(Math.random() * siteData[category].length);
            highlights.push({
                category: category,
                item: siteData[category][randomIndex]
            });
        }
    });
    
    if (highlights.length === 0) {
        container.innerHTML = '<p class="no-items">لا توجد عناصر لعرضها</p>';
        return;
    }
    
    highlights.forEach(highlight => {
        const itemElement = createItemElement(highlight.category, highlight.item);
        container.appendChild(itemElement);
    });
}

// إنشاء عنصر لعرضه
function createItemElement(category, item) {
    const div = document.createElement('div');
    div.className = 'item';
    div.setAttribute('data-item-id', item.id);
    
    let content = '';
    
    switch(category) {
        case 'books':
            content = `
                ${item.image ? `<img src="${item.image}" alt="${item.title}" class="item-image">` : ''}
                <h3>${item.title}</h3>
                <p>${item.description || ''}</p>
                <a href="${item.drive_link}" target="_blank" class="item-button">تحميل الكتاب</a>
            `;
            break;
            
        case 'novels':
            let imagesHtml = '';
            let imagesArray = [];
            
            if (item.images) {
                if (typeof item.images === 'string') {
                    try {
                        imagesArray = JSON.parse(item.images);
                    } catch (e) {
                        imagesArray = [item.images];
                    }
                } else if (Array.isArray(item.images)) {
                    imagesArray = item.images;
                }
            }
            
            if (imagesArray.length > 0) {
                imagesHtml = '<div class="novel-images">';
                imagesArray.slice(0, 3).forEach(img => {
                    imagesHtml += `<img src="${img}" alt="صورة الرواية">`;
                });
                imagesHtml += '</div>';
            }
            
            content = `
                <h3>${item.title}</h3>
                ${imagesHtml}
                <p>${item.description || ''}</p>
            `;
            break;
            
        case 'files':
            content = `
                ${item.image ? `<img src="${item.image}" alt="${item.title}" class="item-image">` : ''}
                <h3>${item.title}</h3>
                <p>${item.description || ''}</p>
                <a href="${item.drive_link}" target="_blank" class="item-button">تحميل الملف</a>
            `;
            break;
            
        case 'platforms':
            content = `
                <img src="${item.image}" alt="${item.title}" class="platform-image">
                <h3>${item.title}</h3>
                <a href="${item.link}" target="_blank" class="item-button">زيارة المنصة</a>
            `;
            break;
            
        case 'apps':
            content = `
                ${item.image ? `<img src="${item.image}" alt="${item.title}" class="item-image">` : ''}
                <h3>${item.title}</h3>
                <p>${item.description || ''}</p>
                <a href="${item.download_link}" class="item-button">تحميل التطبيق</a>
            `;
            break;
            
        case 'servers':
            content = `
                ${item.image ? `<img src="${item.image}" alt="${item.title}" class="item-image">` : ''}
                <h3>${item.title}</h3>
                <p>${item.description || ''}</p>
                <a href="${item.link}" target="_blank" class="item-button">انضم إلى السيرفر</a>
            `;
            break;
    }
    
    div.innerHTML = content;
    return div;
}

// عرض جميع الأقسام
function renderAllSections() {
    renderSection('books', siteData.books);
    renderSection('novels', siteData.novels);
    renderSection('files', siteData.files);
    renderSection('platforms', siteData.platforms);
    renderSection('apps', siteData.apps);
    renderSection('servers', siteData.servers);
    renderHighlights();
}

// عرض قسم معين
function renderSection(sectionId, items) {
    const container = document.getElementById(`${sectionId}-container`);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p class="no-items">لا توجد عناصر لعرضها</p>';
        return;
    }
    
    items.forEach(item => {
        const itemElement = createItemElement(sectionId, item);
        container.appendChild(itemElement);
    });
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

// تأثير التمييز للعناصر
const style = document.createElement('style');
style.textContent = `
    .highlight {
        animation: highlight 2s ease;
        border: 2px solid #D4AF37 !important;
    }
    
    @keyframes highlight {
        0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(212, 175, 55, 0); }
        100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
    }
`;
document.head.appendChild(style);
