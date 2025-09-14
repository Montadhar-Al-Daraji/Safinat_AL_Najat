// تهيئة Supabase
const SUPABASE_URL = 'https://xzltdsmmolyvcmkfzedf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHRkc21tb2x5dmNta2Z6ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg1NzEsImV4cCI6MjA3MzI1NDU3MX0.3TJ49ctEhOT1KDIFtZXFw2jwTq57ujaWbqNNJ2Eeb1U';

// إنشاء عميل Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// حالة التطبيق
const appState = {
    data: {
        books: [],
        novels: [],
        files: [],
        platforms: [],
        apps: [],
        servers: []
    },
    currentTab: 'all',
    searchTerm: '',
    renderedSections: new Set(['all']),
    isLoading: false
};

// عناصر DOM الرئيسية
const domElements = {
    tabs: null,
    searchInput: null,
    searchBtn: null,
    searchResults: null,
    sections: null,
    containers: null
};

// فئات CSS للعناصر
const cssClasses = {
    active: 'active',
    hidden: 'hidden',
    loading: 'loading',
    item: 'item',
    itemImage: 'item-image',
    novelImages: 'novel-images',
    platformImage: 'platform-image',
    itemButton: 'item-button',
    noItems: 'no-items',
    searchResults: 'search-results',
    searchItem: 'search-item',
    contentSection: 'content-section',
    highlightsContainer: 'highlights-container'
};

// أسماء الأقسام بالعربية
const categoryNames = {
    books: 'كتاب',
    novels: 'رواية',
    files: 'ملف',
    platforms: 'منصة',
    apps: 'تطبيق',
    servers: 'سيرفر'
};

// تهيئة التطبيق
function initApp() {
    initializeDOMElements();
    setupEventListeners();
    loadData();
}

// تهيئة عناصر DOM
function initializeDOMElements() {
    domElements.tabs = document.querySelectorAll('.nav-tab');
    domElements.searchInput = document.getElementById('search-input');
    domElements.searchBtn = document.getElementById('search-btn');
    domElements.searchResults = document.getElementById('search-results');
    domElements.sections = document.querySelectorAll('.content-section');
    domElements.containers = {
        highlights: document.getElementById('highlights-container'),
        books: document.getElementById('books-container'),
        novels: document.getElementById('novels-container'),
        files: document.getElementById('files-container'),
        platforms: document.getElementById('platforms-container'),
        apps: document.getElementById('apps-container'),
        servers: document.getElementById('servers-container')
    };
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // أحداث التبويبات
    domElements.tabs.forEach(tab => {
        tab.addEventListener('click', handleTabClick);
    });

    // أحداث البحث
    domElements.searchBtn.addEventListener('click', performSearch);
    domElements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // إغلاق نتائج البحث عند النقر خارجها
    document.addEventListener('click', (e) => {
        if (!domElements.searchResults.contains(e.target) && 
            e.target !== domElements.searchInput && 
            e.target !== domElements.searchBtn) {
            domElements.searchResults.classList.remove(cssClasses.active);
        }
    });
}

// تحميل البيانات من Supabase
async function loadData() {
    try {
        setLoadingState(true);
        
        // جلب البيانات من جميع الجداول بشكل متوازي
        const [
            booksResponse, 
            novelsResponse, 
            filesResponse, 
            platformsResponse, 
            appsResponse, 
            serversResponse
        ] = await Promise.all([
            supabaseClient.from('books').select('*'),
            supabaseClient.from('novels').select('*'),
            supabaseClient.from('files').select('*'),
            supabaseClient.from('platforms').select('*'),
            supabaseClient.from('apps').select('*'),
            supabaseClient.from('servers').select('*')
        ]);

        // معالجة الاستجابات
        handleDataResponse('books', booksResponse);
        handleDataResponse('novels', novelsResponse);
        handleDataResponse('files', filesResponse);
        handleDataResponse('platforms', platformsResponse);
        handleDataResponse('apps', appsResponse);
        handleDataResponse('servers', serversResponse);

        renderAllSections();
        setLoadingState(false);
        
    } catch (error) {
        console.error('Error loading data:', error);
        showError('حدث خطأ في تحميل البيانات');
        setLoadingState(false);
    }
}

