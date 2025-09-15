// (الكود الموجود حالياً)
// ...

const supabaseUrl = 'YOUR_SUPABASE_URL'; // استبدل بالرابط الخاص بك
const supabaseKey = 'YOUR_SUPABASE_KEY'; // استبدل بالمفتاح الخاص بك
const supabase = createClient(supabaseUrl, supabaseKey);

const HIGHLIGHTS_COUNT = 6; // عدد العناصر البارزة التي تريد عرضها
const allItems = []; // مصفوفة لتخزين جميع العناصر من كل الأقسام

/**
 * جلب جميع البيانات من جميع الأقسام
 */
async function fetchAllItems() {
    try {
        const sections = ['books', 'novels', 'files', 'platforms', 'apps', 'servers'];
        const promises = sections.map(section => supabase.from(section).select('*'));
        const responses = await Promise.all(promises);

        responses.forEach(response => {
            if (response.data) {
                allItems.push(...response.data);
            } else if (response.error) {
                console.error(`Error fetching data for section:`, response.error);
            }
        });

        console.log('Total items fetched:', allItems.length);
        displayHighlights();
        
    } catch (error) {
        console.error('Error fetching all items:', error.message);
    }
}

/**
 * عرض أبرز المحتويات
 */
function displayHighlights() {
    const highlightsContainer = document.getElementById('highlights-container');
    const emptyMessage = document.getElementById('highlights-empty-message');

    highlightsContainer.innerHTML = ''; // تفريغ المحتوى الحالي

    if (allItems.length > 0) {
        // إخفاء رسالة "لا توجد محتويات"
        if (emptyMessage) {
            emptyMessage.classList.add('hidden');
        }

        // اختيار عناصر عشوائية للعرض
        const shuffledItems = allItems.sort(() => 0.5 - Math.random());
        const highlights = shuffledItems.slice(0, HIGHLIGHTS_COUNT);
        
        highlights.forEach(item => {
            const itemCard = createItemCard(item);
            highlightsContainer.appendChild(itemCard);
        });
    } else {
        // إذا لم تكن هناك عناصر، أظهر رسالة "لا توجد محتويات"
        if (emptyMessage) {
            emptyMessage.classList.remove('hidden');
        }
    }
}

// ...
// (بقية الدوال مثل createItemCard() ودوال التنقل بين الأقسام)

// استدعاء الدالة عند تحميل الصفحة
// قم بتغيير الدالة التي يتم استدعاؤها في onload أو DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    // استدعاء الدالة الجديدة لجلب كل العناصر
    fetchAllItems();
});

// تأكد من أن الدالة createItemCard() موجودة ومحدثة لتتعامل مع أنواع العناصر المختلفة
function createItemCard(item) {
    // مثال بسيط على كيفية إنشاء بطاقة عنصر
    const card = document.createElement('a');
    card.href = `./item-details.html?id=${item.id}`; // الرابط يجب أن يكون صحيحاً
    card.className = 'item-card';
    card.innerHTML = `
        <img src="${item.image_url}" alt="${item.title}" class="item-image">
        <div class="item-info">
            <h4>${item.title}</h4>
            <p>${item.description.substring(0, 50)}...</p>
        </div>
    `;
    return card;
}
