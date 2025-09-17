// admin/ui.js
let siteData = {
    books: [],
    novels: [],
    files: [],
    platforms: [],
    apps: [],
    servers: [],
    admins: []
};

function renderAllAdminLists() {
    renderAdminList('books', siteData.books);
    renderAdminList('novels', siteData.novels);
    renderAdminList('files', siteData.files);
    renderAdminList('platforms', siteData.platforms);
    renderAdminList('apps', siteData.apps);
    renderAdminList('servers', siteData.servers);
    
    if (currentAdmin.role === 'owner') {
        renderAdminsList(siteData.admins);
    }
}

function renderAdminList(section, items) {
    const listElement = document.getElementById(`${section}-list`);
    if (!listElement) return;
    
    listElement.innerHTML = '';
    
    if (items.length === 0) {
        listElement.innerHTML = '<p class="no-items">لا توجد عناصر</p>';
        return;
    }
    
    items.forEach((item) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-card';
        itemElement.setAttribute('data-id', item.id);
        
        let infoHtml = `
            <div class="item-info">
                <h3>${escapeHtml(item.title)}</h3>
        `;
        
        switch(section) {
            case 'books':
            case 'novels':
                if (item.author) infoHtml += `<p><strong>المؤلف:</strong> ${escapeHtml(item.author)}</p>`;
                if (item.publisher) infoHtml += `<p><strong>الناشر:</strong> ${escapeHtml(item.publisher)}</p>`;
                if (item.publication_year) infoHtml += `<p><strong>سنة النشر:</strong> ${escapeHtml(item.publication_year)}</p>`;
                if (item.pages) infoHtml += `<p><strong>الصفحات:</strong> ${escapeHtml(item.pages)}</p>`;
                if (item.language) infoHtml += `<p><strong>اللغة:</strong> ${escapeHtml(item.language)}</p>`;
                if (item.file_format) infoHtml += `<p><strong>الصيغة:</strong> ${escapeHtml(item.file_format)}</p>`;
                if (item.file_size) infoHtml += `<p><strong>الحجم:</strong> ${escapeHtml(item.file_size)}</p>`;
                if (item.category) infoHtml += `<p><strong>التصنيف:</strong> ${escapeHtml(item.category)}</p>`;
                break;
                
            case 'files':
                if (item.file_type) infoHtml += `<p><strong>نوع الملف:</strong> ${escapeHtml(item.file_type)}</p>`;
                if (item.file_format) infoHtml += `<p><strong>الصيغة:</strong> ${escapeHtml(item.file_format)}</p>`;
                if (item.file_size) infoHtml += `<p><strong>الحجم:</strong> ${escapeHtml(item.file_size)}</p>`;
                if (item.category) infoHtml += `<p><strong>التصنيف:</strong> ${escapeHtml(item.category)}</p>`;
                break;
                
            case 'platforms':
                if (item.platform_type) infoHtml += `<p><strong>نوع المنصة:</strong> ${escapeHtml(item.platform_type)}</p>`;
                if (item.link_url) infoHtml += `<p><strong>الرابط:</strong> ${escapeHtml(item.link_url)}</p>`;
                if (item.category) infoHtml += `<p><strong>التصنيف:</strong> ${escapeHtml(item.category)}</p>`;
                break;
                
            case 'apps':
                if (item.developer) infoHtml += `<p><strong>المطور:</strong> ${escapeHtml(item.developer)}</p>`;
                if (item.version) infoHtml += `<p><strong>الإصدار:</strong> ${escapeHtml(item.version)}</p>`;
                if (item.platform) infoHtml += `<p><strong>المنصة:</strong> ${escapeHtml(item.platform)}</p>`;
                if (item.file_size) infoHtml += `<p><strong>الحجم:</strong> ${escapeHtml(item.file_size)}</p>`;
                if (item.category) infoHtml += `<p><strong>التصنيف:</strong> ${escapeHtml(item.category)}</p>`;
                break;
                
            case 'servers':
                if (item.server_type) infoHtml += `<p><strong>نوع السيرفر:</strong> ${escapeHtml(item.server_type)}</p>`;
                if (item.invite_link) infoHtml += `<p><strong>رابط الدعوة:</strong> ${escapeHtml(item.invite_link)}</p>`;
                if (item.members_count) infoHtml += `<p><strong>عدد الأعضاء:</strong> ${escapeHtml(item.members_count)}</p>`;
                if (item.category) infoHtml += `<p><strong>التصنيف:</strong> ${escapeHtml(item.category)}</p>`;
                break;
        }
        
        if (item.views_count !== undefined) {
            infoHtml += `<p><strong>المشاهدات:</strong> ${item.views_count}</p>`;
        }
        
        if (item.downloads_count !== undefined) {
            infoHtml += `<p><strong>التحميلات:</strong> ${item.downloads_count}</p>`;
        }
        
        if (item.is_featured) {
            infoHtml += `<p><strong>مميز:</strong> نعم</p>`;
        }
        
        if (item.added_by) {
            infoHtml += `<p><strong>أضيف بواسطة:</strong> ${escapeHtml(item.added_by)}</p>`;
        }
        
        infoHtml += `</div>`;
        
        itemElement.innerHTML = infoHtml + `
            <div class="item-actions">
                <button class="edit-btn" onclick="openEditItemModal('${section}', '${item.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="delete-btn" onclick="deleteItem('${section}', '${item.id}', '${escapeHtml(item.title.replace(/'/g, "\\'"))}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        `;
        
        listElement.appendChild(itemElement);
    });
}

