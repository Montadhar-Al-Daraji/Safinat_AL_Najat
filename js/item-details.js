// تهيئة Supabase
const SUPABASE_URL = 'https://xzltdsmmolyvcmkfzedf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHRkc21tb2x5dmNta2Z6ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg1NzEsImV4cCI6MjA3MzI1NDU3MX0.3TJ49ctEhOT1KDIFtZXFw2jwTq57ujaWbqNNJ2Eeb1U';

// إنشاء عميل Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// حالة التطبيق
let currentItem = null;
let currentImages = [];
let currentImageIndex = 0;
// متغيرات الـ modal
let modal = null;
let modalImg = null;
let modalCaption = null;
let modalClose = null;

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    console.log('صفحة التفاصيل محملة');
    loadItemDetails();
    setupEventListeners();
    initModal();
});


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
document.addEventListener('DOMContentLoaded', function() {
    console.log('صفحة التفاصيل محملة');
    loadItemDetails();
    setupEventListeners();
});

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // زر الرجوع
    document.getElementById('back-button').addEventListener('click', goBack);
    
    // أزرار التنقل بين الصور
    const prevButton = document.getElementById('prev-image');
    const nextButton = document.getElementById('next-image');
    
    if (prevButton) prevButton.addEventListener('click', showPrevImage);
    if (nextButton) nextButton.addEventListener('click', showNextImage);
    
    // زر المشاركة
    const shareButton = document.getElementById('share-button');
    if (shareButton) shareButton.addEventListener('click', shareItem);
}

// تحميل تفاصيل العنصر
async function loadItemDetails() {
    try {
        showLoading();
        hideError();
        
        // الحصول على المعاملات من URL
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        const id = urlParams.get('id');
        
        console.log('معاملات URL:', { type, id });
        
        if (!type || !id) {
            throw new Error('لم يتم تحديد نوع العنصر أو المعرّف');
        }
        
        // جلب البيانات من Supabase
        const { data, error } = await supabaseClient
            .from(type)
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) {
            throw error;
        }
        
        if (!data) {
            throw new Error('العنصر غير موجود');
        }
        
        currentItem = data;
        displayItemDetails(type, data);
        hideLoading();
        
    } catch (error) {
        console.error('Error loading item details:', error);
        showError('حدث خطأ في تحميل البيانات: ' + error.message);
        hideLoading();
    }
}

// عرض تفاصيل العنصر
function displayItemDetails(type, item) {
    // تعيين العنوان
    document.title = `${item.title} - سفينة النجاة`;
    document.getElementById('item-title').textContent = item.title;
    
    // تعيين الوصف
    document.getElementById('item-description').textContent = item.description || 'لا يوجد وصف متاح';
    
    // تعيين شارة النوع
    const categoryBadge = document.getElementById('item-category-badge');
    if (categoryBadge) {
        categoryBadge.innerHTML = `
            <i class="${categoryIcons[type]}"></i>
            ${categoryNames[type]}
        `;
    }
    
    // تعيين التاريخ إذا كان متوفراً
    const dateElement = document.getElementById('item-date');
    if (dateElement) {
        if (item.created_at) {
            const date = new Date(item.created_at);
            dateElement.textContent = date.toLocaleDateString('ar-SA');
        } else {
            dateElement.textContent = 'غير معروف';
        }
    }
    
    // معالجة الصور
    processImages(type, item);
    
    // تعيين رابط التحميل/الزيارة
    const actionButton = document.getElementById('action-button');
    if (actionButton) {
        if (type === 'platforms' || type === 'servers') {
            actionButton.innerHTML = '<i class="fas fa-external-link-alt"></i> زيارة';
            actionButton.href = item.link || item.drive_link || '#';
        } else {
            actionButton.innerHTML = '<i class="fas fa-download"></i> تحميل';
            actionButton.href = item.drive_link || item.download_link || item.link || '#';
        }
    }
    
    // إظهار زر عرض الأصل إذا كان هناك رابط مختلف
    const viewOriginalButton = document.getElementById('view-original-button');
    if (viewOriginalButton && item.link && (item.drive_link || item.download_link)) {
        viewOriginalButton.style.display = 'block';
        viewOriginalButton.onclick = function() {
            window.open(item.link, '_blank');
        };
    }
    
    // معالجة المعلومات الإضافية
    processAdditionalInfo(type, item);
    
    // إظهار تفاصيل العنصر
    const itemDetails = document.getElementById('item-details');
    if (itemDetails) {
        itemDetails.style.display = 'flex';
    }
}
// فتح الـ modal لعرض صورة محددة
function openModal(imageSrc, caption) {
    if (!modal || !modalImg || !modalCaption) return;
    
    modalImg.src = imageSrc;
    modalCaption.innerHTML = caption || 'صورة العنصر';
    modal.style.display = 'block';
    
    // منع التمرير عند فتح الـ modal
    document.body.style.overflow = 'hidden';
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
    modalClose.onclick = function() {
        closeModal();
    };
    
    // إغلاق الـ modal عند النقر خارج الصورة
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
    
    // إغلاق الـ modal بالزر Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
}
// إغلاق الـ modal
function closeModal() {
    if (!modal) return;
    
    modal.style.display = 'none';
    
    // إعادة تمكين التمرير
    document.body.style.overflow = 'auto';
}

