// ==========================================
// 1. إدارة متغيرات حالة الجرد والتهيئة
// ==========================================
let selectedProductForStock = null;
let stockList = JSON.parse(localStorage.getItem('stockList') || '[]');

document.addEventListener('DOMContentLoaded', () => {
    initStocktakingListeners();
    renderStockList();
});

// ==========================================
// 2. تهيئة مستمعي الأحداث (Event Listeners)
// ==========================================
function initStocktakingListeners() {
    const searchInput = document.getElementById('st-search');
    const resultsDiv = document.getElementById('st-results');
    const packQtyInput = document.getElementById('st-pack-qty');
    const pieceQtyInput = document.getElementById('st-piece-qty');

    // البحث الفوري عن المنتجات
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (!query) {
                if (resultsDiv) resultsDiv.style.display = 'none';
                return;
            }

            const products = window.products || JSON.parse(localStorage.getItem('products') || '[]');
            const filtered = products.filter(p => p.name.toLowerCase().includes(query));

            if (filtered.length === 0) {
                resultsDiv.innerHTML = `<div style="padding: 10px; color: var(--text-muted, #94a3b8);">لا توجد نتائج مطابقة</div>`;
            } else {
                resultsDiv.innerHTML = filtered.map(p => `
                    <div class="search-item" onclick="selectProductForStock(${p.id})" style="padding: 10px; cursor: pointer; border-bottom: 1px solid var(--border-color, #334155);">
                        <strong>${p.name}</strong> - <small>${p.unit || 'بدون وحدة'}</small>
                    </div>
                `).join('');
            }
            resultsDiv.style.display = 'block';
        });
    }

    // تحديث الحسابات الآلية عند كتابة الأعداد
    if (packQtyInput) packQtyInput.addEventListener('input', calculateCurrentStockTotal);
    if (pieceQtyInput) pieceQtyInput.addEventListener('input', calculateCurrentStockTotal);

    // نموذج تعديل عنصر الجرد
    const editStockForm = document.getElementById('edit-stock-form');
    if (editStockForm) {
        editStockForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveStockEdit();
        });
    }
}

// ==========================================
// 3. الدوال المساعدة والحسابات
// ==========================================
function extractPieceCount(unitStr) {
    if (!unitStr) return 1;
    const match = unitStr.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
}

function selectProductForStock(productId) {
    const products = window.products || JSON.parse(localStorage.getItem('products') || '[]');
    selectedProductForStock = products.find(p => p.id === productId);

    if (!selectedProductForStock) return;

    const resultsDiv = document.getElementById('st-results');
    if (resultsDiv) resultsDiv.style.display = 'none';

    document.getElementById('st-selected-name').textContent = selectedProductForStock.name;
    document.getElementById('st-selected-unit').textContent = selectedProductForStock.unit || 'عبوة';
    document.getElementById('st-selected-pack-price').textContent = (parseFloat(selectedProductForStock.price) || 0).toFixed(2) + ' ج.م';
    
    const piecesCount = selectedProductForStock.piecesCount || extractPieceCount(selectedProductForStock.unit);
    const piecePrice = selectedProductForStock.piecePrice || (piecesCount > 0 ? selectedProductForStock.price / piecesCount : selectedProductForStock.price);
    
    document.getElementById('st-selected-piece-price').textContent = parseFloat(piecePrice).toFixed(2) + ' ج.م';
    document.getElementById('st-pack-label').textContent = `عدد العبوات الكاملة (${selectedProductForStock.unit || 'عبوة'}):`;

    document.getElementById('st-pack-qty').value = '';
    document.getElementById('st-piece-qty').value = '';
    
    document.getElementById('calc-details').style.display = 'block';
    calculateCurrentStockTotal();
}

function calculateCurrentStockTotal() {
    if (!selectedProductForStock) return;

    const packQty = parseInt(document.getElementById('st-pack-qty').value) || 0;
    const pieceQty = parseInt(document.getElementById('st-piece-qty').value) || 0;

    const packPrice = parseFloat(selectedProductForStock.price) || 0;
    const piecesCount = selectedProductForStock.piecesCount || extractPieceCount(selectedProductForStock.unit);
    const piecePrice = selectedProductForStock.piecePrice || (piecesCount > 0 ? packPrice / piecesCount : packPrice);

    const totalFromPacks = packQty * packPrice;
    const totalFromPieces = pieceQty * piecePrice;
    const grandTotal = totalFromPacks + totalFromPieces;

    const totalPiecesCount = (packQty * piecesCount) + pieceQty;

    document.getElementById('st-total-price').textContent = grandTotal.toFixed(2) + ' ج.م';
    document.getElementById('st-breakdown').textContent = `إجمالي عدد القطع المجرودة: ${totalPiecesCount} قطعة (${packQty} عبوة + ${pieceQty} قطعة منفردة)`;
}

