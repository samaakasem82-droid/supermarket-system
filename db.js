// تهيئة وإدارة قاعدة البيانات IndexedDB
let db;
const request = indexedDB.open('SupermarketDB', 1);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('stocktaking')) {
        db.createObjectStore('stocktaking', { keyPath: 'id' });
    }
};

request.onsuccess = (e) => {
    db = e.target.result;
    window.db = db;
    loadProductsFromDB();
};

request.onerror = (e) => {
    console.error("خطأ أثناء فتح قاعدة البيانات IndexedDB", e);
};

// تحميل المنتجات عند فتح الصفحة
function loadProductsFromDB() {
    if (!db) return;
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const getReq = store.getAll();

    getReq.onsuccess = () => {
        if (getReq.result && getReq.result.length > 0) {
            window.products = getReq.result;
            localStorage.setItem('products', JSON.stringify(getReq.result));
        }
        if (typeof updateDashboardStats === 'function') updateDashboardStats();
        if (typeof renderInventoryTable === 'function') renderInventoryTable();
    };
}