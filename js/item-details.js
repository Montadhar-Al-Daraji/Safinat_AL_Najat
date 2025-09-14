// تهيئة Supabase
const SUPABASE_URL = 'https://xzltdsmmolyvcmkfzedf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHRkc21tb2x5dmNta2Z6ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg1NzEsImV4cCI6MjA3MzI1NDU3MX0.3TJ49ctEhOT1KDIFtZXFw2jwTq57ujaWbqNNJ2Eeb1U';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// بيانات العنصر الحالي
let currentItem = null;
let currentImages = [];
let currentImageIndex = 0;

// تهيئة الصفحة عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    // إضافة معالج حدث لزر الرجوع
    document.getElementById('back-button').addEventListener('click', function() {
        window.history.back();
    });
    
    // جلب معاملات URL
    const urlParams = new URLSearchParams(window.location.search);
    const itemType = urlParams.get('type');
    const itemId = urlParams.get('id');
    
    if (itemType && itemId) {
        loadItemDetails(itemType, itemId);
    } else {
        showError('لم يتم تحديد عنصر للعرض');
    }
    
    // إضافة معالجي الأحداث لأزرار التنقل بين الصور
    document.getElementById('prev-image').addEventListener('click', showPreviousImage);
    document.getElementById('next-image').addEventListener('click', showNextImage);
    
    // إضافة معالج حدث لمشاركة العنصر
    document.getElementById('share-button').addEventListener('click', shareItem);
});

// تحميل تفاصيل العنصر من Supabase
async function loadItemDetails(itemType, itemId) {
    try {
        // جلب البيانات من الجدول المناسب
        const { data, error } = await supabaseClient
            .from(itemType)
            .select('*')
            .eq('id', itemId)
            .single();

        if (error) throw error;
        
        currentItem = data;
        displayItemDetails();
    } catch (error) {
        console.error('Error loading item details:', error);
        showError('حدث خطأ في تحميل تفاصيل العنصر');
    }
}

// عرض تفاصيل العنصر في الصفحة
function displayItemDetails() {
    if (!currentItem) return;
    
    // تعيين العنوان والوصف
    document.getElementById('item-title').textContent = currentItem.title || 'بدون عنوان';
    document.getElementById('item-description').textContent = currentItem.description || 'لا يوجد وصف';
    
    // تعيين نوع العنصر
    const typeNames = {
        'books': 'كتاب',
        'novels': 'رواية',
        'files': 'ملف',
        'platforms': 'منصة',
        'apps': 'تطبيق',
        'servers': 'سيرفر'
    };
    
    const urlParams = new URLSearchParams(window.location.search);
    const itemType = urlParams.get('type');
    document.getElementById('item-type').textContent = typeNames[itemType] || 'عنصر';
    
    // تعيين التاريخ إذا كان متوفراً
    const dateContainer = document.getElementById('item-date-container');
    if (currentItem.created_at) {
        const date = new Date(currentItem.created_at);
        document.getElementById('item-date').textContent = date.toLocaleDateString('ar-EG');
        dateContainer.style.display = 'flex';
    } else {
        dateContainer.style.display = 'none';
    }
    
    // معالجة الصور
    processItemImages();
    
    // تعيين زر الإجراء
    setupActionButton();
}

// معالجة صور العنصر
function processItemImages() {
    currentImages = [];
    
    // جمع كل الصور المتاحة للعنصر
    if (currentItem.image) {
        if (typeof currentItem.image === 'string') {
            currentImages.push(currentItem.image);
        } else if (Array.isArray(currentItem.image)) {
            currentImages = [...currentItem.image];
        }
    }
    
    if (currentItem.images) {
        let additionalImages = [];
        
        if (typeof currentItem.images === 'string') {
            try {
                additionalImages = JSON.parse(currentItem.images);
            } catch (e) {
                console.error('Error parsing images JSON:', e);
                additionalImages = [currentItem.images];
            }
        } else if (Array.isArray(currentItem.images)) {
            additionalImages = [...currentItem.images];
        }
        
        currentImages = [...currentImages, ...additionalImages];
    }
    
    // إذا لم يكن هناك صور، نستخدم صورة افتراضية
    if (currentImages.length === 0) {
        currentImages.push('./assets/placeholder-image.jpg');
    }
    
    // عرض الصور
    displayImages();
}