// ==========================================
// 4. إدارة قائمة الجرد والتخزين
// ==========================================
function addCurrentProductToStockList() {
    if (!selectedProductForStock) {
        alert('برجاء اختيار سلعة أولاً للبدء للجرد!');
        return;
    }

    const packQty = parseInt(document.getElementById('st-pack-qty').value) || 0;
    const pieceQty = parseInt(document.getElementById('st-piece-qty').value) || 0;

    if (packQty === 0 && pieceQty === 0) {
        alert('برجاء إدخال الكمية المجرودة (عبوات أو قطع)!');
        return;
    }

    const packPrice = parseFloat(selectedProductForStock.price) || 0;
    const piecesCount = selectedProductForStock.piecesCount || extractPieceCount(selectedProductForStock.unit);
    const piecePrice = selectedProductForStock.piecePrice || (piecesCount > 0 ? packPrice / piecesCount : packPrice);

    const totalPiecesCount = (packQty * piecesCount) + pieceQty;
    const totalPrice = totalPiecesCount * piecePrice;

    const stockItem = {
        id: Date.now(),
        productId: selectedProductForStock.id,
        name: selectedProductForStock.name,
        unit: selectedProductForStock.unit,
        packQty,
        pieceQty,
        piecesCount,
        packPrice,
        totalPiecesCount,
        piecePrice,
        totalPrice
    };

    stockList.push(stockItem);
    localStorage.setItem('stockList', JSON.stringify(stockList));

    document.getElementById('calc-details').style.display = 'none';
    document.getElementById('st-search').value = '';
    selectedProductForStock = null;

    renderStockList();
    alert('تم إضافة المنتج بنجاح إلى كشف الجرد!');
}

