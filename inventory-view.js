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
                <td>
                    ${packPrice.toFixed(2)} ج.م
                    <small style="display: block; color: var(--text-muted); font-size: 11px;">
                        (${p.unit || 'عبوة'})
                    </small>
                </td>
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

// ==========================================
// تصدير سلع المخزن إلى Word و PDF والطباعة
// ==========================================

// 1. تصدير قائمة المخزن إلى ملف Word
function exportInventoryToWord() {
    const products = window.products || JSON.parse(localStorage.getItem('products') || '[]');
    if (products.length === 0) {
        alert("جدول المخزن فارغ حالياً!");
        return;
    }

    let tableHTML = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>تقرير سلع المخزن</title></head>
        <body dir='rtl' style='font-family: Arial;'>
            <h2 style='text-align: center;'>تقرير سلع وبضائع المخزن الكلي</h2>
            <table border='1' cellspacing='0' cellpadding='8' style='width: 100%; border-collapse: collapse; text-align: center;'>
                <thead>
                    <tr style='background-color: #f2f2f2;'>
                        <th>#</th>
                        <th>اسم المنتج</th>
                        <th>التصنيف</th>
                        <th>سعر العبوة</th>
                        <th>سعر القطعة</th>
                        <th>الكمية المتاحة</th>
                        <th>القيمة الإجمالية</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let grandTotal = 0;
    products.forEach((p, index) => {
        const packPrice = parseFloat(p.price) || 0;
        const qty = parseInt(p.qty) || 0;
        const totalVal = packPrice * qty;
        grandTotal += totalVal;

        let piecePriceStr = '-';
        if (p.piecePrice) {
            piecePriceStr = parseFloat(p.piecePrice).toFixed(2) + ' ج.م';
        } else if (p.piecesCount && p.piecesCount > 0) {
            piecePriceStr = (packPrice / p.piecesCount).toFixed(2) + ' ج.م';
        }

        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${p.name}</td>
                <td>${p.category || '-'}</td>
                <td>${packPrice.toFixed(2)} ج.م<br>
                <small style="color: #555555; font-size: 10px;">${p.unit || 'عبوة'}</small></td>
                <td>${piecePriceStr}</td>
                <td>${qty}</td>
                <td>${totalVal.toFixed(2)} ج.م</td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
            <h3 style='text-align: right; margin-top: 20px;'>إجمالي قيمة المخزون الكلية: ${grandTotal.toFixed(2)} ج.م</h3>
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff' + tableHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_المخزن_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.doc`;
    a.click();
}

// 2. معاينة وتصدير قائمة المخزن إلى PDF والطباعة
function exportInventoryToPDF() {
    const products = window.products || JSON.parse(localStorage.getItem('products') || '[]');
    if (products.length === 0) {
        alert("جدول المخزن فارغ حالياً!");
        return;
    }

    let grandTotal = 0;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const formattedTime = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const rowsHTML = products.map((p, index) => {
        const packPrice = parseFloat(p.price) || 0;
        const qty = parseInt(p.qty) || 0;
        const totalVal = packPrice * qty;
        grandTotal += totalVal;

        let piecePriceStr = '-';
        if (p.piecePrice) {
            piecePriceStr = parseFloat(p.piecePrice).toFixed(2) + ' ج.م';
        } else if (p.piecesCount && p.piecesCount > 0) {
            piecePriceStr = (packPrice / p.piecesCount).toFixed(2) + ' ج.م';
        }

        return `
            <tr style="background-color: #ffffff !important; page-break-inside: avoid;">
                <td style="border: 1px solid #000000 !important; color: #000000 !important; padding: 8px 4px; font-weight: bold; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #000000 !important; color: #000000 !important; padding: 8px 4px; font-weight: bold; text-align: center;">${p.name}</td>
                <td style="border: 1px solid #000000 !important; color: #000000 !important; padding: 8px 4px; text-align: center;">${p.category || '-'}</td>
                <td style="border: 1px solid #000000 !important; color: #000000 !important; padding: 8px 4px; font-weight: bold; text-align: center;">
                    ${packPrice.toFixed(2)} ج.م<br>
                    <small style="color: #475569 !important; font-size: 11px; font-weight: normal;">${p.unit || 'عبوة'}</small>
                </td>
                <td style="border: 1px solid #000000 !important; color: #d97706 !important; padding: 8px 4px; font-weight: bold; text-align: center;">${piecePriceStr}</td>
                <td style="border: 1px solid #000000 !important; color: #000000 !important; padding: 8px 4px; font-weight: bold; text-align: center;">${qty}</td>
                <td style="border: 1px solid #000000 !important; color: #059669 !important; padding: 8px 4px; font-weight: bold; text-align: center;">${totalVal.toFixed(2)} ج.م</td>
            </tr>
        `;
    }).join('');

    const reportHTML = `
        <div id="pdf-content-area" style="direction: rtl; text-align: right; font-family: 'Segoe UI', Arial, sans-serif; background-color: #ffffff !important; color: #000000 !important; padding: 15px; width: 100%; box-sizing: border-box; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 12px;">
                <h2 style="margin: 0; color: #0f172a !important; font-size: 20px; font-weight: bold;">📊 تقرير بضائع وسلع المخزن</h2>
                <div style="font-size: 12px; color: #475569 !important; margin-top: 4px;">تاريخ التقرير: ${formattedDate} - ${formattedTime}</div>
            </div>
            
            <hr style="border: none; border-top: 2px solid #10b981; margin-bottom: 12px;">
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; background-color: #ffffff !important; table-layout: fixed;">
                <thead>
                    <tr style="background-color: #f1f5f9 !important; page-break-inside: avoid;">
                        <th style="border: 1px solid #000000 !important; color: #059669 !important; padding: 8px 4px; font-weight: bold; width: 5%; text-align: center;">#</th>
                        <th style="border: 1px solid #000000 !important; color: #059669 !important; padding: 8px 4px; font-weight: bold; width: 25%; text-align: center;">اسم المنتج</th>
                        <th style="border: 1px solid #000000 !important; color: #059669 !important; padding: 8px 4px; font-weight: bold; width: 18%; text-align: center;">التصنيف</th>
                        <th style="border: 1px solid #000000 !important; color: #059669 !important; padding: 8px 4px; font-weight: bold; width: 14%; text-align: center;">سعر العبوة</th>
                        <th style="border: 1px solid #000000 !important; color: #059669 !important; padding: 8px 4px; font-weight: bold; width: 14%; text-align: center;">سعر القطعة</th>
                        <th style="border: 1px solid #000000 !important; color: #059669 !important; padding: 8px 4px; font-weight: bold; width: 10%; text-align: center;">الكمية</th>
                        <th style="border: 1px solid #000000 !important; color: #059669 !important; padding: 8px 4px; font-weight: bold; width: 14%; text-align: center;">القيمة الإجمالية</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHTML}
                </tbody>
            </table>
            
            <div style="border: 2px solid #10b981; border-radius: 6px; padding: 10px 15px; margin-top: 10px; width: 100%; box-sizing: border-box; background-color: #ffffff !important; page-break-inside: avoid;">
                <table style="width: 100%; border-collapse: collapse; border: none !important;">
                    <tr style="border: none !important; background: transparent !important;">
                        <td style="border: none !important; text-align: right; font-weight: bold; font-size: 15px; color: #0f172a !important; padding: 0;">إجمالي قيمة المخزون الكلية:</td>
                        <td style="border: none !important; text-align: left; font-weight: bold; font-size: 17px; color: #059669 !important; padding: 0;">${grandTotal.toFixed(2)} ج.م</td>
                    </tr>
                </table>
            </div>
        </div>
    `;

    document.getElementById('report-preview-container').innerHTML = reportHTML;
    
    const modal = document.getElementById('report-modal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

// إتاحة الدوال للبيئة العامة
window.renderInventoryTable = renderInventoryTable;
window.openEditProductModal = openEditProductModal;
window.closeEditModal = closeEditModal;
window.deleteProduct = deleteProduct;
window.clearAllProducts = clearAllProducts;
window.exportInventoryToWord = exportInventoryToWord;
window.exportInventoryToPDF = exportInventoryToPDF;
