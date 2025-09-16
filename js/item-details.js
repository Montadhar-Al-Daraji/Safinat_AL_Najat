// js/item-details.js - الإصدار المحسن

// دالة لتحميل التكوين بطريقة أكثر أماناً
async function loadConfig() {
    // إذا كان التكوين محملاً بالفعل
    if (window.CONFIG && window.CONFIG.SUPABASE_URL && window.CONFIG.SUPABASE_ANON_KEY) {
        return window.CONFIG;
    }
    
    // محاولة تحميل التكوين من ملف خارجي
    try {
        const response = await fetch('config.js');
        if (!response.ok) throw new Error('Failed to load config');
        
        // إعادة تحميل الصفحة لتفعيل التكوين (سيتم تنفيذ config.js مرة أخرى)
        window.location.reload();
        return null;
    } catch (error) {
        console.error('Error loading config:', error);
        throw new Error('تعذر تحميل إعدادات التطبيق');
    }
}

// تهيئة التطبيق الرئيسية
async function initializeApp() {
    try {
        // تحميل التكوين أولاً
        const config = await loadConfig();
        
        if (!config) return; // تم إعادة تحميل الصفحة
        
        // إنشاء عميل Supabase
        window.supabaseClient = window.supabase.createClient(
            config.SUPABASE_URL, 
            config.SUPABASE_ANON_KEY, 
            {
                auth: { persistSession: true },
                db: { schema: 'public' }
            }
        );
        
        // تهيئة المكونات
        initModal();
        setupEventListeners();
        setCurrentYear();
        
        // تحميل تفاصيل العنصر
        await loadItemDetails();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showError(error.message || 'حدث خطأ في تهيئة التطبيق');
    }
}

// حالة التطبيق
let currentItem = null;
let currentImages = [];
let currentImageIndex = 0;

// متغيرات الـ modal
let modal = null;
let modalImg = null;
let modalCaption = null;
let modalClose = null;

// أسماء الأقسام بالعربية
const categoryNames = {
    books: 'كتاب',
    novels: 'رواية',
    files: 'ملف',
    platforms: 'منصة',
    apps: 'تطبيق',
    servers: 'سيرفر'
};

// رموز الأقسام
const categoryIcons = {
    books: 'fas fa-book',
    novels: 'fas fa-book-open',
    files: 'fas fa-file',
    platforms: 'fas fa-globe',
    apps: 'fas fa-mobile-alt',
    servers: 'fas fa-server'
};

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initializeApp);

// تعيين السنة الحالية في التذييل
function setCurrentYear() {
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // زر الرجوع
    const backButton = document.getElementById('back-button');
    if (backButton) backButton.addEventListener('click', goBack);
    
    // أزرار التنقل بين الصور
    const prevButton = document.getElementById('prev-image');
    const nextButton = document.getElementById('next-image');
    
    if (prevButton) prevButton.addEventListener('click', showPrevImage);
    if (nextButton) nextButton.addEventListener('click', showNextImage);
    
    // زر المشاركة
    const shareButton = document.getElementById('share-button');
    if (shareButton) shareButton.addEventListener('click', shareItem);
    
    // زر إعادة المحاولة
    const retryButton = document.getElementById('retry-button');
    if (retryButton) retryButton.addEventListener('click', () => {
        hideError();
        loadItemDetails();
    });
    
    // إغلاق الـ modal بالزر Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
}

// تهيئة نافذة معاينة الصورة
function initModal() {
    modal = document.getElementById('image-modal');
    modalImg = document.getElementById('modal-image');
    modalCaption = document.getElementById('modal-caption');
    modalClose = document.getElementsByClassName('modal-close')[0];
    
    if (!modal || !modalImg || !modalCaption || !modalClose) {
        console.error('عناصر الـ modal غير موجودة');
        return;
    }
    
    // إغلاق الـ modal عند النقر على الزر
    modalClose.onclick = closeModal;
    
    // إغلاق الـ modal عند النقر خارج الصورة
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
}

