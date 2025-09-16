// admin/database.js
let supabase;

function initSupabase() {
    if (window.supabase) {
        supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        console.log('Supabase initialized successfully');
        return true;
    } else {
        console.error('Supabase library not loaded');
        return false;
    }
}

async function login() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorElement = document.getElementById('login-error');
    const loginBtn = document.querySelector('.login-btn');
    
    if (!emailInput || !passwordInput || !errorElement || !loginBtn) {
        console.error('Login elements not found');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    errorElement.textContent = '';
    
    if (!email || !password) {
        errorElement.textContent = 'يرجى ملء جميع الحقول';
        return;
    }
    
    if (!isValidEmail(email)) {
        errorElement.textContent = 'صيغة البريد الإلكتروني غير صحيحة';
        return;
    }
    
    try {
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
        loginBtn.disabled = true;
        
        const { data: admin, error } = await supabase
            .from(TABLES.ADMINS)
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (error || !admin) {
            errorElement.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
            return;
        }
        
        if (password !== atob(admin.password_hash)) {
            errorElement.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
            
            await logLoginAttempt(email, false);
            return;
        }
        
        const fakeToken = btoa(JSON.stringify({
            id: admin.id,
            email: admin.email,
            role: admin.role,
            exp: Math.floor(Date.now() / 1000) + (60 * 60)
        }));
        
        sessionStorage.setItem('adminToken', fakeToken);
        sessionStorage.setItem('adminData', JSON.stringify(admin));
        currentAdmin = admin;
        
        await logLoginAttempt(email, true);
        showAdminPage();
        
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
        
    } catch (error) {
        console.error('Login error:', error);
        if (errorElement) {
            errorElement.textContent = 'حدث خطأ أثناء تسجيل الدخول';
        }
        
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> دخول';
            loginBtn.disabled = false;
        }
    }
}

async function logLoginAttempt(email, success) {
    try {
        await supabase
            .from(TABLES.LOGIN_ATTEMPTS)
            .insert([{
                email: email,
                success: success,
                ip: await getClientIP(),
                user_agent: navigator.userAgent,
                timestamp: new Date()
            }]);
    } catch (error) {
        console.error('Error logging login attempt:', error);
    }
}

async function logLogoutEvent(email) {
    try {
        await supabase
            .from(TABLES.LOGOUT_EVENTS)
            .insert([{
                email: email,
                timestamp: new Date()
            }]);
    } catch (error) {
        console.error('Error logging logout event:', error);
    }
}

async function logDeletionEvent(table, itemId) {
    try {
        await supabase
            .from(TABLES.DELETION_LOGS)
            .insert([{
                admin_id: currentAdmin.id,
                admin_email: currentAdmin.email,
                table_name: table,
                item_id: itemId,
                timestamp: new Date()
            }]);
    } catch (error) {
        console.error('Error logging deletion:', error);
    }
}

async function loadAdminData() {
    if (!supabase) {
        if (!initSupabase()) {
            alert('خطأ في تهيئة قاعدة البيانات');
            return;
        }
    }
    
    try {
        document.querySelectorAll('.items-list').forEach(list => {
            if (list) list.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>جاري تحميل البيانات...</p></div>';
        });
        
        const [booksData, novelsData, filesData, platformsData, appsData, serversData, adminsData] = await Promise.all([
            supabase.from(TABLES.BOOKS).select('*, admins:added_by(email, full_name)'),
            supabase.from(TABLES.NOVELS).select('*, admins:added_by(email, full_name)'),
            supabase.from(TABLES.FILES).select('*, admins:added_by(email, full_name)'),
            supabase.from(TABLES.PLATFORMS).select('*, admins:added_by(email, full_name)'),
            supabase.from(TABLES.APPS).select('*, admins:added_by(email, full_name)'),
            supabase.from(TABLES.SERVERS).select('*, admins:added_by(email, full_name)'),
            currentAdmin.role === 'owner' ? supabase.from(TABLES.ADMINS).select('*') : { data: [] }
        ]);

        siteData.books = booksData.data || [];
        siteData.novels = novelsData.data || [];
        siteData.files = filesData.data || [];
        siteData.platforms = platformsData.data || [];
        siteData.apps = appsData.data || [];
        siteData.servers = serversData.data || [];
        siteData.admins = adminsData.data || [];

        renderAllAdminLists();
        setupSearchFunctionality();
        
        if (currentAdmin.role === 'owner') {
            updateAdminStats();
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        alert('حدث خطأ في تحميل البيانات: ' + error.message);
    }
}

async function saveItemToSupabase(table, item) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }
    
    item.added_by = currentAdmin.id;
    item.added_at = new Date();
    item.updated_at = new Date();
    
    const { data, error } = await supabase
        .from(table)
        .insert([item])
        .select();

    if (error) {
        console.error('Error saving item:', error);
        throw error;
    }

    return data[0];
}

async function deleteItemFromSupabase(table, id) {
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }
    
    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting item:', error);
        throw error;
    }
    
    logDeletionEvent(table, id);
}

async function addAdmin(email, password, role) {
    if (!currentAdmin || currentAdmin.role !== 'owner') {
        alert('只有所有者可以添加管理员');
        return false;
    }
    
    if (!isValidEmail(email)) {
        alert('صيغة البريد الإلكتروني غير صحيحة');
        return false;
    }
    
    if (!isStrongPassword(password)) {
        alert('كلمة المرور يجب أن تحتوي على الأقل على 8 أحرف، وتشمل أحرف كبيرة وصغيرة وأرقام');
        return false;
    }
    
    try {
        const passwordHash = btoa(password);
        
        const { data, error } = await supabase
            .from(TABLES.ADMINS)
            .insert([{ 
                email, 
                password_hash: passwordHash, 
                role,
                created_at: new Date(),
                updated_at: new Date()
            }])
            .select();
            
        if (error) {
            console.error('Error adding admin:', error);
            alert('حدث خطأ أثناء إضافة المشرف: ' + error.message);
            return false;
        }
        
        alert('تمت إضافة المشرف بنجاح');
        loadAdminsList();
        return true;
    } catch (error) {
        console.error('Error adding admin:', error);
        alert('حدث خطأ أثناء إضافة المشرف');
        return false;
    }
}

async function deleteAdmin(adminId, adminEmail) {
    if (!currentAdmin || currentAdmin.role !== 'owner') {
        alert('只有所有者可以删除管理员');
        return;
    }
    
    if (confirm(`هل أنت متأكد من حذف المشرف ${adminEmail}؟`)) {
        try {
            const { error } = await supabase
                .from(TABLES.ADMINS)
                .delete()
                .eq('id', adminId);
                
            if (error) {
                console.error('Error deleting admin:', error);
                alert('حدث خطأ أثناء حذف المشرف: ' + error.message);
                return;
            }
            
            alert('تم حذف المشرف بنجاح');
            loadAdminsList();
        } catch (error) {
            console.error('Error deleting admin:', error);
            alert('حدث خطأ أثناء حذف المشرف');
        }
    }
}

function isStrongPassword(password) {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return strongRegex.test(password);
}
