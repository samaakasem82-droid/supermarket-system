// التهيئة العامة للتنقل والأحداث
document.addEventListener('DOMContentLoaded', () => {
    // إتاحة قائمة المنتجات بداخل النافذة العامة
    if (!window.products) {
        window.products = JSON.parse(localStorage.getItem('products') || '[]');
    }

    // إدارة التبويب والتنقل بين الكروت
    const navCards = document.querySelectorAll('.nav-card');
    navCards.forEach(card => {
        card.addEventListener('click', () => {
            const targetPageId = card.getAttribute('data-page');

            // إزالة التنشيط عن بقية التبويبات والصفحات
            navCards.forEach(c => c.classList.remove('active-tab'));
            document.querySelectorAll('.page-view').forEach(page => page.classList.remove('active'));

            // تفعيل الصفحة المختارة
            card.classList.add('active-tab');
            const targetPage = document.getElementById(targetPageId);
            if (targetPage) {
                targetPage.classList.add('active');
            }

            // تحديث الجدول فور الضغط على صفحة المخزن
            if (targetPageId === 'inventory-page') {
                if (typeof renderInventoryTable === 'function') {
                    renderInventoryTable();
                }
            }
        });
    });

    // تحديث إحصائيات الصفحة عند التحميل
    updateDashboardStats();
});

// تحديث الإحصائيات بالداشبورد
function updateDashboardStats() {
    const products = window.products || JSON.parse(localStorage.getItem('products') || '[]');
    
    const totalProductsEl = document.getElementById('stat-total-products');
    const totalCategoriesEl = document.getElementById('stat-total-categories');
    const totalValueEl = document.getElementById('stat-total-value');

    if (totalProductsEl) totalProductsEl.textContent = products.length;

    if (totalCategoriesEl) {
        const categories = new Set(products.map(p => p.category).filter(Boolean));
        totalCategoriesEl.textContent = categories.size;
    }

    if (totalValueEl) {
        const totalValue = products.reduce((sum, p) => sum + ((parseFloat(p.price) || 0) * (parseInt(p.qty) || 0)), 0);
        totalValueEl.textContent = totalValue.toFixed(2) + ' ج.م';
    }
}

// دالة إضافة وحدة جديدة
function promptAddNewUnit(inputId) {
    const newUnit = prompt("أدخل مسمى الوحدة الجديدة (مثال: علبة 20 قطعة):");
    if (newUnit) {
        const input = document.getElementById(inputId);
        if (input) input.value = newUnit;
    }
}

window.updateDashboardStats = updateDashboardStats;
window.promptAddNewUnit = promptAddNewUnit;