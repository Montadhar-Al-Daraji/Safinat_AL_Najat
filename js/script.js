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
    
    // تحديث العداد
    updateItemsCount(sectionId, items.length);
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
            // عرض عنصرين من كل قسم بدلاً من عنصر واحد عشوائي
            const itemsToShow = appState.data[category].slice(0, 2);
            itemsToShow.forEach(item => {
                highlights.push({
                    category: category,
                    item: item
                });
            });
        }
    });
    
    if (highlights.length === 0) {
        container.innerHTML = `<p class="${cssClasses.noItems}">لا توجد عناصر لعرضها</p>`;
        return;
    }
    
    highlights.forEach(highlight => {
        const itemElement = createHighlightElement(highlight.category, highlight.item);
        container.appendChild(itemElement);
    });
}
// فتح صفحة تفاصيل العنصر
function openItemDetails(category, itemId) {
    window.location.href = `item-details.html?type=${category}&id=${itemId}`;
}

// إنشاء عنصر لعرضه (معدّل)
function createItemElement(category, item) {
    const div = document.createElement('div');
    div.className = cssClasses.item;
    div.setAttribute('data-item-id', item.id);
    div.setAttribute('data-category', category);
    
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
    
    // إضافة مستمع حدث للنقر على العنصر (باستثناء الأزرار)
    div.addEventListener('click', (e) => {
        // منع فتح التفاصيل إذا تم النقر على زر
        if (!e.target.closest('.item-button')) {
            openItemDetails(category, item.id);
        }
    });
    
    // إضافة تأثيرات التمرير
    div.style.cursor = 'pointer';
    div.style.transition = 'transform 0.2s ease-in-out';
    div.addEventListener('mouseenter', () => {
        div.style.transform = 'translateY(-5px)';
    });
    div.addEventListener('mouseleave', () => {
        div.style.transform = 'translateY(0)';
    });
    
    return div;
}

// إنشاء عنصر مميز للصفحة الرئيسية
function createHighlightElement(category, item) {
    const div = document.createElement('div');
    div.className = cssClasses.item;
    div.setAttribute('data-item-id', item.id);
    div.setAttribute('data-category', category);
    
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
    
    // إضافة شارة توضح نوع المحتوى
    content = `
        <div class="item-badge">${categoryNames[category]}</div>
        ${content}
    `;
    
    div.innerHTML = content;
    
    // إضافة مستمع حدث للنقر على العنصر (باستثناء الأزرار)
    div.addEventListener('click', (e) => {
        // منع فتح التفاصيل إذا تم النقر على زر
        if (!e.target.closest('.item-button')) {
            openItemDetails(category, item.id);
        }
    });
    
    // إضافة تأثيرات التمرير
    div.style.cursor = 'pointer';
    div.style.transition = 'transform 0.2s ease-in-out';
    div.addEventListener('mouseenter', () => {
        div.style.transform = 'translateY(-5px)';
    });
    div.addEventListener('mouseleave', () => {
        div.style.transform = 'translateY(0)';
    });
    
    return div;
}
// إنشاء عنصر مميز للصفحة الرئيسية
function createHighlightElement(category, item) {
    const div = document.createElement('div');
    div.className = cssClasses.item;
    div.setAttribute('data-item-id', item.id);
    div.setAttribute('data-category', category);
    
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
    
    // إضافة شارة توضح نوع المحتوى
    content = `
        <div class="item-badge">${categoryNames[category]}</div>
        ${content}
    `;
    
    div.innerHTML = content;
    
    // إضافة مستمع حدث للنقر على العنصر (باستثناء الأزرار)
    div.addEventListener('click', (e) => {
        // منع فتح التفاصيل إذا تم النقر على زر
        if (!e.target.closest('.item-button')) {
            openItemDetails(category, item.id);
        }
    });
    
    // إضافة تأثيرات التمرير
    div.style.cursor = 'pointer';
    div.style.transition = 'transform 0.2s ease-in-out';
    div.addEventListener('mouseenter', () => {
        div.style.transform = 'translateY(-5px)';
    });
    div.addEventListener('mouseleave', () => {
        div.style.transform = 'translateY(0)';
    });
    
    return div;
}

