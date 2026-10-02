// استخراج عدد القطع من النص المكتوب بداخل الوحدة
function extractPieceCount(unitStr) {
    if (!unitStr) return 1;
    const match = unitStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
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

// معالجة إضافة منتج جديد وتحديث الأحداث
document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('product-form');
    const priceInput = document.getElementById('p-price');
    const unitInput = document.getElementById('p-unit');

    if (priceInput) priceInput.addEventListener('input', updateAddProductPreview);
    if (unitInput) unitInput.addEventListener('input', updateAddProductPreview);
    if (unitInput) unitInput.addEventListener('change', updateAddProductPreview);
    
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