// معالجة استجابة البيانات
function handleDataResponse(category, response) {
    if (response.error) {
        console.error(`Error loading ${category}:`, response.error);
        appState.data[category] = [];
    } else {
        appState.data[category] = response.data || [];
    }
}

// تعيين حالة التحميل
function setLoadingState(isLoading) {
    appState.isLoading = isLoading;
    const mainElement = document.querySelector('main');
    
    if (isLoading) {
        mainElement.classList.add(cssClasses.loading);
    } else {
        mainElement.classList.remove(cssClasses.loading);
    }
}

// معالجة النقر على التبويب
function handleTabClick(e) {
    e.preventDefault();
    
    const tab = e.currentTarget;
    const tabName = tab.getAttribute('data-tab');
    
    // تحديث التبويب النشط
    updateActiveTab(tab);
    
    // إظهار القسم المحدد
    showSection(tabName);
}

// تحديث التبويب النشط
function updateActiveTab(activeTab) {
    domElements.tabs.forEach(tab => {
        tab.classList.remove(cssClasses.active);
    });
    activeTab.classList.add(cssClasses.active);
    appState.currentTab = activeTab.getAttribute('data-tab');
}

// إظهار قسم معين
function showSection(sectionName) {
    // إخفاء جميع الأقسام
    domElements.sections.forEach(section => {
        section.classList.remove(cssClasses.active);
    });
    
    // إظهار القسم المحدد
    const targetSection = document.getElementById(`${sectionName}-content`);
    if (targetSection) {
        targetSection.classList.add(cssClasses.active);
        
        // إذا كان القسم لم يتم عرضه من قبل، قم بعرضه
        if (!appState.renderedSections.has(sectionName)) {
            renderSection(sectionName);
            appState.renderedSections.add(sectionName);
        }
    }
}

// عرض جميع الأقسام
function renderAllSections() {
    renderSection('all');
    Object.keys(appState.data).forEach(section => {
        if (appState.currentTab === section) {
            renderSection(section);
            appState.renderedSections.add(section);
        }
    });
}

// عرض قسم معين
function renderSection(sectionId) {
    const container = domElements.containers[sectionId];
    if (!container) return;
    
    if (sectionId === 'all') {
        renderHighlights();
        return;
    }
    
    const items = appState.data[sectionId];
    if (!items || items.length === 0) {
        container.innerHTML = `<p class="${cssClasses.noItems}">لا توجد عناصر لعرضها</p>`;
        return;
    }
    
    container.innerHTML = '';
    items.forEach(item => {
        const itemElement = createItemElement(sectionId, item);
        container.appendChild(itemElement);
    });
}