function renderAdminsList(admins) {
    const listElement = document.getElementById('admins-list');
    
    if (!admins || admins.length === 0) {
        listElement.innerHTML = '<p class="no-items">لا يوجد مشرفين</p>';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    admins.forEach(admin => {
        const isCurrentAdmin = currentAdmin && admin.id === currentAdmin.id;
        
        const adminItem = document.createElement('div');
        adminItem.className = 'admin-item';
        
        const adminInfo = document.createElement('div');
        adminInfo.className = 'admin-info';
        
        const emailHeading = document.createElement('h3');
        emailHeading.textContent = escapeHtml(admin.email);
        
        const fullName = document.createElement('p');
        fullName.textContent = `الاسم: ${admin.full_name || 'غير محدد'}`;
        
        const createdAt = document.createElement('p');
        createdAt.textContent = `تم الإنشاء: ${new Date(admin.created_at).toLocaleDateString('ar-EG')}`;
        
        const lastLogin = document.createElement('p');
        lastLogin.textContent = `آخر دخول: ${admin.last_login ? new Date(admin.last_login).toLocaleDateString('ar-EG') : 'لم يسجل دخول بعد'}`;
        
        const roleSpan = document.createElement('span');
        roleSpan.className = `admin-role role-${admin.role}`;
        roleSpan.textContent = admin.role === 'owner' ? 'مالك' : 'مشرف';
        
        adminInfo.appendChild(emailHeading);
        adminInfo.appendChild(fullName);
        adminInfo.appendChild(createdAt);
        adminInfo.appendChild(lastLogin);
        adminInfo.appendChild(roleSpan);
        
        const adminActions = document.createElement('div');
        adminActions.className = 'admin-actions';
        
        if (!isCurrentAdmin && currentAdmin.role === 'owner') {
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-admin';
            deleteButton.textContent = 'حذف';
            deleteButton.addEventListener('click', () => {
                deleteAdmin(admin.id, admin.email);
            });
            adminActions.appendChild(deleteButton);
        } else {
            const noDeleteSpan = document.createElement('span');
            noDeleteSpan.style.color = '#ccc';
            noDeleteSpan.textContent = 'لا يمكن حذف حسابك';
            adminActions.appendChild(noDeleteSpan);
        }
        
        adminItem.appendChild(adminInfo);
        adminItem.appendChild(adminActions);
        
        fragment.appendChild(adminItem);
    });
    
    listElement.innerHTML = '';
    listElement.appendChild(fragment);
}

function updateAdminStats() {
    const totalAdmins = siteData.admins.length;
    const totalOwners = siteData.admins.filter(admin => admin.role === 'owner').length;
    const totalAdminsCount = siteData.admins.filter(admin => admin.role === 'admin').length;
    
    document.getElementById('total-admins').textContent = totalAdmins;
    document.getElementById('total-owners').textContent = totalOwners;
    document.getElementById('total-admins-count').textContent = totalAdminsCount;
}

function escapeHtml(text) {
    if (typeof text !== 'string') {
        return text;
    }
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupSearchFunctionality() {
    const booksSearch = document.getElementById('books-search');
    if (booksSearch) {
        booksSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredBooks = siteData.books.filter(book => 
                book.title.toLowerCase().includes(searchTerm) || 
                (book.description && book.description.toLowerCase().includes(searchTerm)) ||
                (book.author && book.author.toLowerCase().includes(searchTerm)) ||
                (book.publisher && book.publisher.toLowerCase().includes(searchTerm)) ||
                (book.category && book.category.toLowerCase().includes(searchTerm))
            );
            renderAdminList('books', filteredBooks);
        });
    }
    
    const novelsSearch = document.getElementById('novels-search');
    if (novelsSearch) {
        novelsSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredNovels = siteData.novels.filter(novel => 
                novel.title.toLowerCase().includes(searchTerm) || 
                (novel.description && novel.description.toLowerCase().includes(searchTerm)) ||
                (novel.author && novel.author.toLowerCase().includes(searchTerm)) ||
                (novel.publisher && novel.publisher.toLowerCase().includes(searchTerm)) ||
                (novel.category && novel.category.toLowerCase().includes(searchTerm))
            );
            renderAdminList('novels', filteredNovels);
        });
    }
    
    const filesSearch = document.getElementById('files-search');
    if (filesSearch) {
        filesSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredFiles = siteData.files.filter(file => 
                file.title.toLowerCase().includes(searchTerm) || 
                (file.description && file.description.toLowerCase().includes(searchTerm)) ||
                (file.file_type && file.file_type.toLowerCase().includes(searchTerm)) ||
                (file.category && file.category.toLowerCase().includes(searchTerm))
            );
            renderAdminList('files', filteredFiles);
        });
    }
    
    const platformsSearch = document.getElementById('platforms-search');
    if (platformsSearch) {
        platformsSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredPlatforms = siteData.platforms.filter(platform => 
                platform.title.toLowerCase().includes(searchTerm) || 
                (platform.description && platform.description.toLowerCase().includes(searchTerm)) ||
                (platform.platform_type && platform.platform_type.toLowerCase().includes(searchTerm)) ||
                (platform.category && platform.category.toLowerCase().includes(searchTerm))
            );
            renderAdminList('platforms', filteredPlatforms);
        });
    }
    
    const appsSearch = document.getElementById('apps-search');
    if (appsSearch) {
        appsSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredApps = siteData.apps.filter(app => 
                app.title.toLowerCase().includes(searchTerm) || 
                (app.description && app.description.toLowerCase().includes(searchTerm)) ||
                (app.developer && app.developer.toLowerCase().includes(searchTerm)) ||
                (app.platform && app.platform.toLowerCase().includes(searchTerm)) ||
                (app.category && app.category.toLowerCase().includes(searchTerm))
            );
            renderAdminList('apps', filteredApps);
        });
    }
    
    const serversSearch = document.getElementById('servers-search');
    if (serversSearch) {
        serversSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredServers = siteData.servers.filter(server => 
                server.title.toLowerCase().includes(searchTerm) || 
                (server.description && server.description.toLowerCase().includes(searchTerm)) ||
                (server.server_type && server.server_type.toLowerCase().includes(searchTerm)) ||
                (server.category && server.category.toLowerCase().includes(searchTerm))
            );
            renderAdminList('servers', filteredServers);
        });
    }
    
    const adminsSearch = document.getElementById('admins-search');
    if (adminsSearch) {
        adminsSearch.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredAdmins = siteData.admins.filter(admin => 
                admin.email.toLowerCase().includes(searchTerm) ||
                (admin.full_name && admin.full_name.toLowerCase().includes(searchTerm))
            );
            renderAdminsList(filteredAdmins);
        });
    }
}

