// admin/config.js
const CONFIG = {
    SUPABASE_URL: 'https://xzltdsmmolyvcmkfzedf.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhbmFzZSIsInJlZiI6Inh6bHRkc21tb2x5dmNta2Z6ZWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg1NzEsImV4cCI6MjA3MzI1NDU3MX0.3TJ49ctEhOT1KDIFtZXFw2jwTq57ujaWbqNNJ2Eeb1U',
    SESSION_TIMEOUT: 30 * 60, // 30 دقيقة بالثواني
    ITEMS_PER_PAGE: 10
};

const TABLES = {
    BOOKS: 'books',
    NOVELS: 'novels',
    FILES: 'files',
    PLATFORMS: 'platforms',
    APPS: 'apps',
    SERVERS: 'servers',
    ADMINS: 'admins',
    SECURITY_LOGS: 'security_logs',
    LOGIN_ATTEMPTS: 'login_attempts',
    LOGOUT_EVENTS: 'logout_events',
    DELETION_LOGS: 'deletion_logs'
};

const CATEGORY_NAMES = {
    books: 'كتاب',
    novels: 'رواية',
    files: 'ملف',
    platforms: 'منصة',
    apps: 'تطبيق',
    servers: 'سيرفر'
};