// تعديل دالة processImages لإضافة معاينة الصور
function processImages(type, item) {
    currentImages = [];
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    if (thumbnailsContainer) {
        thumbnailsContainer.innerHTML = '';
    }
    
    // جمع جميع الصور المتاحة
    if (item.image) {
        currentImages.push(item.image);
    }
    
    if (item.images) {
        let imagesArray = [];
        if (typeof item.images === 'string') {
            try {
                imagesArray = JSON.parse(item.images);
            } catch (e) {
                imagesArray = [item.images];
            }
        } else if (Array.isArray(item.images)) {
            imagesArray = item.images;
        }
        
        imagesArray.forEach(img => {
            if (!currentImages.includes(img)) {
                currentImages.push(img);
            }
        });
    }
    
    // إذا لم توجد صور، نستخدم صورة افتراضية
    const imagePlaceholder = document.getElementById('image-placeholder');
    const mainImage = document.getElementById('main-image');
    const imageNav = document.getElementById('image-nav');
    
    if (currentImages.length === 0) {
        if (imagePlaceholder) imagePlaceholder.style.display = 'flex';
        if (mainImage) mainImage.style.display = 'none';
        if (imageNav) imageNav.style.display = 'none';
        return;
    }
    
    // إظهار الصور
    if (imagePlaceholder) imagePlaceholder.style.display = 'none';
    if (mainImage) mainImage.style.display = 'block';
    
    // عرض الصورة الأولى
    showImage(0);
    
    // إضافة event listener للصورة الرئيسية
    if (mainImage) {
        mainImage.addEventListener('click', function() {
            openModal(this.src, item.title);
        });
    }
    
    // إنشاء الصور المصغرة
    if (thumbnailsContainer) {
        currentImages.forEach((img, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail';
            if (index === 0) thumbnail.classList.add('active');
            
            const thumbnailImg = document.createElement('img');
            thumbnailImg.src = img;
            thumbnailImg.alt = `صورة مصغرة ${index + 1}`;
            
            // إضافة event listener للصورة المصغرة
            thumbnailImg.addEventListener('click', function(e) {
                e.stopPropagation(); // منع تنفيذ event الـ parent
                showImage(index);
            });
            
            // إضافة event listener للنقر المزدوج للصورة المصغرة
            thumbnailImg.addEventListener('dblclick', function() {
                openModal(img, item.title);
            });
            
            thumbnail.appendChild(thumbnailImg);
            thumbnailsContainer.appendChild(thumbnail);
        });
    }
    
    // إظهار أزرار التنقل إذا كان هناك أكثر من صورة
    if (imageNav) {
        if (currentImages.length > 1) {
            imageNav.style.display = 'flex';
            updateImageCounter();
        } else {
            imageNav.style.display = 'none';
        }
    }
}
// عرض صورة محددة
function showImage(index) {
    if (index < 0 || index >= currentImages.length) return;
    
    currentImageIndex = index;
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.src = currentImages[index];
    }
    
    // تحديث الصورة المصغرة النشطة
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        if (i === index) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
    
    updateImageCounter();
}

// عرض الصورة التالية
function showNextImage() {
    let nextIndex = currentImageIndex + 1;
    if (nextIndex >= currentImages.length) nextIndex = 0;
    showImage(nextIndex);
}