// فتح الـ modal لعرض صورة محددة
function openModal(imageSrc, caption) {
    if (!modal || !modalImg || !modalCaption) return;
    
    modalImg.src = validateURL(imageSrc) || '';
    modalCaption.textContent = caption || 'صورة العنصر';
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// إغلاق الـ modal
function closeModal() {
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// تحميل تفاصيل العنصر
async function loadItemDetails() {
    try {
        showLoading();
        hideItemDetails();
        
        // الحصول على المعاملات من URL
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const id = urlParams.get('id');
        
        if (!type || !id) {
            throw new Error('لم يتم تحديد نوع العنصر أو المعرّف');
        }
        
        // التحقق من صحة النوع والمعرف
        if (!isValidCategory(type) || !isValidId(id)) {
            throw new Error('نوع العنصر أو المعرّف غير صالح');
        }
        
        // جلب البيانات من Supabase
        const { data, error } = await window.supabaseClient
            .from(type)
            .select('*')
            .eq('id', id)
            .eq('is_active', true)
            .single();
        
        if (error) {
            throw new Error(`خطأ في الخادم: ${error.message}`);
        }
        
        if (!data) {
            throw new Error('العنصر غير موجود أو غير نشط');
        }
        
        currentItem = data;
        displayItemDetails(type, data);
        hideLoading();
        
        // تحديث عدد المشاهدات
        updateViewCount(type, id);
        
    } catch (error) {
        console.error('Error loading item details:', error);
        showError('حدث خطأ في تحميل البيانات: ' + error.message);
        hideLoading();
    }
}

// تحديث عدد المشاهدات
async function updateViewCount(category, id) {
    try {
        await window.supabaseClient
            .from(category)
            .update({ views_count: (currentItem.views_count || 0) + 1 })
            .eq('id', id);
    } catch (error) {
        console.error('Error updating view count:', error);
    }
}

// التحقق من صحة نوع العنصر
function isValidCategory(category) {
    return ['books', 'novels', 'files', 'platforms', 'apps', 'servers'].includes(category);
}

// التحقق من صحة المعرف
function isValidId(id) {
    return /^[a-zA-Z0-9\-_]+$/.test(id);
}

// التحقق من صحة URL
function validateURL(url) {
    if (!url) return '';
    try {
        const parsedUrl = new URL(url);
        if (['http:', 'https:'].includes(parsedUrl.protocol)) {
            return url;
        }
        return '';
    } catch {
        return '';
    }
}

// تنظيف النص من الأحرف الخطرة
function sanitizeText(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// عرض تفاصيل العنصر
function displayItemDetails(type, item) {
    // تعيين العنوان
    document.title = `${sanitizeText(item.title)} - سفينة النجاة`;
    document.getElementById('item-title').textContent = item.title;
    
    // تعيين الوصف
    document.getElementById('item-description').textContent = item.description || 'لا يوجد وصف متاح';
    
    // تعيين شارة النوع
    const categoryBadge = document.getElementById('item-category-badge');
    if (categoryBadge) {
        categoryBadge.innerHTML = `<i class="${categoryIcons[type]}"></i> ${categoryNames[type]}`;
    }
    
    // تعيين التاريخ
    const dateElement = document.getElementById('item-date');
    if (dateElement) {
        dateElement.textContent = item.created_at ? 
            new Date(item.created_at).toLocaleDateString('ar-SA') : 'غير معروف';
    }
    
    // تعيين عدد المشاهدات والتحميلات
    document.getElementById('item-views').textContent = item.views_count || 0;
    document.getElementById('item-downloads').textContent = item.downloads_count || 0;
    
    // معالجة الصور
    processImages(type, item);
    
    // تعيين رابط التحميل/الزيارة
    setupActionButton(type, item);
    
    // معالجة المعلومات الإضافية
    processAdditionalInfo(type, item);
    
    // إظهار تفاصيل العنصر
    showItemDetails();
}

// إعداد زر التنفيذ الرئيسي
function setupActionButton(type, item) {
    const actionButton = document.getElementById('action-button');
    if (!actionButton) return;
    
    let buttonText = '';
    let buttonUrl = '';
    
    switch(type) {
        case 'platforms':
            buttonText = 'زيارة المنصة';
            buttonUrl = item.link_url;
            break;
        case 'servers':
            buttonText = 'انضم إلى السيرفر';
            buttonUrl = item.invite_link;
            break;
        case 'apps':
            buttonText = 'تحميل التطبيق';
            buttonUrl = item.download_link;
            break;
        default:
            buttonText = 'تحميل';
            buttonUrl = item.drive_link;
            break;
    }
    
    actionButton.innerHTML = `<i class="fas fa-download"></i> ${buttonText}`;
    actionButton.href = validateURL(buttonUrl) || '#';
    
    // إضافة حدث لتتبع عدد التحميلات
    actionButton.addEventListener('click', () => {
        updateDownloadCount(type, item.id);
    });
}

// معالجة الصور
function processImages(type, item) {
    currentImages = [];
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    if (thumbnailsContainer) thumbnailsContainer.innerHTML = '';
    
    // جمع جميع الصور المتاحة
    if (item.image_url) {
        currentImages.push(item.image_url);
    }
    
    // معالجة صور الروايات (images_urls)
    if (item.images_urls) {
        let imagesArray = [];
        if (typeof item.images_urls === 'string') {
            try {
                imagesArray = JSON.parse(item.images_urls);
            } catch (e) {
                imagesArray = [item.images_urls];
            }
        } else if (Array.isArray(item.images_urls)) {
            imagesArray = item.images_urls;
        }
        
        imagesArray.forEach(img => {
            if (img && !currentImages.includes(img)) {
                currentImages.push(img);
            }
        });
    }
    
    // عرض الصور
    const imagePlaceholder = document.getElementById('image-placeholder');
    const mainImage = document.getElementById('main-image');
    const imageNav = document.getElementById('image-nav');
    
    if (currentImages.length === 0) {
        showElement(imagePlaceholder);
        hideElement(mainImage);
        hideElement(imageNav);
        return;
    }
    
    hideElement(imagePlaceholder);
    showElement(mainImage);
    
    // عرض الصورة الأولى
    showImage(0);
    
    // إضافة event listener للصورة الرئيسية
    if (mainImage) {
        mainImage.addEventListener('click', () => {
            openModal(currentImages[currentImageIndex], item.title);
        });
    }
    
    // إنشاء الصور المصغرة
    if (thumbnailsContainer && currentImages.length > 1) {
        currentImages.forEach((img, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            if (index === 0) thumbnail.classList.add('active');
            
            const thumbnailImg = document.createElement('img');
            thumbnailImg.src = validateURL(img) || '';
            thumbnailImg.alt = `صورة مصغرة ${index + 1}`;
            thumbnailImg.loading = 'lazy';
            
            thumbnailImg.addEventListener('click', (e) => {
                e.stopPropagation();
                showImage(index);
            });
            
            thumbnailImg.addEventListener('dblclick', () => {
                openModal(img, item.title);
            });
            
            thumbnail.appendChild(thumbnailImg);
            thumbnailsContainer.appendChild(thumbnail);
        });
    }
    
    // إظهار أزرار التنقل إذا كان هناك أكثر من صورة
    if (currentImages.length > 1) {
        showElement(imageNav);
        updateImageCounter();
    } else {
        hideElement(imageNav);
    }
}

// عرض صورة محددة
function showImage(index) {
    if (index < 0 || index >= currentImages.length) return;
    
    currentImageIndex = index;
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.src = validateURL(currentImages[index]) || '';
    }
    
    // تحديث الصورة المصغرة النشطة
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        i === index ? 
            thumb.classList.add('active') : 
            thumb.classList.remove('active');
    });
    
    updateImageCounter();
}