function showLoading(show = true) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'info') {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.backgroundColor = type === 'error' ? '#f44336' : 
                                      type === 'success' ? '#4CAF50' : '#2196F3';
    
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
    }, 3000);
}

function openAddItemModal(section) {
    const modal = document.getElementById('item-modal');
    const modalTitle = document.getElementById('item-modal-title');
    const form = document.getElementById('item-form');
    const itemId = document.getElementById('item-id');
    const itemType = document.getElementById('item-type');
    
    modalTitle.textContent = `إضافة ${CATEGORY_NAMES[section]}`;
    itemId.value = '';
    itemType.value = section;
    form.reset();
    
    document.querySelectorAll('.item-type-fields').forEach(field => {
        field.style.display = 'none';
    });
    document.getElementById(`item-fields-${section}`).style.display = 'block';
    
    modal.style.display = 'block';
}

function openEditItemModal(section, id) {
    const item = siteData[section].find(item => item.id === id);
    if (!item) return;
    
    const modal = document.getElementById('item-modal');
    const modalTitle = document.getElementById('item-modal-title');
    const form = document.getElementById('item-form');
    const itemId = document.getElementById('item-id');
    const itemType = document.getElementById('item-type');
    
    modalTitle.textContent = `تعديل ${CATEGORY_NAMES[section]}`;
    itemId.value = id;
    itemType.value = section;
    form.reset();
    
    // تعبئة الحقول الأساسية
    document.getElementById('item-title').value = item.title || '';
    document.getElementById('item-description').value = item.description || '';
    
    // تعبئة الحقول الخاصة بكل نوع
    switch(section) {
        case 'books':
        case 'novels':
            document.getElementById('item-author').value = item.author || '';
            document.getElementById('item-publisher').value = item.publisher || '';
            document.getElementById('item-pages').value = item.pages || '';
            document.getElementById('item-publication-year').value = item.publication_year || '';
            document.getElementById('item-language').value = item.language || 'العربية';
            document.getElementById('item-format').value = item.file_format || 'PDF';
            document.getElementById('item-size').value = item.file_size || '';
            document.getElementById('item-category').value = item.category || '';
            document.getElementById('item-tags').value = item.tags || '';
            document.getElementById('item-is-featured').checked = item.is_featured || false;
            document.getElementById('item-image').value = item.image_url || '';
            document.getElementById('item-drive-link').value = item.drive_link || '';
            break;
            
        case 'files':
            document.getElementById('item-file-type').value = item.file_type || '';
            document.getElementById('item-format-file').value = item.file_format || '';
            document.getElementById('item-size-file').value = item.file_size || '';
            document.getElementById('item-category-file').value = item.category || '';
            document.getElementById('item-tags-file').value = item.tags || '';
            document.getElementById('item-is-featured-file').checked = item.is_featured || false;
            document.getElementById('item-image-file').value = item.image_url || '';
            document.getElementById('item-drive-link-file').value = item.drive_link || '';
            break;
            
        case 'platforms':
            document.getElementById('item-platform-type').value = item.platform_type || '';
            document.getElementById('item-link-url').value = item.link_url || '';
            document.getElementById('item-category-platform').value = item.category || '';
            document.getElementById('item-tags-platform').value = item.tags || '';
            document.getElementById('item-is-featured-platform').checked = item.is_featured || false;
            document.getElementById('item-image-platform').value = item.image_url || '';
            break;
            
        case 'apps':
            document.getElementById('item-developer').value = item.developer || '';
            document.getElementById('item-version').value = item.version || '';
            document.getElementById('item-platform-app').value = item.platform || '';
            document.getElementById('item-size-app').value = item.file_size || '';
            document.getElementById('item-category-app').value = item.category || '';
            document.getElementById('item-tags-app').value = item.tags || '';
            document.getElementById('item-is-featured-app').checked = item.is_featured || false;
            document.getElementById('item-image-app').value = item.image_url || '';
            document.getElementById('item-drive-link-app').value = item.download_link || '';
            break;
            
        case 'servers':
            document.getElementById('item-server-type').value = item.server_type || '';
            document.getElementById('item-invite-link').value = item.invite_link || '';
            document.getElementById('item-members-count').value = item.members_count || 0;
            document.getElementById('item-category-server').value = item.category || '';
            document.getElementById('item-tags-server').value = item.tags || '';
            document.getElementById('item-is-featured-server').checked = item.is_featured || false;
            document.getElementById('item-image-server').value = item.image_url || '';
            break;
    }
    
    // إظهار الحقول المناسبة وإخفاء الأخرى
    document.querySelectorAll('.item-type-fields').forEach(field => {
        field.style.display = 'none';
    });
    document.getElementById(`item-fields-${section}`).style.display = 'block';
    
    modal.style.display = 'block';
}