// عرض الصورة السابقة
function showPrevImage() {
    let prevIndex = currentImageIndex - 1;
    if (prevIndex < 0) prevIndex = currentImages.length - 1;
    showImage(prevIndex);
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
    switch(type) {
        case 'books':
            if (item.author) {
                additionalInfoContent.innerHTML += `<p><strong>المؤلف:</strong> ${item.author}</p>`;
                hasAdditionalInfo = true;
            }
            if (item.pages) {
                additionalInfoContent.innerHTML += `<p><strong>عدد الصفحات:</strong> ${item.pages}</p>`;
                hasAdditionalInfo = true;
            }
            if (item.publisher) {
                additionalInfoContent.innerHTML += `<p><strong>الناشر:</strong> ${item.publisher}</p>`;
                hasAdditionalInfo = true;
            }
            break;
            
        case 'novels':
            if (item.author) {
                additionalInfoContent.innerHTML += `<p><strong>المؤلف:</strong> ${item.author}</p>`;
                hasAdditionalInfo = true;
            }
            if (item.chapters) {
                additionalInfoContent.innerHTML += `<p><strong>عدد الفصول:</strong> ${item.chapters}</p>`;
                hasAdditionalInfo = true;
            }
            break;
            
        case 'files':
            if (item.format) {
                const formatContainer = document.getElementById('item-format-container');
                const formatElement = document.getElementById('item-format');
                if (formatContainer && formatElement) {
                    formatContainer.style.display = 'flex';
                    formatElement.textContent = item.format;
                }
            }
            if (item.size) {
                const sizeContainer = document.getElementById('item-size-container');
                const sizeElement = document.getElementById('item-size');
                if (sizeContainer && sizeElement) {
                    sizeContainer.style.display = 'flex';
                    sizeElement.textContent = item.size;
                }
            }
            break;
            
        case 'apps':
            if (item.version) {
                additionalInfoContent.innerHTML += `<p><strong>الإصدار:</strong> ${item.version}</p>`;
                hasAdditionalInfo = true;
            }
            if (item.developer) {
                additionalInfoContent.innerHTML += `<p><strong>المطور:</strong> ${item.developer}</p>`;
                hasAdditionalInfo = true;
            }
            break;
    }
    
    // إظهار قسم المعلومات الإضافية إذا كان هناك معلومات
    if (hasAdditionalInfo) {
        additionalInfo.style.display = 'block';
    } else {
        additionalInfo.style.display = 'none';
    }
}

// مشاركة العنصر
function shareItem() {
    const title = currentItem.title;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        }).catch(error => {
            console.error('Error sharing:', error);
            copyToClipboard(url);
        });
    } else {
        copyToClipboard(url);
    }
}

// نسخ النص إلى الحافظة
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('تم نسخ الرابط إلى الحافظة: ' + text);
    }).catch(error => {
        console.error('Error copying to clipboard:', error);
        alert('لم يتمكن المتصفح من نسخ الرابط. يرجى نسخه يدوياً: ' + text);
    });
}

// الرجوع إلى الصفحة السابقة
function goBack() {
    window.history.back();
}

// إظهار مؤشر التحميل
function showLoading() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'flex';
    }
}

// إخفاء مؤشر التحميل
function hideLoading() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
}

// إظهار رسالة الخطأ
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    if (errorMessage && errorText) {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
    }
}

// إخفاء رسالة الخطأ
function hideError() {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

// وظيفة تمرير الأقسام
function scrollCategories(direction) {
    const container = document.querySelector('.categories-wrapper');
    if (container) {
        container.scrollBy({ left: direction, behavior: 'smooth' });
    }
}
// إظهار تفاصيل العنصر
function displayItemDetails(type, item) {
    // ... الكود الحالي
    
    // إضافة event listener للصورة الرئيسية للفتح في نافذة معاينة
    const mainImage = document.getElementById('main-image');
    if (mainImage && currentImages.length > 0) {
        mainImage.addEventListener('click', function() {
            openModal(this.src, item.title);
        });
    }
    
    // إظهار تفاصيل العنصر
    const itemDetails = document.getElementById('item-details');
    if (itemDetails) {
        itemDetails.style.display = 'flex';
    }
}