// عرض الصورة التالية
function showNextImage() {
    showImage((currentImageIndex + 1) % currentImages.length);
}

// عرض الصورة السابقة
function showPrevImage() {
    showImage((currentImageIndex - 1 + currentImages.length) % currentImages.length);
}

// تحديث عداد الصور
function updateImageCounter() {
    const imageCounter = document.getElementById('image-counter');
    if (imageCounter) {
        imageCounter.textContent = `${currentImageIndex + 1}/${currentImages.length}`;
    }
}

// معالجة المعلومات الإضافية
function processAdditionalInfo(type, item) {
    const additionalInfo = document.getElementById('additional-info');
    const additionalInfoContent = document.getElementById('additional-info-content');
    
    if (!additionalInfo || !additionalInfoContent) return;
    
    additionalInfoContent.innerHTML = '';
    let hasAdditionalInfo = false;
    
    // إضافة معلومات إضافية حسب نوع العنصر
    const infoMap = {
        books: [
            { key: 'author', label: 'المؤلف' },
            { key: 'publisher', label: 'الناشر' },
            { key: 'publication_year', label: 'سنة النشر' },
            { key: 'pages', label: 'عدد الصفحات' },
            { key: 'language', label: 'اللغة' }
        ],
        novels: [
            { key: 'author', label: 'المؤلف' },
            { key: 'publisher', label: 'الناشر' },
            { key: 'publication_year', label: 'سنة النشر' },
            { key: 'pages', label: 'عدد الصفحات' },
            { key: 'language', label: 'اللغة' }
        ],
        files: [
            { key: 'file_format', label: 'صيغة الملف' },
            { key: 'file_size', label: 'حجم الملف' },
            { key: 'file_type', label: 'نوع الملف' }
        ],
        apps: [
            { key: 'version', label: 'الإصدار' },
            { key: 'developer', label: 'المطور' },
            { key: 'platform', label: 'المنصة' },
            { key: 'file_size', label: 'الحجم' }
        ],
        platforms: [
            { key: 'platform_type', label: 'نوع المنصة' }
        ],
        servers: [
            { key: 'server_type', label: 'نوع السيرفر' },
            { key: 'members_count', label: 'عدد الأعضاء' }
        ]
    };
    
    // إضافة المعلومات الخاصة بالنوع
    if (infoMap[type]) {
        infoMap[type].forEach(info => {
            if (item[info.key]) {
                additionalInfoContent.innerHTML += `<p><strong>${info.label}:</strong> ${sanitizeText(item[info.key])}</p>`;
                hasAdditionalInfo = true;
            }
        });
    }
    
    // إضافة المعلومات المشتركة
    if (item.category) {
        additionalInfoContent.innerHTML += `<p><strong>التصنيف:</strong> ${sanitizeText(item.category)}</p>`;
        hasAdditionalInfo = true;
    }
    
    if (item.tags) {
        additionalInfoContent.innerHTML += `<p><strong>الكلمات الدالة:</strong> ${sanitizeText(item.tags)}</p>`;
        hasAdditionalInfo = true;
    }
    
    // إظهار قسم المعلومات الإضافية إذا كان هناك معلومات
    hasAdditionalInfo ? showElement(additionalInfo) : hideElement(additionalInfo);
}

