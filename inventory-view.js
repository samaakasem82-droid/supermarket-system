// دالة عرض جدول المخزن
function renderInventoryTable() {
    const tbody = document.getElementById('inventory-tbody');
    if (!tbody) return;

    // جلب المنتجات المخزنة
    const products = window.products || JSON.parse(localStorage.getItem('products') || '[]');

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--text-muted); padding: 20px;">لا توجد منتجات مسجلة بالمخزن بعد.</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map((p, index) => {
        const packPrice = parseFloat(p.price) || 0;
        const qty = parseInt(p.qty) || 0;
        const totalVal = (packPrice * qty).toFixed(2);
        
        let piecePriceStr = '-';
        if (p.piecePrice) {
            piecePriceStr = parseFloat(p.piecePrice).toFixed(2) + ' ج.م';
        } else if (p.piecesCount && p.piecesCount > 0) {
            piecePriceStr = (packPrice / p.piecesCount).toFixed(2) + ' ج.م';
        }

        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.category || '-'}</td>
                <td>${packPrice.toFixed(2)} ج.م</td>
                <td style="color: var(--warning-color); font-weight: bold;">${piecePriceStr}</td>
                <td>${qty}</td>
                <td style="color: var(--primary-color); font-weight: bold;">${totalVal} ج.م</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-action-edit" onclick="openEditProductModal(${p.id})">✏️ تعديل</button>
                        <button class="btn-action-delete" onclick="deleteProduct(${p.id})">🗑 حذف</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// فتح نافذة تعديل المنتج بالمخزن وتعبئة بياناته بشكل دقيق
function openEditProductModal(id) {
    const products = window.products || JSON.parse(localStorage.getItem('products') || '[]');
    const product = products.find(p => p.id === id);
    if (!product) return;

    // تعبئة خانات النموذج بالبيانات الأصلية
    const idEl = document.getElementById('edit-p-id');
    const nameEl = document.getElementById('edit-p-name');
    const categoryEl = document.getElementById('edit-p-category');
    const priceEl = document.getElementById('edit-p-price');
    const unitEl = document.getElementById('edit-p-unit');
    const qtyEl = document.getElementById('edit-p-qty');

    if (idEl) idEl.value = product.id;
    if (nameEl) nameEl.value = product.name || '';
    if (categoryEl) categoryEl.value = product.category || '';
    if (priceEl) priceEl.value = product.price || 0;
    if (unitEl) unitEl.value = product.unit || '';
    if (qtyEl) qtyEl.value = product.qty || 0;

    // تحديث المعاينة الحسابية
    updateEditPreview();

    // إظهار النافذة المنبثقة إجبارياً
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.add('active');
        modal.style.setProperty('display', 'flex', 'important');
    }
}

// إغلاق نافذة التعديل
function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.setProperty('display', 'none', 'important');
    }
}

// تحديث المعاينة الحسابية بداخل نافذة التعديل
function updateEditPreview() {
    const priceInput = document.getElementById('edit-p-price');
    const unitInput = document.getElementById('edit-p-unit');
    
    if (!priceInput || !unitInput) return;

    const price = parseFloat(priceInput.value) || 0;
    const unitStr = unitInput.value;
    
    // استخراج عدد القطع لحساب سعر القطعة الفرعية
    const piecesCount = typeof extractPieceCount === 'function' ? extractPieceCount(unitStr) : 1;
    const piecePrice = piecesCount > 0 ? (price / piecesCount) : price;

    const countEl = document.getElementById('edit-preview-count');
    const piecePriceEl = document.getElementById('edit-preview-piece-price');

    if (countEl) countEl.textContent = piecesCount;
    if (piecePriceEl) piecePriceEl.textContent = piecePrice.toFixed(2) + ' ج.م';
}

// حذف منتج من المخزن
function deleteProduct(id) {
    if (confirm("هل أنت تأكد من حذف هذا المنتج من المخزن؟")) {
        let products = window.products || JSON.parse(localStorage.getItem('products') || '[]');
        products = products.filter(p => p.id !== id);
        
        window.products = products;
        localStorage.setItem('products', JSON.stringify(products));

        if (window.db) {
            const tx = window.db.transaction('products', 'readwrite');
            tx.objectStore('products').delete(id);
        }

        renderInventoryTable();
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
    }
}

// حفظ تعديل المنتج بالمخزن عند إرسال النموذج
document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('edit-product-form');
    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const id = parseInt(document.getElementById('edit-p-id').value);
            const name = document.getElementById('edit-p-name').value;
            const category = document.getElementById('edit-p-category').value;
            const price = parseFloat(document.getElementById('edit-p-price').value) || 0;
            const unit = document.getElementById('edit-p-unit').value;
            const qty = parseInt(document.getElementById('edit-p-qty').value) || 0;

            const piecesCount = typeof extractPieceCount === 'function' ? extractPieceCount(unit) : 1;
            const piecePrice = piecesCount > 0 ? (price / piecesCount) : price;

            let products = window.products || JSON.parse(localStorage.getItem('products') || '[]');
            const index = products.findIndex(p => p.id === id);

            if (index !== -1) {
                products[index] = { id, name, category, price, unit, qty, piecesCount, piecePrice };
                window.products = products;
                localStorage.setItem('products', JSON.stringify(products));

                if (window.db) {
                    const tx = window.db.transaction('products', 'readwrite');
                    tx.objectStore('products').put(products[index]);
                }

                renderInventoryTable();
                if (typeof updateDashboardStats === 'function') updateDashboardStats();

                closeEditModal();
                alert('تم تحديث بيانات المنتج بنجاح!');
            }
        });
    }

    // إغلاق نافذة التعديل عند النقر خارج البطاقة
    const editModal = document.getElementById('edit-modal');
    if (editModal) {
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                closeEditModal();
            }
        });
    }

    // الاستجابة الفورية لمدخلات نموذج التعديل
    const editPriceInput = document.getElementById('edit-p-price');
    const editUnitInput = document.getElementById('edit-p-unit');

    if (editPriceInput) editPriceInput.addEventListener('input', updateEditPreview);
    if (editUnitInput) editUnitInput.addEventListener('input', updateEditPreview);
});

// مسح كافة المنتجات
function clearAllProducts() {
    if (confirm("هل أنت تأكد من مسح جميع المنتجات من المخزن؟")) {
        window.products = [];
        localStorage.setItem('products', JSON.stringify([]));
        
        if (window.db) {
            const tx = window.db.transaction('products', 'readwrite');
            tx.objectStore('products').clear();
        }

        renderInventoryTable();
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
    }
}

// إتاحة الدوال للبيئة العامة
window.renderInventoryTable = renderInventoryTable;
window.openEditProductModal = openEditProductModal;
window.closeEditModal = closeEditModal;
window.deleteProduct = deleteProduct;
window.clearAllProducts = clearAllProducts;