// استخراج عدد القطع من النص المكتوب بداخل الوحدة
function extractPieceCount(unitStr) {
    if (!unitStr) return 1;
    const match = unitStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
}

// دالة لتحديث قائمة الوحدات المقترحة (datalist) بالوحدات الجديدة
function updateUnitsDatalist() {
    const datalist = document.getElementById('units-list');
    if (!datalist) return;

    const products = window.products || JSON.parse(localStorage.getItem('products') || '[]');
    
    // الوحدات الافتراضية
    const defaultUnits = [
        "كرتونة 24 قطعة",
        "كرتونة 12 قطعة",
        "باكتة 12 قطعة",
        "باكتة 6 قطع",
        "علبة 10 قطع",
        "قطعة 1"
    ];

    // استخراج كل الوحدات الفريدة المضافة سابقاً من المنتجات
    const customUnits = products.map(p => p.unit).filter(Boolean);
    const allUnits = [...new Set([...defaultUnits, ...customUnits])];

    datalist.innerHTML = allUnits.map(unit => `<option value="${unit}">`).join('');
}

// دالة تحديث صندوق المعاينة الحسابية عند الإضافة
function updateAddProductPreview() {
    const priceInput = document.getElementById('p-price');
    const unitInput = document.getElementById('p-unit');
    const calcPreview = document.getElementById('calc-preview');
    const previewCount = document.getElementById('preview-count');
    const previewPiecePrice = document.getElementById('preview-piece-price');

    if (!priceInput || !unitInput) return;

    const price = parseFloat(priceInput.value) || 0;
    const unitStr = unitInput.value.trim();

    if (price > 0 && unitStr !== '') {
        const piecesCount = extractPieceCount(unitStr);
        const piecePrice = piecesCount > 0 ? (price / piecesCount) : price;

        if (previewCount) previewCount.textContent = piecesCount;
        if (previewPiecePrice) previewPiecePrice.textContent = piecePrice.toFixed(2) + ' ج.م';
        if (calcPreview) calcPreview.style.display = 'flex';
    } else {
        if (calcPreview) calcPreview.style.display = 'none';
    }
}

// تعديل دالة إضافة وحدة جديدة لتعيد تشغيل الحساب الفوري وتحديث القائمة
function promptAddNewUnit(inputId) {
    const newUnit = prompt("أدخل مسمى الوحدة الجديدة (مثال: علبة 20 قطعة):");
    if (newUnit) {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = newUnit;
            // إطلاق حدث input لضمان إعادة حساب سعر القطعة فوراً
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }
}

// معالجة إضافة منتج جديد وتحديث الأحداث
document.addEventListener('DOMContentLoaded', () => {
    // تحديث قائمة الوحدات المقترحة فور تحميل الصفحة
    updateUnitsDatalist();

    const productForm = document.getElementById('product-form');
    const priceInput = document.getElementById('p-price');
    const unitInput = document.getElementById('p-unit');

    if (priceInput) priceInput.addEventListener('input', updateAddProductPreview);
    if (unitInput) {
        unitInput.addEventListener('input', updateAddProductPreview);
        unitInput.addEventListener('change', updateAddProductPreview);
    }
    
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('p-name').value;
            const category = document.getElementById('p-category').value;
            const price = parseFloat(document.getElementById('p-price').value) || 0;
            const unit = document.getElementById('p-unit').value;
            const qty = parseInt(document.getElementById('p-qty').value) || 1;

            const piecesCount = extractPieceCount(unit);
            const piecePrice = piecesCount > 0 ? (price / piecesCount) : price;

            const newProduct = {
                id: Date.now(),
                name,
                category,
                price,
                unit,
                qty,
                piecesCount,
                piecePrice
            };

            // الحفظ بداخل المصفوفة العامة والـ LocalStorage
            if (!window.products) window.products = [];
            window.products.push(newProduct);
            localStorage.setItem('products', JSON.stringify(window.products));

            // الحفظ بداخل IndexedDB إن وجد
            if (window.db) {
                const tx = window.db.transaction('products', 'readwrite');
                tx.objectStore('products').add(newProduct);
            }

            alert('تم حفظ المنتج بنجاح!');
            productForm.reset();
            const calcPreview = document.getElementById('calc-preview');
            if (calcPreview) calcPreview.style.display = 'none';

            // تحديث قائمة الوحدات المقترحة بالوحدة الجديدة
            updateUnitsDatalist();

            // تحديث البيانات
            if (typeof updateDashboardStats === 'function') updateDashboardStats();
            if (typeof renderInventoryTable === 'function') renderInventoryTable();
        });
    }
});

// حذف منتج مفرد
function deleteProduct(id) {
    if (confirm("هل تريد حذف هذا المنتج؟")) {
        window.products = (window.products || []).filter(p => p.id !== id);
        localStorage.setItem('products', JSON.stringify(window.products));

        if (window.db) {
            const tx = window.db.transaction('products', 'readwrite');
            tx.objectStore('products').delete(id);
        }

        if (typeof renderInventoryTable === 'function') renderInventoryTable();
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
    }
}

window.extractPieceCount = extractPieceCount;
window.deleteProduct = deleteProduct;
window.updateAddProductPreview = updateAddProductPreview;
window.promptAddNewUnit = promptAddNewUnit;
window.updateUnitsDatalist = updateUnitsDatalist;