async function saveItem(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('item-id').value;
    const itemType = document.getElementById('item-type').value;
    
    const itemData = {
        title: document.getElementById('item-title').value,
        description: document.getElementById('item-description').value
    };
    
    switch(itemType) {
        case 'books':
        case 'novels':
            itemData.author = document.getElementById('item-author').value;
            itemData.publisher = document.getElementById('item-publisher').value;
            itemData.pages = parseInt(document.getElementById('item-pages').value) || 0;
            itemData.publication_year = parseInt(document.getElementById('item-publication-year').value) || new Date().getFullYear();
            itemData.language = document.getElementById('item-language').value;
            itemData.file_format = document.getElementById('item-format').value;
            itemData.file_size = document.getElementById('item-size').value;
            itemData.category = document.getElementById('item-category').value;
            itemData.tags = document.getElementById('item-tags').value;
            itemData.is_featured = document.getElementById('item-is-featured').checked;
            itemData.image_url = document.getElementById('item-image').value;
            itemData.drive_link = document.getElementById('item-drive-link').value;
            break;
            
        case 'files':
            itemData.file_type = document.getElementById('item-file-type').value;
            itemData.file_format = document.getElementById('item-format-file').value;
            itemData.file_size = document.getElementById('item-size-file').value;
            itemData.category = document.getElementById('item-category-file').value;
            itemData.tags = document.getElementById('item-tags-file').value;
            itemData.is_featured = document.getElementById('item-is-featured-file').checked;
            itemData.image_url = document.getElementById('item-image-file').value;
            itemData.drive_link = document.getElementById('item-drive-link-file').value;
            break;
            
        case 'platforms':
            itemData.platform_type = document.getElementById('item-platform-type').value;
            itemData.link_url = document.getElementById('item-link-url').value;
            itemData.category = document.getElementById('item-category-platform').value;
            itemData.tags = document.getElementById('item-tags-platform').value;
            itemData.is_featured = document.getElementById('item-is-featured-platform').checked;
            itemData.image_url = document.getElementById('item-image-platform').value;
            break;
            
        case 'apps':
            itemData.developer = document.getElementById('item-developer').value;
            itemData.version = document.getElementById('item-version').value;
            itemData.platform = document.getElementById('item-platform-app').value;
            itemData.file_size = document.getElementById('item-size-app').value;
            itemData.category = document.getElementById('item-category-app').value;
            itemData.tags = document.getElementById('item-tags-app').value;
            itemData.is_featured = document.getElementById('item-is-featured-app').checked;
            itemData.image_url = document.getElementById('item-image-app').value;
            itemData.download_link = document.getElementById('item-drive-link-app').value;
            break;
            
        case 'servers':
            itemData.server_type = document.getElementById('item-server-type').value;
            itemData.invite_link = document.getElementById('item-invite-link').value;
            itemData.members_count = parseInt(document.getElementById('item-members-count').value) || 0;
            itemData.category = document.getElementById('item-category-server').value;
            itemData.tags = document.getElementById('item-tags-server').value;
            itemData.is_featured = document.getElementById('item-is-featured-server').checked;
            itemData.image_url = document.getElementById('item-image-server').value;
            break;
    }
    
    try {
        let result;
        if (itemId) {
            result = await saveItemToSupabase(itemType, { ...itemData, id: itemId });
            showNotification('تم تعديل العنصر بنجاح', 'success');
        } else {
            result = await saveItemToSupabase(itemType, itemData);
            showNotification('تم إضافة العنصر بنجاح', 'success');
        }
        
        await loadAdminData();
        closeModal('item-modal');
    } catch (error) {
        console.error('Error saving item:', error);
        showNotification('حدث خطأ أثناء حفظ العنصر: ' + error.message, 'error');
    }
}