function renderStockList() {
    const tbody = document.getElementById('stock-list-tbody');
    const grandTotalEl = document.getElementById('stock-grand-total');
    if (!tbody) return;

    if (stockList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted, #94a3b8); padding: 15px;">لم يتم إضافة أي منتجات لكشف الجرد بعد.</td></tr>`;
        if (grandTotalEl) grandTotalEl.textContent = '0.00 ج.م';
        return;
    }

    let overallTotal = 0;

    tbody.innerHTML = stockList.map((item, index) => {
        overallTotal += item.totalPrice;
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${item.name}</strong></td>
                <td>${item.totalPiecesCount} قطعة <small style="display:block; color: var(--text-muted, #94a3b8);">(${item.packQty || 0} عبوة + ${item.pieceQty || 0} قطعة)</small></td>
                <td>${parseFloat(item.piecePrice).toFixed(2)} ج.م</td>
                <td style="color: var(--primary-color, #10b981); font-weight: bold;">${parseFloat(item.totalPrice).toFixed(2)} ج.م</td>
                <td class="action-col">
                    <div class="table-actions" style="display: flex; gap: 5px;">
                        <button class="btn-action-edit" onclick="openEditStockModal(${item.id})" style="padding: 4px 8px; cursor: pointer;">✏ تعديل</button>
                        <button class="btn-action-delete" onclick="removeStockItem(${item.id})" style="padding: 4px 8px; cursor: pointer;">🗑 حذف</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    if (grandTotalEl) grandTotalEl.textContent = overallTotal.toFixed(2) + ' ج.م';
}

function openEditStockModal(id) {
    const item = stockList.find(i => i.id === id);
    if (!item) return;

    document.getElementById('edit-stock-id').value = item.id;
    document.getElementById('edit-stock-item-name').textContent = item.name;
    document.getElementById('edit-stock-pack-label').textContent = `عدد العبوات الكاملة (${item.unit || 'عبوة'}):`;
    document.getElementById('edit-stock-pack-qty').value = item.packQty || 0;
    document.getElementById('edit-stock-piece-qty').value = item.pieceQty || 0;

    const modal = document.getElementById('edit-stock-modal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeEditStockModal() {
    const modal = document.getElementById('edit-stock-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

function saveStockEdit() {
    const id = parseInt(document.getElementById('edit-stock-id').value);
    const packQty = parseInt(document.getElementById('edit-stock-pack-qty').value) || 0;
    const pieceQty = parseInt(document.getElementById('edit-stock-piece-qty').value) || 0;

    const itemIndex = stockList.findIndex(i => i.id === id);
    if (itemIndex !== -1) {
        const item = stockList[itemIndex];
        const piecesCount = item.piecesCount || extractPieceCount(item.unit);
        
        item.packQty = packQty;
        item.pieceQty = pieceQty;
        item.totalPiecesCount = (packQty * piecesCount) + pieceQty;
        item.totalPrice = item.totalPiecesCount * item.piecePrice;

        stockList[itemIndex] = item;
        localStorage.setItem('stockList', JSON.stringify(stockList));

        renderStockList();
        closeEditStockModal();
        alert('تم تعديل بيانات الجرد بنجاح!');
    }
}

function removeStockItem(id) {
    if (confirm("هل أنت تأكد من حذف هذا المنتج من كشف الجرد؟")) {
        stockList = stockList.filter(item => item.id !== id);
        localStorage.setItem('stockList', JSON.stringify(stockList));
        renderStockList();
    }
}

function clearStockList() {
    if (confirm("هل أنت تأكد من مسح كشف الجرد بالكامل؟")) {
        stockList = [];
        localStorage.setItem('stockList', JSON.stringify([]));
        renderStockList();
    }
}

// ==========================================
// 5. التصدير والمعاينة والطباعة
// ==========================================
function exportStockListToWord() {
    if (stockList.length === 0) {
        alert("كشف الجرد فارغ حالياً!");
        return;
    }

    let tableHTML = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>كشف الجرد</title></head>
        <body dir='rtl' style='font-family: Arial;'>
            <h2 style='text-align: center;'>تقرير كشف الجرد النهائي</h2>
            <table border='1' cellspacing='0' cellpadding='8' style='width: 100%; border-collapse: collapse; text-align: center;'>
                <thead>
                    <tr style='background-color: #f2f2f2;'>
                        <th>#</th>
                        <th>اسم السلعة</th>
                        <th>إجمالي الكمية المجرودة</th>
                        <th>سعر القطعة</th>
                        <th>إجمالي السعر</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let totalSum = 0;
    stockList.forEach((item, index) => {
        totalSum += item.totalPrice;
        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.totalPiecesCount} قطعة (${item.packQty || 0} عبوة + ${item.pieceQty || 0} قطعة)</td>
                <td>${item.piecePrice.toFixed(2)} ج.م</td>
                <td>${item.totalPrice.toFixed(2)} ج.م</td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
            <h3 style='text-align: right; margin-top: 20px;'>إجمالي قيمة الجرد: ${totalSum.toFixed(2)} ج.م</h3>
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff' + tableHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `كشف_الجرد_${new Date().toLocaleDateString('ar-EG')}.doc`;
    a.click();
}

// فتح نافذة المعاينة مع ضبط الأبعاد والهيكل ليتناسب 100% داخل Modal المتصفح
function exportStockListToPDF() {
    if (!stockList || stockList.length === 0) {
        alert("كشف الجرد فارغ حالياً!");
        return;
    }

    const grandTotal = stockList.reduce((sum, item) => sum + item.totalPrice, 0);
    const now = new Date();
    const formattedDate = now.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const formattedTime = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const rowsHTML = stockList.map((item, index) => `
        <tr style="background-color: #ffffff !important;">
            <td style="border: 1px solid #000000 !important; color: #000000 !important; padding: 8px 4px; font-weight: bold; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid #000000 !important; color: #000000 !important; padding: 8px 4px; font-weight: bold; text-align: center;">${item.name}</td>
            <td style="border: 1px solid #000000 !important; color: #000000 !important; padding: 8px 4px; text-align: center;">
                <strong style="color: #000000 !important; font-size: 13px;">${item.totalPiecesCount} قطعة</strong><br>
                <span style="color: #475569 !important; font-size: 11px; font-weight: normal;">(${item.packQty || 0} عبوة + ${item.pieceQty || 0} قطعة)</span>
            </td>
            <td style="border: 1px solid #000000 !important; color: #000000 !important; padding: 8px 4px; font-weight: bold; text-align: center;">${parseFloat(item.piecePrice).toFixed(2)} ج.م</td>
            <td style="border: 1px solid #000000 !important; color: #0284c7 !important; padding: 8px 4px; font-weight: bold; text-align: center;">${parseFloat(item.totalPrice).toFixed(2)} ج.م</td>
        </tr>
    `).join('');

    const reportHTML = `
        <div id="pdf-content-area" style="direction: rtl; text-align: right; font-family: 'Segoe UI', Arial, sans-serif; background-color: #ffffff !important; color: #000000 !important; padding: 15px; width: 100%; box-sizing: border-box; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 12px;">
                <h2 style="margin: 0; color: #0f172a !important; font-size: 20px; font-weight: bold;">📋 تقرير كشف الجرد النهائي</h2>
                <div style="font-size: 12px; color: #475569 !important; margin-top: 4px;">تاريخ التقرير: ${formattedDate} - ${formattedTime}</div>
            </div>
            
            <hr style="border: none; border-top: 2px solid #0284c7; margin-bottom: 12px;">
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; background-color: #ffffff !important; table-layout: fixed;">
                <thead>
                    <tr style="background-color: #f1f5f9 !important;">
                        <th style="border: 1px solid #000000 !important; color: #0284c7 !important; padding: 8px 4px; font-weight: bold; width: 6%; text-align: center;">#</th>
                        <th style="border: 1px solid #000000 !important; color: #0284c7 !important; padding: 8px 4px; font-weight: bold; width: 34%; text-align: center;">اسم السلعة</th>
                        <th style="border: 1px solid #000000 !important; color: #0284c7 !important; padding: 8px 4px; font-weight: bold; width: 25%; text-align: center;">إجمالي الكمية المجرودة</th>
                        <th style="border: 1px solid #000000 !important; color: #0284c7 !important; padding: 8px 4px; font-weight: bold; width: 15%; text-align: center;">سعر القطعة</th>
                        <th style="border: 1px solid #000000 !important; color: #0284c7 !important; padding: 8px 4px; font-weight: bold; width: 20%; text-align: center;">إجمالي السعر</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHTML}
                </tbody>
            </table>
            
            <div style="border: 2px solid #0284c7; border-radius: 6px; padding: 10px 15px; margin-top: 10px; width: 100%; box-sizing: border-box; background-color: #ffffff !important;">
                <table style="width: 100%; border-collapse: collapse; border: none !important;">
                    <tr style="border: none !important; background: transparent !important;">
                        <td style="border: none !important; text-align: right; font-weight: bold; font-size: 15px; color: #0f172a !important; padding: 0;">إجمالي قيمة الجرد الكلية:</td>
                        <td style="border: none !important; text-align: left; font-weight: bold; font-size: 17px; color: #0284c7 !important; padding: 0;">${grandTotal.toFixed(2)} ج.م</td>
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

// إغلاق نافذة التقرير
function closeReportModal() {
    const modal = document.getElementById('report-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
}

// الزر الأول: طباعة عبر المتصفح
function triggerPrintFromModal() {
    const printContent = document.getElementById('report-preview-container').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>طباعة تقرير الجرد</title>
            <style>
                body { padding: 20px; font-family: Arial, sans-serif; background: #fff; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #000; padding: 8px; text-align: center; }
                @media print { @page { size: A4; margin: 15mm; } }
            </style>
        </head>
        <body>
            ${printContent}
            <script>
                window.onload = function() { window.print(); };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// الزر الثاني: تنزيل مباشر كـ PDF
function downloadPDFFromModal() {
    const element = document.getElementById('pdf-content-area');
    
    const options = {
        margin:       [0.3, 0.3, 0.3, 0.3],
        filename:     `كشف_الجرد_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.pdf`,
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(options).from(element).save();
}

// ==========================================
// 6. تصدير الدوال للنطاق العام (Global Scope)
// ==========================================
window.selectProductForStock = selectProductForStock;
window.addCurrentProductToStockList = addCurrentProductToStockList;
window.openEditStockModal = openEditStockModal;
window.closeEditStockModal = closeEditStockModal;
window.removeStockItem = removeStockItem;
window.clearStockList = clearStockList;
window.exportStockListToWord = exportStockListToWord;
window.exportStockListToPDF = exportStockListToPDF;
window.closeReportModal = closeReportModal;
window.triggerPrintFromModal = triggerPrintFromModal;
window.downloadPDFFromModal = downloadPDFFromModal;