// فتح صفحة تفاصيل العنصر
function openItemDetails(category, itemId) {
    window.location.href = `item-details.html?type=${category}&id=${itemId}`;
}

// إنشاء عنصر كتاب
function createBookItem(item) {
    return `
        <div class="item-image-container">
            ${item.image ? `<img src="${item.image}" alt="${item.title}" class="${cssClasses.itemImage}">` : 
            `<div class="placeholder-image"><i class="fas fa-book"></i></div>`}
        </div>
        <h3>${item.title}</h3>
        <p>${item.description || 'لا يوجد وصف متاح'}</p>
        <a href="${item.drive_link || '#'}" target="_blank" class="${cssClasses.itemButton}">تحميل الكتاب</a>
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
    } else {
        mainImage = `<div class="placeholder-image"><i class="fas fa-book-open"></i></div>`;
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
        <div class="item-image-container">
            ${mainImage}
        </div>
        <h3>${item.title}</h3>
        ${imagesHtml}
        <p>${item.description || 'لا يوجد وصف متاح'}</p>
        <a href="${item.drive_link || '#'}" target="_blank" class="${cssClasses.itemButton}">قراءة الرواية</a>
    `;
}

// إنشاء عنصر ملف
function createFileItem(item) {
    return `
        <div class="item-image-container">
            ${item.image ? `<img src="${item.image}" alt="${item.title}" class="${cssClasses.itemImage}">` : 
            `<div class="placeholder-image"><i class="fas fa-file"></i></div>`}
        </div>
        <h3>${item.title}</h3>
        <p>${item.description || 'لا يوجد وصف متاح'}</p>
        <a href="${item.drive_link || '#'}" target="_blank" class="${cssClasses.itemButton}">تحميل الملف</a>
    `;
}

// إنشاء عنصر منصة
function createPlatformItem(item) {
    return `
        <div class="item-image-container platform-image-container">
            ${item.image ? `<img src="${item.image}" alt="${item.title}" class="${cssClasses.platformImage}">` : 
            `<div class="placeholder-image"><i class="fas fa-globe"></i></div>`}
        </div>
        <h3>${item.title}</h3>
        <a href="${item.link || '#'}" target="_blank" class="${cssClasses.itemButton}">زيارة المنصة</a>
    `;
}

// إنشاء عنصر تطبيق
function createAppItem(item) {
    return `
        <div class="item-image-container">
            ${item.image ? `<img src="${item.image}" alt="${item.title}" class="${cssClasses.itemImage}">` : 
            `<div class="placeholder-image"><i class="fas fa-mobile-alt"></i></div>`}
        </div>
        <h3>${item.title}</h3>
        <p>${item.description || 'لا يوجد وصف متاح'}</p>
        <a href="${item.download_link || '#'}" class="${cssClasses.itemButton}">تحميل التطبيق</a>
    `;
}

// إنشاء عنصر سيرفر
function createServerItem(item) {
    return `
        <div class="item-image-container">
            ${item.image ? `<img src="${item.image}" alt="${item.title}" class="${cssClasses.itemImage}">` : 
            `<div class="placeholder-image"><i class="fas fa-server"></i></div>`}
        </div>
        <h3>${item.title}</h3>
        <p>${item.description || 'لا يوجد وصف متاح'}</p>
        <a href="${item.link || '#'}" target="_blank" class="${cssClasses.itemButton}">انضم إلى السيرفر</a>
    `;
}