// عرض المحتوى البارز على الصفحة الرئيسية
function renderHighlights() {
    const container = domElements.containers.highlights;
    if (!container) return;
    
    container.innerHTML = '';
    
    // اختيار عناصر عشوائية من كل قسم
    const highlights = [];
    Object.keys(appState.data).forEach(category => {
        if (appState.data[category].length > 0) {
            const randomIndex = Math.floor(Math.random() * appState.data[category].length);
            highlights.push({
                category: category,
                item: appState.data[category][randomIndex]
            });
        }
    });
    
    if (highlights.length === 0) {
        container.innerHTML = `<p class="${cssClasses.noItems}">لا توجد عناصر لعرضها</p>`;
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
    div.className = cssClasses.item;
    div.setAttribute('data-item-id', item.id);
    div.setAttribute('data-category', category);
    
    // إضافة حدث النقر لفتح صفحة التفاصيل
    div.addEventListener('click', () => {
        openItemDetails(category, item.id);
    });
    
    // إضافة تأثير عند التمرير
    div.style.cursor = 'pointer';
    div.style.transition = 'transform 0.2s ease-in-out';
    div.addEventListener('mouseenter', () => {
        div.style.transform = 'translateY(-5px)';
    });
    div.addEventListener('mouseleave', () => {
        div.style.transform = 'translateY(0)';
    });
    
    let content = '';
    
    switch(category) {
        case 'books':
            content = createBookItem(item);
            break;
        case 'novels':
            content = createNovelItem(item);
            break;
        case 'files':
            content = createFileItem(item);
            break;
        case 'platforms':
            content = createPlatformItem(item);
            break;
        case 'apps':
            content = createAppItem(item);
            break;
        case 'servers':
            content = createServerItem(item);
            break;
    }
    
    div.innerHTML = content;
    return div;
}

// فتح صفحة تفاصيل العنصر
function openItemDetails(category, itemId) {
    window.location.href = `item-details.html?type=${category}&id=${itemId}`;
}

// إنشاء عنصر كتاب
function createBookItem(item) {
    return `
        ${item.image ? `<img src="${item.image}" alt="${item.title}" class="${cssClasses.itemImage}">` : ''}
        <h3>${item.title}</h3>
        <p>${item.description || ''}</p>
        <a href="${item.drive_link}" target="_blank" class="${cssClasses.itemButton}">تحميل الكتاب</a>
    `;
}

// إنشاء عنصر رواية (معدّل)
function createNovelItem(item) {
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
    
    // صورة رئيسية
    let mainImage = '';
    if (imagesArray.length > 0) {
        mainImage = `<img src="${imagesArray[0]}" alt="${item.title}" class="${cssClasses.itemImage}">`;
    }
    
    // صور مصغرة
    if (imagesArray.length > 1) {
        imagesHtml = `<div class="${cssClasses.novelImages}">`;
        imagesArray.slice(1, 4).forEach((img, index) => {
            imagesHtml += `<img src="${img}" alt="صورة ${index + 2}" class="novel-thumbnail">`;
        });
        imagesHtml += '</div>';
    }
    
    return `
        ${mainImage}
        <h3>${item.title}</h3>
        ${imagesHtml}
        <p>${item.description || ''}</p>
    `;
}

// إنشاء عنصر ملف
function createFileItem(item) {
    return `
        ${item.image ? `<img src="${item.image}" alt="${item.title}" class="${cssClasses.itemImage}">` : ''}
        <h3>${item.title}</h3>
        <p>${item.description || ''}</p>
        <a href="${item.drive_link}" target="_blank" class="${cssClasses.itemButton}">تحميل الملف</a>
    `;
}

// إنشاء عنصر منصة
function createPlatformItem(item) {
    return `
        <img src="${item.image}" alt="${item.title}" class="${cssClasses.platformImage}">
        <h3>${item.title}</h3>
        <a href="${item.link}" target="_blank" class="${cssClasses.itemButton}">زيارة المنصة</a>
    `;
}

// إنشاء عنصر تطبيق
function createAppItem(item) {
    return `
        ${item.image ? `<img src="${item.image}" alt="${item.title}" class="${cssClasses.itemImage}">` : ''}
        <h3>${item.title}</h3>
        <p>${item.description || ''}</p>
        <a href="${item.download_link}" class="${cssClasses.itemButton}">تحميل التطبيق</a>
    `;
}

// إنشاء عنصر سيرفر
function createServerItem(item) {
    return `
        ${item.image ? `<img src="${item.image}" alt="${item.title}" class="${cssClasses.itemImage}">` : ''}
        <h3>${item.title}</h3>
        <p>${item.description || ''}</p>
        <a href="${item.link}" target="_blank" class="${cssClasses.itemButton}">انضم إلى السيرفر</a>
    `;
}

// إجراء البحث
function performSearch() {
    const searchTerm = domElements.searchInput.value.trim().toLowerCase();
    appState.searchTerm = searchTerm;
    
    if (searchTerm.length < 2) {
        domElements.searchResults.classList.remove(cssClasses.active);
        return;
    }
    
    // البحث في جميع البيانات
    const results = [];
    Object.keys(appState.data).forEach(category => {
        appState.data[category].forEach(item => {
            if (item.title && item.title.toLowerCase().includes(searchTerm) ||
                (item.description && item.description.toLowerCase().includes(searchTerm))) {
                results.push({ category, item });
            }
        });
    });
    
    // عرض نتائج البحث
    displaySearchResults(results);
}

// عرض نتائج البحث
function displaySearchResults(results) {
    if (results.length > 0) {
        let html = '';
        results.forEach(result => {
            html += `
                <div class="${cssClasses.searchItem}" data-category="${result.category}" data-id="${result.item.id}">
                    <strong>${result.item.title}</strong>
                    <span>(${categoryNames[result.category]})</span>
                </div>
            `;
        });
        
        domElements.searchResults.innerHTML = html;
        domElements.searchResults.classList.add(cssClasses.active);
        
        // إضافة event listeners للنتائج
        domElements.searchResults.querySelectorAll(`.${cssClasses.searchItem}`).forEach(item => {
            item.addEventListener('click', handleSearchResultClick);
        });
    } else {
        domElements.searchResults.innerHTML = `<p class="${cssClasses.noItems}">لا توجد نتائج للبحث</p>`;
        domElements.searchResults.classList.add(cssClasses.active);
    }
}

// معالجة النقر على نتيجة البحث
function handleSearchResultClick(e) {
    const item = e.currentTarget;
    const category = item.getAttribute('data-category');
    const id = item.getAttribute('data-id');
    
    // الانتقال إلى القسم المناسب
    domElements.tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === category) {
            tab.click();
        }
    });
    
    // إخفاء نتائج البحث
    domElements.searchResults.classList.remove(cssClasses.active);
    domElements.searchInput.value = '';
    
    // التمرير إلى العنصر المحدد
    setTimeout(() => {
        const element = document.querySelector(`[data-item-id="${id}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            highlightElement(element);
        }
    }, 300);
}

// تمييز العنصر
function highlightElement(element) {
    element.classList.add('highlight');
    setTimeout(() => {
        element.classList.remove('highlight');
    }, 2000);
}

// عرض رسالة خطأ
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <p>${message}</p>
    `;
    
    document.querySelector('main').prepend(errorDiv);
    
    // إزالة رسالة الخطأ بعد 5 ثواني
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initApp);

// إضافة أنماط للتمييز وتحسين الروايات
const customStyles = document.createElement('style');
customStyles.textContent = 
    .highlight {
        animation: highlight 2s ease;
        border: 2px solid #D4AF37 !important;
    }
    
    @keyframes highlight {
        0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(212, 175, 55, 0); }
        100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
    }
    
    .loading {
        opacity: 0.7;
        pointer-events: none;
    }
    
    .loading::after {
        content: 'جاري التحميل...';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 1.2rem;
        color: #FFFFFF;
    }
    
    /* تحسينات لصور الروايات */
    .novel-images {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 5px;
        margin-top: 10px;
    }
    
    .novel-thumbnail {
        width: 100%;
        height: 60px;
        object-fit: cover;
        border-radius: 5px;
        border: 1px solid #FFFFFF;
    }
    
    /* تحسينات عامة للبطاقات */
    .item {
        transition: all 0.3s ease;
    }
    
    .item:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    }
    
    /* تحسينات للاستجابة على الجوال */
    @media (max-width: 768px) {
        .novel-images {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .novel-thumbnail {
            height: 50px;
        }
    }
;
document.head.appendChild(customStyles);
