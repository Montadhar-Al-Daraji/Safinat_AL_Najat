// admin/auth.js
let currentAdmin = null;
let sessionTimer;

// تأكد من أن هذه الدالة async
async function checkAuth() {
    const token = sessionStorage.getItem('adminToken');
    const adminData = sessionStorage.getItem('adminData');
    
    if (!token || !adminData) {
        showLoginPage();
        return false;
    }
    
    try {
        const tokenData = parseJwt(token);
        if (tokenData.exp * 1000 < Date.now()) {
            console.error('Token expired');
            await logout();
            return false;
        }
        
        currentAdmin = JSON.parse(adminData);
        showAdminPage();
        setupAdminInterface(currentAdmin.role);
        startSessionTimer();
        
        return true;
    } catch (error) {
        console.error('Error parsing admin data:', error);
        await logout();
        return false;
    }
}

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

function showLoginPage() {
    const loginContainer = document.getElementById('login-container');
    const adminContainer = document.getElementById('admin-container');
    
    if (loginContainer) loginContainer.classList.remove('hidden');
    if (adminContainer) adminContainer.classList.add('hidden');
    
    document.addEventListener('keypress', handleLoginKeyPress);
}

function hideLoginPage() {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) loginContainer.classList.add('hidden');
    
    document.removeEventListener('keypress', handleLoginKeyPress);
}

function handleLoginKeyPress(e) {
    if (e.key === 'Enter') {
        login();
    }
}

function showAdminPage() {
    hideLoginPage();
    const adminContainer = document.getElementById('admin-container');
    if (adminContainer) adminContainer.classList.remove('hidden');
    
    document.getElementById('admin-email').textContent = currentAdmin.email;
    document.getElementById('admin-role').textContent = currentAdmin.role === 'owner' ? 'مالك' : 'مشرف';
    
    loadAdminData();
}

function startSessionTimer() {
    clearInterval(sessionTimer);
    let timeLeft = CONFIG.SESSION_TIMEOUT;
    
    sessionTimer = setInterval(() => {
        timeLeft--;
        
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        document.getElementById('session-timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(sessionTimer);
            alert('انتهت مدة الجلسة، يرجى تسجيل الدخول مرة أخرى');
            logout();
        }
    }, 1000);
}

function resetSession() {
    startSessionTimer();
    alert('تم تجديد الجلسة بنجاح');
}

async function logout() {
    if (currentAdmin) {
        await logLogoutEvent(currentAdmin.email);
    }
    
    clearInterval(sessionTimer);
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminData');
    currentAdmin = null;
    
    showLoginPage();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorElement = document.getElementById('login-error');
    
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (errorElement) errorElement.textContent = '';
}

function setupAdminInterface(role) {
    const adminsTab = document.getElementById('admins-tab');
    const securityTab = document.getElementById('security-tab');
    
    if (adminsTab) {
        adminsTab.style.display = role === 'owner' ? 'block' : 'none';
    }
    
    if (securityTab) {
        securityTab.style.display = role === 'owner' ? 'block' : 'none';
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}
