// بيانات الموقع
let siteData = {
    books: [],
    novels: [],
    files: [],
    platforms: [],
    apps: []
};

// تحميل البيانات من localStorage
function loadAdminData() {
    const savedData = localStorage.getItem('religiousSiteData');
    if (savedData) {
        siteData = JSON.parse(savedData);
    }
    renderAllAdminLists();
}

// حفظ البيانات إلى localStorage
function saveAdminData() {
    localStorage.setItem('religiousSiteData', JSON.stringify(siteData));
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
    
    items.forEach((item, index) => {
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
                <button onclick="deleteItem('${section}', ${index})">حذف</button>
            </div>
        `;
        
        listElement.appendChild(itemElement);
    });
}

// حذف عنصر
function deleteItem(section, index) {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
        siteData[section].splice(index, 1);
        saveAdminData();
        renderAllAdminLists();
    }
}

// إضافة كتاب جديد
document.getElementById('book-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newBook = {
        title: document.getElementById('book-title').value,
        description: document.getElementById('book-description').value,
        driveLink: document.getElementById('book-drive-link').value
    };
    
    siteData.books.push(newBook);
    saveAdminData();
    renderAdminList('books', siteData.books);
    this.reset();
});

// إضافة رواية جديدة
document.getElementById('novel-form').addEventListener('submit', function(e) {
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
    
    siteData.novels.push(newNovel);
    saveAdminData();
    renderAdminList('novels', siteData.novels);
    this.reset();
    
    // إعادة تعيين حقل الصور
    const imagesContainer = document.getElementById('novel-images-container');
    imagesContainer.innerHTML = '<input type="url" class="novel-image-input" placeholder="رابط الصورة">';
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
document.getElementById('file-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newFile = {
        title: document.getElementById('file-title').value,
        description: document.getElementById('file-description').value,
        driveLink: document.getElementById('file-drive-link').value
    };
    
    siteData.files.push(newFile);
    saveAdminData();
    renderAdminList('files', siteData.files);
    this.reset();
});

// إضافة منصة جديدة
document.getElementById('platform-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newPlatform = {
        title: document.getElementById('platform-title').value,
        image: document.getElementById('platform-image').value,
        link: document.getElementById('platform-link').value
    };
    
    siteData.platforms.push(newPlatform);
    saveAdminData();
    renderAdminList('platforms', siteData.platforms);
    this.reset();
});

// إضافة تطبيق جديد
document.getElementById('app-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newApp = {
        title: document.getElementById('app-title').value,
        description: document.getElementById('app-description').value,
        downloadLink: document.getElementById('app-download-link').value
    };
    
    siteData.apps.push(newApp);
    saveAdminData();
    renderAdminList('apps', siteData.apps);
    this.reset();
});

// تهيئة لوحة التحكم عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    loadAdminData();
});