// تحديث عداد العناصر
function updateItemsCount(category, count) {
    const countElement = document.getElementById(`${category}-count`);
    if (countElement) {
        countElement.textContent = `(${count})`;
    }
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

// وظيفة تمرير الأقسام
function scrollCategories(direction) {
    const container = document.querySelector('.categories-wrapper');
    container.scrollBy({ left: direction, behavior: 'smooth' });
}
// Configuration Object for constants
const config = {
    supabase: {
        url: 'https://xzltdsmmolyvcmkfzedf.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHRkc21tb2x5dmNta2Z6ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg1NzEsImV4cCI6MjA3MzI1NDU3MX0.3TJ49ctEhOT1KDIFtZXFw2jwTq57ujaWbqNNJ2Eeb1U',
        tables: ['books', 'novels', 'files', 'platforms', 'apps', 'servers']
    },
    css: {
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
        highlightsContainer: 'highlights-container',
        highlight: 'highlight',
        error: 'error-message'
    },
    categoryNames: {
        books: 'كتاب',
        novels: 'رواية',
        files: 'ملف',
        platforms: 'منصة',
        apps: 'تطبيق',
        servers: 'سيرفر'
    }
};

// Supabase Client Initialization
const supabaseClient = window.supabase.createClient(config.supabase.url, config.supabase.anonKey);

// Application State Management
const appState = {
    data: {},
    currentTab: 'all',
    renderedSections: new Set(['all']),
    isLoading: false,
    searchTerm: ''
};

// DOM Elements Module
const UI = {
    elements: {},

    init: () => {
        UI.elements.tabs = document.querySelectorAll('.nav-tab');
        UI.elements.searchInput = document.getElementById('search-input');
        UI.elements.searchBtn = document.getElementById('search-btn');
        UI.elements.searchResults = document.getElementById('search-results');
        UI.elements.sections = document.querySelectorAll('.content-section');
        UI.elements.containers = {
            highlights: document.getElementById('highlights-container'),
            books: document.getElementById('books-container'),
            novels: document.getElementById('novels-container'),
            files: document.getElementById('files-container'),
            platforms: document.getElementById('platforms-container'),
            apps: document.getElementById('apps-container'),
            servers: document.getElementById('servers-container')
        };
        UI.elements.main = document.querySelector('main');
    },

    setLoadingState: (isLoading) => {
        appState.isLoading = isLoading;
        if (isLoading) {
            UI.elements.main.classList.add(config.css.loading);
        } else {
            UI.elements.main.classList.remove(config.css.loading);
        }
    },

    updateActiveTab: (activeTab) => {
        UI.elements.tabs.forEach(tab => tab.classList.remove(config.css.active));
        activeTab.classList.add(config.css.active);
        appState.currentTab = activeTab.getAttribute('data-tab');
    },

    showSection: (sectionName) => {
        UI.elements.sections.forEach(section => section.classList.remove(config.css.active));
        const targetSection = document.getElementById(`${sectionName}-content`);
        if (targetSection) {
            targetSection.classList.add(config.css.active);
            if (!appState.renderedSections.has(sectionName)) {
                UI.renderSection(sectionName);
                appState.renderedSections.add(sectionName);
            }
        }
    },

    showError: (message) => {
        const errorDiv = document.createElement('div');
        errorDiv.className = config.css.error;
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i><p>${message}</p>`;
        UI.elements.main.prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    },

    updateItemsCount: (category, count) => {
        const countElement = document.getElementById(`${category}-count`);
        if (countElement) {
            countElement.textContent = `(${count})`;
        }
    },

    renderSection: (sectionId) => {
        const container = UI.elements.containers[sectionId];
        if (!container) return;

        container.innerHTML = '';
        if (sectionId === 'all') {
            UI.renderHighlights();
            return;
        }

        const items = appState.data[sectionId] || [];
        if (items.length === 0) {
            container.innerHTML = `<p class="${config.css.noItems}">لا توجد عناصر لعرضها</p>`;
            return;
        }

        items.forEach(item => {
            container.appendChild(UI.createItemElement(sectionId, item));
        });
        UI.updateItemsCount(sectionId, items.length);
    },

    renderHighlights: () => {
        const container = UI.elements.containers.highlights;
        if (!container) return;

        container.innerHTML = '';
        const allItems = [];
        config.supabase.tables.forEach(category => {
            if (appState.data[category]) {
                appState.data[category].forEach(item => {
                    allItems.push({ ...item, category });
                });
            }
        });

        if (allItems.length === 0) {
            container.innerHTML = `<p class="${config.css.noItems}">لا توجد عناصر لعرضها</p>`;
            return;
        }

        const HIGHLIGHTS_COUNT = 6;
        const shuffledItems = allItems.sort(() => 0.5 - Math.random());
        const highlights = shuffledItems.slice(0, HIGHLIGHTS_COUNT);

        highlights.forEach(highlight => {
            container.appendChild(UI.createHighlightElement(highlight.category, highlight));
        });
    },

    createItemElement: (category, item) => {
        const div = document.createElement('div');
        div.className = config.css.item;
        div.setAttribute('data-item-id', item.id);
        div.setAttribute('data-category', category);
        div.innerHTML = UI.createItemHTML(category, item);

        div.addEventListener('click', (e) => {
            if (!e.target.closest(`.${config.css.itemButton}`)) {
                openItemDetails(category, item.id);
            }
        });

        div.style.cursor = 'pointer';
        div.style.transition = 'transform 0.2s ease-in-out';
        div.addEventListener('mouseenter', () => div.style.transform = 'translateY(-5px)');
        div.addEventListener('mouseleave', () => div.style.transform = 'translateY(0)');
        
        return div;
    },

    createHighlightElement: (category, item) => {
        const div = UI.createItemElement(category, item);
        div.querySelector('.item-image-container').insertAdjacentHTML('beforebegin', `<div class="item-badge">${config.categoryNames[category]}</div>`);
        return div;
    },

    createItemHTML: (category, item) => {
        switch(category) {
            case 'books':
                return `
                    <div class="item-image-container">
                        ${item.image ? `<img src="${item.image}" alt="${item.title}" class="${config.css.itemImage}">` : 
                        `<div class="placeholder-image"><i class="fas fa-book"></i></div>`}
                    </div>
                    <h3>${item.title}</h3>
                    <p>${item.description || 'لا يوجد وصف متاح'}</p>
                    <a href="${item.drive_link || '#'}" target="_blank" class="${config.css.itemButton}">تحميل الكتاب</a>
                `;
            case 'novels':
                let imagesArray = Array.isArray(item.images) ? item.images : (item.images ? JSON.parse(item.images) : []);
                const mainImage = imagesArray.length > 0 ? `<img src="${imagesArray[0]}" alt="${item.title}" class="${config.css.itemImage}">` : `<div class="placeholder-image"><i class="fas fa-book-open"></i></div>`;
                const imagesHtml = imagesArray.slice(1, 4).map((img, index) => `<img src="${img}" alt="صورة ${index + 2}" class="novel-thumbnail">`).join('');
                return `
                    <div class="item-image-container">${mainImage}</div>
                    <h3>${item.title}</h3>
                    <div class="${config.css.novelImages}">${imagesHtml}</div>
                    <p>${item.description || 'لا يوجد وصف متاح'}</p>
                    <a href="${item.drive_link || '#'}" target="_blank" class="${config.css.itemButton}">قراءة الرواية</a>
                `;
            case 'files':
                return `
                    <div class="item-image-container">
                        ${item.image ? `<img src="${item.image}" alt="${item.title}" class="${config.css.itemImage}">` : 
                        `<div class="placeholder-image"><i class="fas fa-file"></i></div>`}
                    </div>
                    <h3>${item.title}</h3>
                    <p>${item.description || 'لا يوجد وصف متاح'}</p>
                    <a href="${item.drive_link || '#'}" target="_blank" class="${config.css.itemButton}">تحميل الملف</a>
                `;
            case 'platforms':
                return `
                    <div class="item-image-container platform-image-container">
                        ${item.image ? `<img src="${item.image}" alt="${item.title}" class="${config.css.platformImage}">` : 
                        `<div class="placeholder-image"><i class="fas fa-globe"></i></div>`}
                    </div>
                    <h3>${item.title}</h3>
                    <a href="${item.link || '#'}" target="_blank" class="${config.css.itemButton}">زيارة المنصة</a>
                `;
            case 'apps':
                return `
                    <div class="item-image-container">
                        ${item.image ? `<img src="${item.image}" alt="${item.title}" class="${config.css.itemImage}">` : 
                        `<div class="placeholder-image"><i class="fas fa-mobile-alt"></i></div>`}
                    </div>
                    <h3>${item.title}</h3>
                    <p>${item.description || 'لا يوجد وصف متاح'}</p>
                    <a href="${item.download_link || '#'}" class="${config.css.itemButton}">تحميل التطبيق</a>
                `;
            case 'servers':
                return `
                    <div class="item-image-container">
                        ${item.image ? `<img src="${item.image}" alt="${item.title}" class="${config.css.itemImage}">` : 
                        `<div class="placeholder-image"><i class="fas fa-server"></i></div>`}
                    </div>
                    <h3>${item.title}</h3>
                    <p>${item.description || 'لا يوجد وصف متاح'}</p>
                    <a href="${item.link || '#'}" target="_blank" class="${config.css.itemButton}">انضم إلى السيرفر</a>
                `;
            default:
                return '';
        }
    }
};

// Data Service Module
const DataService = {
    loadData: async () => {
        try {
            UI.setLoadingState(true);
            const promises = config.supabase.tables.map(table => supabaseClient.from(table).select('*'));
            const responses = await Promise.all(promises);
            responses.forEach((response, index) => {
                const category = config.supabase.tables[index];
                if (response.error) {
                    console.error(`Error loading ${category}:`, response.error);
                    appState.data[category] = [];
                } else {
                    appState.data[category] = response.data || [];
                }
            });
            UI.renderSection(appState.currentTab);
        } catch (error) {
            console.error('Error loading data:', error);
            UI.showError('حدث خطأ في تحميل البيانات.');
        } finally {
            UI.setLoadingState(false);
        }
    }
};

// Event Handlers
const AppEvents = {
    setupEventListeners: () => {
        UI.elements.tabs.forEach(tab => tab.addEventListener('click', AppEvents.handleTabClick));
        UI.elements.searchBtn.addEventListener('click', AppEvents.performSearch);
        UI.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') AppEvents.performSearch();
        });
        document.addEventListener('click', (e) => {
            if (!UI.elements.searchResults.contains(e.target) && e.target !== UI.elements.searchInput && e.target !== UI.elements.searchBtn) {
                UI.elements.searchResults.classList.remove(config.css.active);
            }
        });
    },

    handleTabClick: (e) => {
        e.preventDefault();
        UI.updateActiveTab(e.currentTarget);
        UI.showSection(appState.currentTab);
    },

    performSearch: () => {
        const searchTerm = UI.elements.searchInput.value.trim().toLowerCase();
        if (searchTerm.length < 2) {
            UI.elements.searchResults.classList.remove(config.css.active);
            return;
        }

        const results = [];
        config.supabase.tables.forEach(category => {
            (appState.data[category] || []).forEach(item => {
                if (item.title?.toLowerCase().includes(searchTerm) || item.description?.toLowerCase().includes(searchTerm)) {
                    results.push({ category, item });
                }
            });
        });

        AppEvents.displaySearchResults(results);
    },

    displaySearchResults: (results) => {
        if (results.length > 0) {
            UI.elements.searchResults.innerHTML = results.map(result => `
                <div class="${config.css.searchItem}" data-category="${result.category}" data-id="${result.item.id}">
                    <strong>${result.item.title}</strong>
                    <span>(${config.categoryNames[result.category]})</span>
                </div>
            `).join('');
            UI.elements.searchResults.classList.add(config.css.active);
            UI.elements.searchResults.querySelectorAll(`.${config.css.searchItem}`).forEach(item => {
                item.addEventListener('click', AppEvents.handleSearchResultClick);
            });
        } else {
            UI.elements.searchResults.innerHTML = `<p class="${config.css.noItems}">لا توجد نتائج للبحث</p>`;
            UI.elements.searchResults.classList.add(config.css.active);
        }
    },

    handleSearchResultClick: (e) => {
        const item = e.currentTarget;
        const category = item.getAttribute('data-category');
        const id = item.getAttribute('data-id');

        UI.elements.tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === category) tab.click();
        });

        UI.elements.searchResults.classList.remove(config.css.active);
        UI.elements.searchInput.value = '';

        setTimeout(() => {
            const element = document.querySelector(`[data-item-id="${id}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                AppEvents.highlightElement(element);
            }
        }, 300);
    },

    highlightElement: (element) => {
        element.classList.add(config.css.highlight);
        setTimeout(() => element.classList.remove(config.css.highlight), 2000);
    }
};

// Main Application Flow
function initApp() {
    UI.init();
    AppEvents.setupEventListeners();
    DataService.loadData();
}

// Global utility functions
function openItemDetails(category, itemId) {
    window.location.href = `item-details.html?type=${category}&id=${itemId}`;
}

function scrollCategories(direction) {
    const container = document.querySelector('.categories-wrapper');
    container.scrollBy({ left: direction, behavior: 'smooth' });
}

// Initialize the app on page load
document.addEventListener('DOMContentLoaded', initApp);
// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initApp);
