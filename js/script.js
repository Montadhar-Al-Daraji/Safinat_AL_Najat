// تهيئة Supabase
const SUPABASE_URL = 'https://xzltdsmmolyvcmkfzedf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHRkc21tb2x5dmNta2Z6ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg1NzEsImV4cCI6MjA3MzI1NDU3MX0.3TJ49ctEhOT1KDIFtZXFw2jwTq57ujaWbqNNJ2Eeb1U';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

const domElements = {
    tabs: null,
    searchInput: null,
    searchBtn: null,
    searchResults: null,
    sections: null,
    containers: null
};

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

function setupEventListeners() {
    domElements.tabs.forEach(tab => {
        tab.addEventListener('click', handleTabClick);
    });

    domElements.searchBtn.addEventListener('click', performSearch);
    domElements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

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

        handleDataResponse('books', booksResponse);
        handleDataResponse('novels', novelsResponse);
        handleDataResponse('files', filesResponse);
        handleDataResponse('platforms', platformsResponse);
        handleDataResponse('apps', appsResponse);
        handleDataResponse('servers', serversResponse);

        // توحيد منطق العرض
        renderAllSections();
        setLoadingState(false);

    } catch (error) {
        console.error('Error loading data:', error);
        showError('حدث خطأ في تحميل البيانات');
        setLoadingState(false);
    }
}

function handleDataResponse(category, response) {
    if (response.error) {
        console.error(`Error loading ${category}:`, response.error);
        appState.data[category] = [];
    } else {
        appState.data[category] = response.data || [];
    }
}

function setLoadingState(isLoading) {
    appState.isLoading = isLoading;
    const mainElement = document.querySelector('main');
    
    if (isLoading) {
        mainElement.classList.add(cssClasses.loading);
    } else {
        mainElement.classList.remove(cssClasses.loading);
    }
}

function handleTabClick(e) {
    e.preventDefault();
    
    const tab = e.currentTarget;
    const tabName = tab.getAttribute('data-tab');
    
    updateActiveTab(tab);
    
    showSection(tabName);
}

function updateActiveTab(activeTab) {
    domElements.tabs.forEach(tab => {
        tab.classList.remove(cssClasses.active);
    });
    activeTab.classList.add(cssClasses.active);
    appState.currentTab = activeTab.getAttribute('data-tab');
}

function showSection(sectionName) {
    domElements.sections.forEach(section => {
        section.classList.remove(cssClasses.active);
    });
    
    const targetSection = document.getElementById(`${sectionName}-content`);
    if (targetSection) {
        targetSection.classList.add(cssClasses.active);
        
        if (!appState.renderedSections.has(sectionName)) {
            renderSection(sectionName);
            appState.renderedSections.add(sectionName);
        }
    }
}

function renderAllSections() {
    renderHighlights(); // استدعاء الدالة الجديدة
    Object.keys(appState.data).forEach(section => {
        if (appState.currentTab === section) {
            renderSection(section);
            appState.renderedSections.add(section);
        }
    });
}

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
    
    updateItemsCount(sectionId, items.length);
}

// دالة جديدة ومحسّنة لعرض المحتوى البارز
function renderHighlights() {
    const container = domElements.containers.highlights;
    if (!container) return;

    container.innerHTML = '';

    const allItems = [];
    Object.keys(appState.data).forEach(category => {
        allItems.push(...appState.data[category]);
    });

    if (allItems.length === 0) {
        container.innerHTML = `<p class="${cssClasses.noItems}">لا توجد عناصر لعرضها</p>`;
        return;
    }
    
    const HIGHLIGHTS_COUNT = 6;
    const shuffledItems = allItems.sort(() => 0.5 - Math.random());
    const highlights = shuffledItems.slice(0, HIGHLIGHTS_COUNT);
    
    highlights.forEach(highlight => {
        // نحتاج إلى معرفة الفئة لكل عنصر
        // يمكنك إما إضافة خاصية 'category' لكل عنصر عند جلب البيانات، أو البحث عنها
        // أسرع طريقة هي إضافة الخاصية
        // لكننا سنفترض هنا أن الدالة createHighlightElement ستقوم بالتعامل معها
        const itemElement = createHighlightElement(highlight.category, highlight.item); // هنا يجب تحديد الفئة
        container.appendChild(itemElement);
    });
}

// دمج الدالتين
function createItemElement(category, item) {
    // الكود الخاص بإنشاء عنصر عادي
    // ... (لا حاجة للتغيير هنا)
}

function createHighlightElement(category, item) {
    // الكود الخاص بإنشاء عنصر مميز
    // ... (لا حاجة للتغيير هنا)
}

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
    
    let mainImage = '';
    if (imagesArray.length > 0) {
        mainImage = `<img src="${imagesArray[0]}" alt="${item.title}" class="${cssClasses.itemImage}">`;
    } else {
        mainImage = `<div class="placeholder-image"><i class="fas fa-book-open"></i></div>`;
    }
    
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

function updateItemsCount(category, count) {
    const countElement = document.getElementById(`${category}-count`);
    if (countElement) {
        countElement.textContent = `(${count})`;
    }
}

function performSearch() {
    const searchTerm = domElements.searchInput.value.trim().toLowerCase();
    appState.searchTerm = searchTerm;
    
    if (searchTerm.length < 2) {
        domElements.searchResults.classList.remove(cssClasses.active);
        return;
    }
    
    const results = [];
    Object.keys(appState.data).forEach(category => {
        appState.data[category].forEach(item => {
            if (item.title && item.title.toLowerCase().includes(searchTerm) ||
                (item.description && item.description.toLowerCase().includes(searchTerm))) {
                results.push({ category, item });
            }
        });
    });
    
    displaySearchResults(results);
}

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
        
        domElements.searchResults.querySelectorAll(`.${cssClasses.searchItem}`).forEach(item => {
            item.addEventListener('click', handleSearchResultClick);
        });
    } else {
        domElements.searchResults.innerHTML = `<p class="${cssClasses.noItems}">لا توجد نتائج للبحث</p>`;
        domElements.searchResults.classList.add(cssClasses.active);
    }
}

function handleSearchResultClick(e) {
    const item = e.currentTarget;
    const category = item.getAttribute('data-category');
    const id = item.getAttribute('data-id');
    
    domElements.tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === category) {
            tab.click();
        }
    });
    
    domElements.searchResults.classList.remove(cssClasses.active);
    domElements.searchInput.value = '';
    
    setTimeout(() => {
        const element = document.querySelector(`[data-item-id="${id}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            highlightElement(element);
        }
    }, 300);
}

function highlightElement(element) {
    element.classList.add('highlight');
    setTimeout(() => {
        element.classList.remove('highlight');
    }, 2000);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <p>${message}</p>
    `;
    
    document.querySelector('main').prepend(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function scrollCategories(direction) {
    const container = document.querySelector('.categories-wrapper');
    container.scrollBy({ left: direction, behavior: 'smooth' });
}

// دمج الدالتين
function openItemDetails(category, itemId) {
    window.location.href = `item-details.html?type=${category}&id=${itemId}`;
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initApp);
