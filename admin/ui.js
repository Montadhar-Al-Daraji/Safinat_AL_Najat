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
                if (item.author) infoHtml += `<p><strong>المؤلف:</strong> ${escapeHtml(item.author)}</p>`;
                if (item.publisher) infoHtml += `<p><strong>الناشر:</strong> ${escapeHtml(item.publisher)}</p>`;
                if (item.pages) infoHtml += `<p><strong>الصفحات:</strong> ${escapeHtml(item.pages)}</p>`;
                if (item.language) infoHtml += `<p><strong>اللغة:</strong> ${escapeHtml(item.language)}</p>`;
                break;
            case 'novels':
                if (item.author) infoHtml += `<p><strong>المؤلف:</strong> ${escapeHtml(item.author)}</p>`;
                if (item.publisher) infoHtml += `<p><strong>الناشر:</strong> ${escapeHtml(item.publisher)}</p>`;
                if (item.pages) infoHtml += `<p><strong>الصفحات:</strong> ${escapeHtml(item.pages)}</p>`;
                if (item.language) infoHtml += `<p><strong>اللغة:</strong> ${escapeHtml(item.language)}</p>`;
                break;
            case 'files':
                if (item.file_type) infoHtml += `<p><strong>النوع:</strong> ${escapeHtml(item.file_type)}</p>`;
                if (item.file_format) infoHtml += `<p><strong>الصيغة:</strong> ${escapeHtml(item.file_format)}</p>`;
                if (item.file_size) infoHtml += `<p><strong>الحجم:</strong> ${escapeHtml(item.file_size)}</p>`;
                break;
            case 'platforms':
                if (item.platform_type) infoHtml += `<p><strong>نوع المنصة:</strong> ${escapeHtml(item.platform_type)}</p>`;
                break;
            case 'apps':
                if (item.developer) infoHtml += `<p><strong>المطور:</strong> ${escapeHtml(item.developer)}</p>`;
                if (item.version) infoHtml += `<p><strong>الإصدار:</strong> ${escapeHtml(item.version)}</p>`;
                if (item.platform) infoHtml += `<p><strong>المنصة:</strong> ${escapeHtml(item.platform)}</p>`;
                if (item.file_size) infoHtml += `<p><strong>الحجم:</strong> ${escapeHtml(item.file_size)}</p>`;
                break;
            case 'servers':
                if (item.server_type) infoHtml += `<p><strong>نوع السيرفر:</strong> ${escapeHtml(item.server_type)}</p>`;
                if (item.members_count) infoHtml += `<p><strong>عدد الأعضاء:</strong> ${escapeHtml(item.members_count)}</p>`;
                break;
        }
        
        if (item.views_count !== undefined) {
            infoHtml += `<p><strong>المشاهدات:</strong> ${item.views_count}</p>`;
        }
        
        if (item.downloads_count !== undefined) {
            infoHtml += `<p><strong>التحميلات:</strong> ${item.downloads_count}</p>`;
        }
        
        if (item.added_by && item.admins) {
            infoHtml += `<p><strong>أضيف بواسطة:</strong> ${escapeHtml(item.admins.full_name || item.admins.email)}</p>`;
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
        
        const createdAt = document.createElement('p');
        createdAt.textContent = `تم الإنشاء: ${new Date(admin.created_at).toLocaleDateString('ar-EG')}`;
        
        const roleSpan = document.createElement('span');
        roleSpan.className = `admin-role role-${admin.role}`;
        roleSpan.textContent = admin.role === 'owner' ? 'مالك' : 'مشرف';
        
        adminInfo.appendChild(emailHeading);
        adminInfo.appendChild(createdAt);
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
                (book.publisher && book.publisher.toLowerCase().includes(searchTerm))
            );
            renderAdminList('books', filteredBooks);
        });
    }
    
    // ... باقي عمليات البحث بنفس الطريقة
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
    
    document.getElementById('item-title').value = item.title || '';
    document.getElementById('item-description').value = item.description || '';
    document.getElementById('item-image').value = item.image || '';
    document.getElementById('item-drive-link').value = item.drive_link || item.download_link || item.link || '';
    
    switch(section) {
        case 'books':
            document.getElementById('item-author').value = item.author || '';
            document.getElementById('item-publisher').value = item.publisher || '';
            document.getElementById('item-pages').value = item.pages || '';
            document.getElementById('item-language').value = item.language || 'العربية';
            document.getElementById('item-format').value = item.file_format || 'PDF';
            document.getElementById('item-size').value = item.file_size || '';
            break;
        case 'novels':
            document.getElementById('item-author-novel').value = item.author || '';
            document.getElementById('item-publisher-novel').value = item.publisher || '';
            document.getElementById('item-pages-novel').value = item.pages || '';
            document.getElementById('item-language-novel').value = item.language || 'العربية';
            document.getElementById('item-format-novel').value = item.file_format || 'PDF';
            document.getElementById('item-size-novel').value = item.file_size || '';
            break;
        case 'files':
            document.getElementById('item-file-type').value = item.file_type || 'document';
            document.getElementById('item-format-file').value = item.file_format || '';
            document.getElementById('item-size-file').value = item.file_size || '';
            break;
        case 'platforms':
            document.getElementById('item-platform-type').value = item.platform_type || 'website';
            document.getElementById('item-link-url').value = item.link || '';
            break;
        case 'apps':
            document.getElementById('item-developer').value = item.developer || '';
            document.getElementById('item-version').value = item.version || '';
            document.getElementById('item-platform-app').value = item.platform || 'android';
            document.getElementById('item-size-app').value = item.file_size || '';
            break;
        case 'servers':
            document.getElementById('item-server-type').value = item.server_type || 'discord';
            document.getElementById('item-invite-link').value = item.invite_link || '';
            document.getElementById('item-members-count').value = item.members_count || 0;
            break;
    }
    
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
        description: document.getElementById('item-description').value,
        image: document.getElementById('item-image').value,
        drive_link: document.getElementById('item-drive-link').value
    };
    
    switch(itemType) {
        case 'books':
            itemData.author = document.getElementById('item-author').value;
            itemData.publisher = document.getElementById('item-publisher').value;
            itemData.pages = parseInt(document.getElementById('item-pages').value) || 0;
            itemData.language = document.getElementById('item-language').value;
            itemData.file_format = document.getElementById('item-format').value;
            itemData.file_size = document.getElementById('item-size').value;
            break;
        case 'novels':
            itemData.author = document.getElementById('item-author-novel').value;
            itemData.publisher = document.getElementById('item-publisher-novel').value;
            itemData.pages = parseInt(document.getElementById('item-pages-novel').value) || 0;
            itemData.language = document.getElementById('item-language-novel').value;
            itemData.file_format = document.getElementById('item-format-novel').value;
            itemData.file_size = document.getElementById('item-size-novel').value;
            break;
        case 'files':
            itemData.file_type = document.getElementById('item-file-type').value;
            itemData.file_format = document.getElementById('item-format-file').value;
            itemData.file_size = document.getElementById('item-size-file').value;
            break;
        case 'platforms':
            itemData.platform_type = document.getElementById('item-platform-type').value;
            itemData.link = document.getElementById('item-link-url').value;
            break;
        case 'apps':
            itemData.developer = document.getElementById('item-developer').value;
            itemData.version = document.getElementById('item-version').value;
            itemData.platform = document.getElementById('item-platform-app').value;
            itemData.file_size = document.getElementById('item-size-app').value;
            break;
        case 'servers':
            itemData.server_type = document.getElementById('item-server-type').value;
            itemData.invite_link = document.getElementById('item-invite-link').value;
            itemData.members_count = parseInt(document.getElementById('item-members-count').value) || 0;
            break;
    }
    
    try {
        if (itemId) {
            await supabase
                .from(itemType)
                .update(itemData)
                .eq('id', itemId);
            alert('تم تعديل العنصر بنجاح');
        } else {
            await saveItemToSupabase(itemType, itemData);
            alert('تم إضافة العنصر بنجاح');
        }
        
        await loadAdminData();
        closeModal('item-modal');
    } catch (error) {
        console.error('Error saving item:', error);
        alert('حدث خطأ أثناء حفظ العنصر: ' + error.message);
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
            await loadAdminData();
            
            deleteBtn.textContent = originalText;
            deleteBtn.disabled = false;
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('حدث خطأ أثناء حذف العنصر: ' + error.message);
            
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