// عرض الصور في المعرض
function displayImages() {
    const mainImage = document.getElementById('main-image');
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    const imageCounter = document.getElementById('image-counter');
    
    // مسح الصور السابقة
    thumbnailsContainer.innerHTML = '';
    
    // عرض الصورة الرئيسية الأولى
    mainImage.src = currentImages[0];
    mainImage.alt = currentItem.title || 'صورة العنصر';
    
    // تحديث العداد
    updateImageCounter();
    
    // إنشاء الصور المصغرة إذا كان هناك أكثر من صورة
    if (currentImages.length > 1) {
        currentImages.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail' + (index === 0 ? ' active' : '');
            thumbnail.innerHTML = `<img src="${image}" alt="صورة ${index + 1}">`;
            thumbnail.addEventListener('click', () => selectImage(index));
            thumbnailsContainer.appendChild(thumbnail);
        });
        
        // إظهار أزرار التنقل
        document.getElementById('prev-image').style.display = 'flex';
        document.getElementById('next-image').style.display = 'flex';
    } else {
        // إخفاء أزرار التنقل إذا كان هناك صورة واحدة فقط
        document.getElementById('prev-image').style.display = 'none';
        document.getElementById('next-image').style.display = 'none';
    }
}

// تحديث عداد الصور
function updateImageCounter() {
    document.getElementById('image-counter').textContent = 
        `${currentImageIndex + 1}/${currentImages.length}`;
}

// اختيار صورة محددة
function selectImage(index) {
    if (index < 0 || index >= currentImages.length) return;
    
    currentImageIndex = index;
    document.getElementById('main-image').src = currentImages[index];
    
    // تحديث الصور المصغرة النشطة
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
    
    updateImageCounter();
}

// عرض الصورة السابقة
function showPreviousImage() {
    let newIndex = currentImageIndex - 1;
    if (newIndex < 0) newIndex = currentImages.length - 1;
    selectImage(newIndex);
}

// عرض الصورة التالية
function showNextImage() {
    let newIndex = currentImageIndex + 1;
    if (newIndex >= currentImages.length) newIndex = 0;
    selectImage(newIndex);
}

// إعداد زر الإجراء (تحميل/انتقال/رابط)
function setupActionButton() {
    const actionButton = document.getElementById('action-button');
    
    // تحديد نوع الإجراء بناءً على نوع العنصر
    const urlParams = new URLSearchParams(window.location.search);
    const itemType = urlParams.get('type');
    
    let buttonText = 'فتح';
    let buttonUrl = '#';
    let buttonIcon = 'fas fa-external-link-alt';
    
    switch(itemType) {
        case 'books':
        case 'files':
            buttonText = 'تحميل';
            buttonIcon = 'fas fa-download';
            buttonUrl = currentItem.drive_link || currentItem.link || '#';
            break;
        case 'novels':
            buttonText = 'قراءة';
            buttonIcon = 'fas fa-book-open';
            buttonUrl = currentItem.read_link || currentItem.link || '#';
            break;
        case 'platforms':
            buttonText = 'زيارة المنصة';
            buttonIcon = 'fas fa-external-link-alt';
            buttonUrl = currentItem.link || '#';
            break;
        case 'apps':
            buttonText = 'تحميل التطبيق';
            buttonIcon = 'fas fa-download';
            buttonUrl = currentItem.download_link || currentItem.link || '#';
            break;
        case 'servers':
            buttonText = 'انضم إلى السيرفر';
            buttonIcon = 'fas fa-users';
            buttonUrl = currentItem.link || '#';
            break;
    }
    
    // تحديث الزر
    actionButton.innerHTML = `<i class="${buttonIcon}"></i> ${buttonText}`;
    actionButton.href = buttonUrl;
    
    // إخفاء الزر إذا لم يكن هناك رابط
    if (buttonUrl === '#') {
        actionButton.style.display = 'none';
    }
}

// مشاركة العنصر
function shareItem() {
    if (navigator.share) {
        navigator.share({
            title: currentItem.title,
            text: currentItem.description,
            url: window.location.href
        })
        .catch(error => {
            console.log('Error sharing:', error);
            copyToClipboard(window.location.href);
        });
    } else {
        copyToClipboard(window.location.href);
    }
}

// نسخ النص إلى الحافظة
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('تم نسخ رابط العنصر إلى الحافظة');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert('تعذر نسخ الرابط، يرجى المحاولة مرة أخرى');
    });
}

// عرض رسالة خطأ
function showError(message) {
    const container = document.querySelector('.item-details-container');
    container.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h2>${message}</h2>
            <button onclick="window.history.back()" class="back-button">
                <i class="fas fa-arrow-right"></i> العودة
            </button>
        </div>
    `;
}
