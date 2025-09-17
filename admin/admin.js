// Ensure you have a valid Supabase client instance
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make sure the user is logged in and a session exists
const { data: { user }, error } = await supabase.auth.getUser();

if (user) {
  // The Supabase client should automatically include the Authorization header
  // with the user's JWT for authenticated requests like this one:
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('null', '@gmail.com');

  if (error) {
    console.error('Error fetching admin data:', error);
  } else {
    console.log('Admin data:', data);
  }
} else {
  console.error('User is not authenticated. Please log in.');
  // Redirect to login page or handle unauthenticated state
}


document.addEventListener('DOMContentLoaded', async function() {
    // جعل الدالة async لتتمكن من استخدام await
    await initSupabase();
    setupEventListeners();
    checkAuth();
});

// إعداد جميع event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    
    // إعداد نموذج تسجيل الدخول
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            await login();
        });
    }
    
    const togglePasswordBtn = document.getElementById('toggle-password');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                passwordInput.type = 'password';
                this.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    const addAdminForm = document.getElementById('add-admin-form');
    if (addAdminForm) {
        addAdminForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('new-admin-email').value;
            const password = document.getElementById('new-admin-password').value;
            const role = document.getElementById('new-admin-role').value;
            
            if (email && password && role) {
                addAdmin(email, password, role).then(success => {
                    if (success) {
                        this.reset();
                    }
                });
            }
        });
    }
    
    const refreshAdminsBtn = document.getElementById('refresh-admins-btn');
    if (refreshAdminsBtn) {
        refreshAdminsBtn.addEventListener('click', function() {
            loadAdminsList();
        });
    }
    
    const resetSessionBtn = document.getElementById('reset-session-btn');
    if (resetSessionBtn) {
        resetSessionBtn.addEventListener('click', resetSession);
    }
    
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', changePassword);
    }
    
    const closePasswordModal = document.getElementById('close-password-modal');
    if (closePasswordModal) {
        closePasswordModal.addEventListener('click', function() {
            closeModal('password-modal');
        });
    }
    
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('سيتم تنفيذ تغيير كلمة المرور هنا');
            closeModal('password-modal');
        });
    }
    
    setupTabs();
    
    window.addEventListener('click', function(event) {
        const passwordModal = document.getElementById('password-modal');
        if (event.target === passwordModal) {
            closeModal('password-modal');
        }
    });
    
    // إعداد أزرار الإضافة
    const addButtons = [
        'add-book-btn', 'add-novel-btn', 'add-file-btn', 
        'add-platform-btn', 'add-app-btn', 'add-server-btn'
    ];

    addButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            const section = buttonId.replace('add-', '').replace('-btn', '');
            button.addEventListener('click', () => openAddItemModal(section));
        }
    });

    // إعداد نموذج العنصر
    const itemForm = document.getElementById('item-form');
    if (itemForm) {
        itemForm.addEventListener('submit', saveItem);
    }

    const closeItemModal = document.getElementById('close-item-modal');
    if (closeItemModal) {
        closeItemModal.addEventListener('click', function() {
            closeModal('item-modal');
        });
    }
}