async function deleteItem(section, id, title) {
    if (confirm(`هل أنت متأكد من حذف ${title}؟`)) {
        try {
            const deleteBtn = event.target;
            const originalText = deleteBtn.textContent;
            deleteBtn.textContent = 'جاري الحذف...';
            deleteBtn.disabled = true;
            
            await deleteItemFromSupabase(section, id);
            await logDeletionEvent(section, id, title);
            await loadAdminData();
            
            deleteBtn.textContent = originalText;
            deleteBtn.disabled = false;
            showNotification('تم حذف العنصر بنجاح', 'success');
        } catch (error) {
            console.error('Error deleting item:', error);
            showNotification('حدث خطأ أثناء حذف العنصر: ' + error.message, 'error');
            
            const deleteBtn = event.target;
            deleteBtn.textContent = 'حذف';
            deleteBtn.disabled = false;
        }
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function changePassword() {
    document.getElementById('password-modal').style.display = 'block';
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const panels = document.querySelectorAll('.admin-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            panels.forEach(panel => {
                panel.classList.remove('active');
            });
            
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            const targetPanel = document.getElementById(`${tabName}-panel`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                button.classList.add('active');
                
                if (tabName === 'admins' && currentAdmin.role === 'owner') {
                    loadAdminsList();
                }
            }
        });
    });
}