// تحديث عدد التحميلات
async function updateDownloadCount(category, id) {
    try {
        await window.supabaseClient
            .from(category)
            .update({ downloads_count: (currentItem.downloads_count || 0) + 1 })
            .eq('id', id);
    } catch (error) {
        console.error('Error updating download count:', error);
    }
}

// مشاركة العنصر
function shareItem() {
    if (!currentItem) return;
    
    const shareData = {
        title: currentItem.title,
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData).catch(() => copyToClipboard(shareData.url));
    } else {
        copyToClipboard(shareData.url);
    }
}

// نسخ النص إلى الحافظة
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('تم نسخ الرابط إلى الحافظة: ' + text);
    }).catch(() => {
        alert('لم يتمكن المتصفح من نسخ الرابط. يرجى نسخه يدوياً: ' + text);
    });
}

// الرجوع إلى الصفحة السابقة
function goBack() {
    window.history.length > 1 ? window.history.back() : window.location.href = 'index.html';
}

// وظائف المساعدة للعرض والإخفاء
function showElement(element) {
    if (element) element.classList.remove('initially-hidden');
}

function hideElement(element) {
    if (element) element.classList.add('initially-hidden');
}

function showLoading() {
    showElement(document.getElementById('loading-spinner'));
}

function hideLoading() {
    hideElement(document.getElementById('loading-spinner'));
}

function showItemDetails() {
    showElement(document.getElementById('item-details'));
}

function hideItemDetails() {
    hideElement(document.getElementById('item-details'));
}

function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    if (errorMessage && errorText) {
        errorText.textContent = message;
        showElement(errorMessage);
    }
}

function hideError() {
    hideElement(document.getElementById('error-message'));
}
