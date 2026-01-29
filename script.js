// APP PO SALES - Main JavaScript (Multi-Product Support)
// ========================================================

// Global State
let salesData = [];
let outletData = [];
let produkData = [];
let poCounter = 1;
let productRowCounter = 0;

// DOM Elements
const elements = {
    form: null,
    namaSales: null,
    namaOutlet: null,
    alamat: null,
    noTelepon: null,
    noPO: null,
    keteranganBayar: null,
    catatan: null,
    productRowsContainer: null,
    addProductBtn: null,
    priceInfo: null,
    submitBtn: null,
    resetBtn: null,
    messageContainer: null
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('=== APP INITIALIZATION START ===');

        console.log('Step 1: Initializing elements...');
        initializeElements();
        console.log('✓ Elements initialized');

        console.log('Step 2: Loading data from Google Sheets...');
        await loadAllData();
        console.log('✓ Data loaded');

        console.log('Step 3: Setting up event listeners...');
        setupEventListeners();
        console.log('✓ Event listeners set up');

        console.log('Step 4: Generating PO number...');
        generatePONumber();
        console.log('✓ PO number generated');

        console.log('=== APP INITIALIZATION COMPLETE ===');
    } catch (error) {
        console.error('=== APP INITIALIZATION FAILED ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);

        // Show error to user
        const messageContainer = document.getElementById('messageContainer');
        if (messageContainer) {
            messageContainer.className = 'message error';
            messageContainer.textContent = `Initialization Error: ${error.message}. Please check console for details.`;
            messageContainer.classList.remove('hidden');
        }
    }
});

// Initialize DOM Elements
function initializeElements() {
    elements.form = document.getElementById('poForm');
    elements.namaSales = document.getElementById('namaSales');
    elements.namaOutlet = document.getElementById('namaOutlet');
    elements.alamat = document.getElementById('alamat');
    elements.noTelepon = document.getElementById('noTelepon');
    elements.noPO = document.getElementById('noPO');
    elements.keteranganBayar = document.getElementById('keteranganBayar');
    elements.catatan = document.getElementById('catatan');
    elements.productRowsContainer = document.getElementById('productRowsContainer');
    elements.addProductBtn = document.getElementById('addProductBtn');
    elements.priceInfo = document.getElementById('priceInfo');
    elements.submitBtn = document.getElementById('submitBtn');
    elements.resetBtn = document.getElementById('resetBtn');
    elements.messageContainer = document.getElementById('messageContainer');

    // Validate critical elements
    const criticalElements = [
        'form', 'namaSales', 'namaOutlet', 'productRowsContainer',
        'addProductBtn', 'submitBtn', 'messageContainer'
    ];

    for (const key of criticalElements) {
        if (!elements[key]) {
            console.error(`Critical element not found: ${key}`);
            throw new Error(`Failed to initialize: ${key} element not found`);
        }
    }

    console.log('All elements initialized successfully');
}

// Load All Data from Google Sheets
async function loadAllData() {
    showMessage('Memuat data dari Google Sheets...', 'info');

    try {
        await Promise.all([
            loadSalesData(),
            loadOutletData(),
            loadProdukData()
        ]);

        hideMessage();
        showMessage('Data berhasil dimuat!', 'success', 2000);
    } catch (error) {
        showMessage('Gagal memuat data: ' + error.message, 'error');
        console.error('Error loading data:', error);
    }
}

// Load Sales Data
async function loadSalesData() {
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'getSales');

        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success && result.data) {
            salesData = result.data.slice(1); // Skip header row
            populateSalesDropdown();
        } else {
            throw new Error('Failed to load sales data');
        }
    } catch (error) {
        console.error('Error loading sales:', error);
        throw error;
    }
}

// Load Outlet Data
async function loadOutletData() {
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'getOutlet');

        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success && result.data) {
            outletData = result.data.slice(1); // Skip header row
            populateOutletDropdown();
        } else {
            throw new Error('Failed to load outlet data');
        }
    } catch (error) {
        console.error('Error loading outlets:', error);
        throw error;
    }
}

// Global column indices
let produkColIndex = {
    nama: 0,
    harga: 1,
    diskon: 2,
    stok: 3
};

// Load Produk Data
async function loadProdukData() {
    try {
        const formData = new URLSearchParams();
        formData.append('action', 'getProduk');

        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        console.log('Product data response:', result); // Debug log

        if (result.success && result.data && result.data.length > 0) {
            // Dynamic Column Finding
            const headers = result.data[0].map(h => String(h).toUpperCase().trim());
            console.log('Headers found:', headers);

            // Find indices with better fallback logic
            produkColIndex.nama = headers.indexOf('NAMA PRODUK');
            if (produkColIndex.nama === -1) produkColIndex.nama = headers.indexOf('NAMA BARANG');
            if (produkColIndex.nama === -1) produkColIndex.nama = headers.indexOf('PRODUK');

            produkColIndex.harga = headers.indexOf('HARGA');
            if (produkColIndex.harga === -1) produkColIndex.harga = headers.indexOf('PRICE');

            produkColIndex.diskon = headers.indexOf('DISKON');

            // Try different variations for STOK
            produkColIndex.stok = headers.indexOf('STOK');
            if (produkColIndex.stok === -1) produkColIndex.stok = headers.indexOf('STOCK');
            if (produkColIndex.stok === -1) produkColIndex.stok = headers.indexOf('QTY');

            // Validate critical column
            if (produkColIndex.nama === -1) {
                // Fallback to 0 if not found, but log warning
                console.warn('Column "NAMA PRODUK" not found, defaulting to index 0');
                produkColIndex.nama = 0;
            }

            console.log('Column Indices:', produkColIndex);

            produkData = result.data.slice(1); // Skip header row
            console.log(`✓ Loaded ${produkData.length} products`);

            // Log first few products for debugging
            if (produkData.length > 0) {
                console.log('Sample Product 1:', produkData[0]);
                console.log('Sample Product 2:', produkData[1]);
            }

            // Note: populateAllProdukDropdowns removed (using search now)
        } else {
            throw new Error('Failed to load product data');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        throw error;
    }
}

// Populate Sales Dropdown
function populateSalesDropdown() {
    if (!elements.namaSales) return;
    elements.namaSales.innerHTML = '<option value="">-- Pilih Sales --</option>';

    salesData.forEach(row => {
        if (row[0]) { // NAMA SALES is in column 0
            const option = document.createElement('option');
            option.value = row[0];
            option.textContent = row[0];
            elements.namaSales.appendChild(option);
        }
    });
}

// Populate Outlet Dropdown
function populateOutletDropdown() {
    if (!elements.namaOutlet) return;
    elements.namaOutlet.innerHTML = '<option value="">-- Pilih Outlet --</option>';

    outletData.forEach(row => {
        if (row[0]) { // NAMA OUTLET is in column 0
            const option = document.createElement('option');
            option.value = row[0];
            option.textContent = row[0];
            elements.namaOutlet.appendChild(option);
        }
    });
}

// Setup Search Listeners
function setupSearchListeners(row) {
    const searchInput = row.querySelector('.produk-search');
    const suggestionsList = row.querySelector('.suggestions-list');

    if (!searchInput || !suggestionsList) return;

    // Handle Input Typing
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();

        console.log(`Search Query: "${query}"`); // Debug log

        if (query.length < 1) {
            suggestionsList.innerHTML = '';
            suggestionsList.classList.add('hidden');
            return;
        }

        // Filter products (limit to 100 to show more recommendations)
        const nameIdx = produkColIndex.nama > -1 ? produkColIndex.nama : 0;

        if (produkData.length === 0) {
            console.warn('Warning: produkData is empty during search!');
        }

        const matches = produkData.filter(row => {
            const name = String(row[nameIdx]).toLowerCase();
            return name.includes(query);
        }).slice(0, 100);

        console.log(`Matches found: ${matches.length}`); // Debug log

        // Show suggestions
        if (matches.length > 0) {
            suggestionsList.innerHTML = '';
            matches.forEach(product => {
                const name = product[nameIdx];
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.textContent = name;
                // Add price info to suggestion for better UX (optional but helpful)
                // const price = product[produkColIndex.harga];
                // div.textContent = `${name} - Rp ${formatNumber(price)}`;

                div.addEventListener('click', () => {
                    selectProductFromSearch(product, row);
                    suggestionsList.classList.add('hidden');
                });

                suggestionsList.appendChild(div);
            });
            suggestionsList.classList.remove('hidden');
        } else {
            console.log('No matches found for query:', query);
            suggestionsList.innerHTML = '<div class="suggestion-item">Produk tidak ditemukan</div>';
            suggestionsList.classList.remove('hidden');
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.classList.add('hidden');
        }
    });

    // Handle Focus
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.length > 0) {
            suggestionsList.classList.remove('hidden');
        }
    });
}

// Select Product from Search
function selectProductFromSearch(productRowData, domRow) {
    const nameIdx = produkColIndex.nama > -1 ? produkColIndex.nama : 0;
    const name = productRowData[nameIdx];

    // Set input value
    const searchInput = domRow.querySelector('.produk-search');
    searchInput.value = name;

    // Trigger existing change logic manually since we don't have a select 'change' event
    // Create a mock event object
    const mockEvent = {
        target: {
            value: name,
            dataset: {} // Will be populated by handleProdukChange
        }
    };

    // We need to slightly modify handleProdukChange or pass the data directly
    // Let's modify the flow to pass data directly to handle logic or update DOM

    handleSearchSelection(productRowData, domRow);
}

// Handle Search Selection (Logic extracted from handleProdukChange)
function handleSearchSelection(produk, row) {
    const stockInfo = row.querySelector('.stock-info');
    const qtyInput = row.querySelector('.qty-input');
    const diskonInput = row.querySelector('.diskon-input');
    const searchInput = row.querySelector('.produk-search');

    const stock = parseInt(produk[produkColIndex.stok]) || 0;
    const harga = parseFloat(produk[produkColIndex.harga]) || 0;
    const diskonProduk = parseFloat(produk[produkColIndex.diskon]) || 0;

    // Store product info in search input dataset for reference
    searchInput.dataset.harga = harga;
    searchInput.dataset.stock = stock;

    // Set default discount from product
    diskonInput.value = diskonProduk;

    // Update Price Display
    const priceDisplay = row.querySelector('.price-display');
    const priceValue = row.querySelector('.price-value');
    if (priceDisplay && priceValue) {
        priceDisplay.value = `Rp ${formatNumber(harga)}`;
        priceValue.value = harga;
    }

    // Reset Total for this row
    const totalDisplay = row.querySelector('.total-display');
    if (totalDisplay) totalDisplay.value = 'Rp 0';
    const totalValue = row.querySelector('.total-value');
    if (totalValue) totalValue.value = 0;

    // Show stock info
    displayStockInfo(stockInfo, stock, qtyInput);

    // Enable qty input
    qtyInput.disabled = false;
    qtyInput.max = stock;
    qtyInput.value = ''; // Reset QTY

    calculateTotalAll();
}

// Setup Event Listeners
function setupEventListeners() {
    if (elements.namaOutlet) {
        elements.namaOutlet.addEventListener('change', handleOutletChange);
    }
    if (elements.addProductBtn) {
        elements.addProductBtn.addEventListener('click', addProductRow);
    }
    if (elements.form) {
        elements.form.addEventListener('submit', handleFormSubmit);
    }
    if (elements.resetBtn) {
        elements.resetBtn.addEventListener('click', handleFormReset);
    }

    // Setup listeners for first product row or create one
    const firstRow = elements.productRowsContainer.querySelector('.product-row');
    if (firstRow) {
        setupProductRowListeners(firstRow);
    } else {
        console.log('No rows found, adding first row...');
        addProductRow();
    }
}

// Setup Product Row Listeners
function setupProductRowListeners(row) {
    // Initialize Search Listeners
    setupSearchListeners(row);

    const qtyInput = row.querySelector('.qty-input');
    const diskonInput = row.querySelector('.diskon-input');
    const removeBtn = row.querySelector('.btn-remove-product');

    // Note: Product change is handled by setupSearchListeners -> handleSearchSelection

    qtyInput.addEventListener('input', (e) => handleQtyChange(e, row));
    diskonInput.addEventListener('input', calculateTotalAll);

    if (removeBtn) {
        removeBtn.addEventListener('click', () => removeProductRow(row));
    }
}

// Handle Outlet Change (VLOOKUP equivalent)
function handleOutletChange(e) {
    const selectedOutlet = e.target.value;

    if (!selectedOutlet) {
        elements.alamat.value = '';
        elements.noTelepon.value = '';
        return;
    }

    // Find outlet data
    const outlet = outletData.find(row => row[0] === selectedOutlet);

    if (outlet) {
        elements.alamat.value = outlet[1] || ''; // ALAMAT is in column 1
        elements.noTelepon.value = outlet[2] || ''; // NO TELPON is in column 2
    }
}

// Add Product Row
function addProductRow() {
    productRowCounter++;

    const newRow = document.createElement('div');
    newRow.className = 'product-row';
    newRow.dataset.rowIndex = productRowCounter;

    newRow.innerHTML = `
        <div class="cell">
            <div class="form-group search-container">
                <input 
                    type="text" 
                    class="produk-search" 
                    placeholder="Ketik nama produk..." 
                    autocomplete="off"
                    required
                >
                <div class="suggestions-list hidden"></div>
                <div class="stock-info hidden"></div>
            </div>
        </div>
        
        <div class="cell">
            <input 
                type="number" 
                class="qty-input" 
                placeholder="0"
                min="1"
                disabled
                required
            >
        </div>
        
        <div class="cell">
            <input 
                type="number" 
                class="diskon-input" 
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
                value="0"
            >
        </div>

        <div class="cell">
            <input type="text" class="readonly-input price-display" value="Rp 0" readonly>
            <input type="hidden" class="price-value" value="0">
        </div>

        <div class="cell">
            <input type="text" class="readonly-input total-display" value="Rp 0" readonly>
            <input type="hidden" class="total-value" value="0">
        </div>
        
        <div class="cell">
            <button type="button" class="btn-remove-product" title="Hapus Produk">
                ✕
            </button>
        </div>
    `;

    elements.productRowsContainer.appendChild(newRow);

    // Setup listeners (no dropdown population needed for search)
    setupProductRowListeners(newRow);

    // Show remove button on all rows if more than one
    updateRemoveButtons();
}

// Remove Product Row
function removeProductRow(row) {
    row.remove();
    updateRemoveButtons();
    calculateTotalAll();
}

// Update Remove Buttons Visibility
function updateRemoveButtons() {
    const allRows = elements.productRowsContainer.querySelectorAll('.product-row');
    const removeButtons = elements.productRowsContainer.querySelectorAll('.btn-remove-product');

    removeButtons.forEach((btn, index) => {
        if (allRows.length > 1) {
            btn.classList.remove('hidden');
        } else {
            btn.classList.add('hidden');
        }
    });
}

// Display Stock Info
function displayStockInfo(stockInfoElement, stock, qtyInput) {
    stockInfoElement.classList.remove('hidden', 'low-stock', 'out-of-stock');

    let stockClass = '';
    let stockText = '';

    if (stock === 0) {
        stockClass = 'out-of-stock';
        stockText = '⚠️ Stok Habis';
        qtyInput.disabled = true;
    } else if (stock <= 10) {
        stockClass = 'low-stock';
        stockText = `⚠️ Stok Tersisa: ${stock} unit`;
    } else {
        stockText = `✓ Stok Tersedia: ${stock} unit`;
    }

    stockInfoElement.className = `stock-info ${stockClass}`;
    stockInfoElement.textContent = stockText;
}

// Handle QTY Change
function handleQtyChange(e, row) {
    const qty = parseInt(e.target.value) || 0;
    const searchInput = row.querySelector('.produk-search');
    const stock = parseInt(searchInput.dataset.stock) || 0;

    if (qty > stock) {
        showMessage(
            `QTY (${qty}) melebihi stok tersedia (${stock}). Silakan input ulang.`,
            'error'
        );
        e.target.value = stock;
        return;
    }

    if (qty > 0) {
        calculateTotalAll();
    }
}

// Calculate Total for All Products
function calculateTotalAll() {
    const allRows = elements.productRowsContainer.querySelectorAll('.product-row');
    let grandTotal = 0;
    let grandSubtotal = 0;
    let grandDiskon = 0;

    let priceBreakdown = '';

    allRows.forEach((row, index) => {
        const searchInput = row.querySelector('.produk-search'); // Changed from select
        const qtyInput = row.querySelector('.qty-input');
        const diskonInput = row.querySelector('.diskon-input');
        const totalDisplay = row.querySelector('.total-display');
        const totalValue = row.querySelector('.total-value');

        const qty = parseInt(qtyInput.value) || 0;
        const harga = parseFloat(searchInput.dataset.harga) || 0;
        const diskon = parseFloat(diskonInput.value) || 0;

        let rowTotal = 0;

        if (qty > 0 && harga > 0) {
            const subtotal = qty * harga;
            const totalDiskon = (subtotal * diskon) / 100;
            const total = subtotal - totalDiskon;

            rowTotal = total;
            grandSubtotal += subtotal;
            grandDiskon += totalDiskon;
            grandTotal += total;

            priceBreakdown += `
                <div class="price-item">
                    <span class="price-label">${searchInput.value} (${qty}x @ Rp ${formatNumber(harga)}):</span>
                    <span class="price-value">Rp ${formatNumber(total)}</span>
                </div>
            `;
        }

        // Update Row Total Display
        if (totalDisplay && totalValue) {
            totalDisplay.value = rowTotal > 0 ? `Rp ${formatNumber(rowTotal)}` : 'Rp 0';
            totalValue.value = rowTotal;
        }
    });

    if (grandTotal > 0) {
        elements.priceInfo.innerHTML = `
            ${priceBreakdown}
            <div class="price-item">
                <span class="price-label">Subtotal:</span>
                <span class="price-value">Rp ${formatNumber(grandSubtotal)}</span>
            </div>
            <div class="price-item">
                <span class="price-label">Total Diskon:</span>
                <span class="price-value">- Rp ${formatNumber(grandDiskon)}</span>
            </div>
            <div class="price-item total">
                <span class="price-label">GRAND TOTAL:</span>
                <span class="price-value">Rp ${formatNumber(grandTotal)}</span>
            </div>
        `;
    } else {
        elements.priceInfo.innerHTML = '';
    }
}

// ... (generatePONumber remains same) ...

// Handle Form Submit
async function handleFormSubmit(e) {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
        return;
    }

    // Disable submit button
    elements.submitBtn.disabled = true;
    elements.submitBtn.innerHTML = '<span class="loading"></span> Menyimpan...';

    try {
        // Collect all products
        const products = [];
        const allRows = elements.productRowsContainer.querySelectorAll('.product-row');

        allRows.forEach((row, index) => {
            const searchInput = row.querySelector('.produk-search');
            const qtyInput = row.querySelector('.qty-input');
            const diskonInput = row.querySelector('.diskon-input');

            const produk = searchInput.value;
            const qty = parseInt(qtyInput.value) || 0;

            // Ensure we get a numeric value, default to 0 if NaN or missing
            const rawHarga = searchInput.dataset.harga;
            const harga = (rawHarga !== undefined && rawHarga !== null) ? parseFloat(rawHarga) : 0;

            const rawDiskon = diskonInput.value;
            const diskon = (rawDiskon !== undefined && rawDiskon !== '') ? parseFloat(rawDiskon) : 0;

            if (produk && qty > 0) {
                const subtotal = qty * harga;
                const totalDiskon = (subtotal * diskon) / 100;
                const total = subtotal - totalDiskon;

                const productObj = {
                    produk: produk,
                    qty: qty,
                    harga: isNaN(harga) ? 0 : harga,
                    diskon: isNaN(diskon) ? 0 : diskon,
                    total: isNaN(total) ? 0 : total,

                    // TitleCase for compatibility
                    Produk: produk,
                    Qty: qty,
                    Harga: isNaN(harga) ? 0 : harga,
                    Diskon: isNaN(diskon) ? 0 : diskon,
                    Total: isNaN(total) ? 0 : total
                };

                products.push(productObj);
                console.log(`Product Row ${index + 1} added:`, productObj);
            }
        });

        console.log('Sending Products Data:', products);

        if (products.length === 0) {
            throw new Error('Tidak ada produk valid untuk disimpan.');
        }

        // Send to Google Apps Script
        const formData = new URLSearchParams();
        formData.append('action', 'savePO');
        formData.append('namaSales', elements.namaSales.value);
        formData.append('namaOutlet', elements.namaOutlet.value);
        formData.append('alamat', elements.alamat.value);
        formData.append('noTelepon', elements.noTelepon.value);
        formData.append('noPO', elements.noPO.value);
        formData.append('keteranganBayar', elements.keteranganBayar.value);
        formData.append('catatan', elements.catatan.value || '');
        formData.append('products', JSON.stringify(products));

        console.log('Full Payload:', Object.fromEntries(formData.entries()));

        const response = await fetch(CONFIG.SCRIPT_URL, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showMessage(
                `✓ PO berhasil disimpan dengan ${products.length} produk!`,
                'success',
                5000
            );

            // Increment PO counter
            poCounter++;

            // Reset form
            handleFormReset();

            // Reload product data to get updated stock
            await loadProdukData();

        } else {
            throw new Error(result.error || 'Gagal menyimpan PO');
        }

    } catch (error) {
        showMessage('Error: ' + error.message, 'error');
        console.error('Submit error:', error);
    } finally {
        elements.submitBtn.disabled = false;
        elements.submitBtn.innerHTML = '✓ Simpan PO';
    }
}

// Validate Form
function validateForm() {
    // Check basic fields
    const requiredFields = [
        { element: elements.namaSales, name: 'Nama Sales' },
        { element: elements.namaOutlet, name: 'Nama Outlet' },
        { element: elements.alamat, name: 'Alamat' },
        { element: elements.noTelepon, name: 'No Telepon' },
        { element: elements.keteranganBayar, name: 'Keterangan Bayar' }
    ];

    for (const field of requiredFields) {
        if (!field.element.value || field.element.value.trim() === '') {
            showMessage(`${field.name} wajib diisi!`, 'warning');
            field.element.focus();
            return false;
        }
    }

    // Check at least one product
    const allRows = elements.productRowsContainer.querySelectorAll('.product-row');
    let hasValidProduct = false;

    for (const row of allRows) {
        const searchInput = row.querySelector('.produk-search');
        const qtyInput = row.querySelector('.qty-input');
        const qty = parseInt(qtyInput.value) || 0;
        const stock = parseInt(searchInput.dataset.stock) || 0;

        if (searchInput.value && qty > 0) {
            hasValidProduct = true;

            // Validate stock
            if (qty > stock) {
                showMessage(
                    `QTY produk "${searchInput.value}" (${qty}) melebihi stok tersedia (${stock})!`,
                    'error'
                );
                qtyInput.focus();
                return false;
            }
        }
    }

    if (!hasValidProduct) {
        showMessage('Minimal satu produk harus diisi!', 'warning');
        return false;
    }

    return true;
}

// Handle Form Reset
function handleFormReset() {
    elements.form.reset();

    // Remove all product rows except first
    const allRows = elements.productRowsContainer.querySelectorAll('.product-row');
    allRows.forEach((row, index) => {
        if (index > 0) {
            row.remove();
        }
    });

    // Reset first row
    const firstRow = elements.productRowsContainer.querySelector('.product-row');
    const stockInfo = firstRow.querySelector('.stock-info');
    const qtyInput = firstRow.querySelector('.qty-input');
    const searchInput = firstRow.querySelector('.produk-search');

    // Clear dataset
    if (searchInput) {
        searchInput.dataset.stock = '';
        searchInput.dataset.harga = '';
    }

    stockInfo.classList.add('hidden');
    qtyInput.disabled = true;

    // Reset displays
    const priceDisplay = firstRow.querySelector('.price-display');
    const totalDisplay = firstRow.querySelector('.total-display');
    const priceValue = firstRow.querySelector('.price-value');
    const totalValue = firstRow.querySelector('.total-value');

    if (priceDisplay) priceDisplay.value = 'Rp 0';
    if (totalDisplay) totalDisplay.value = 'Rp 0';
    if (priceValue) priceValue.value = 0;
    if (totalValue) totalValue.value = 0;

    elements.priceInfo.innerHTML = '';
    updateRemoveButtons();
    generatePONumber();
    hideMessage();
}

// Show Message
function showMessage(message, type = 'info', duration = 0) {
    elements.messageContainer.className = `message ${type}`;
    elements.messageContainer.textContent = message;
    elements.messageContainer.classList.remove('hidden');

    if (duration > 0) {
        setTimeout(() => {
            hideMessage();
        }, duration);
    }
}

// Hide Message
function hideMessage() {
    elements.messageContainer.classList.add('hidden');
}

// Format Number with Thousand Separator
function formatNumber(num) {
    return num.toLocaleString('id-ID');
}

// Generate PO Number
function generatePONumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const counter = String(poCounter).padStart(4, '0');

    elements.noPO.value = `${CONFIG.PO_PREFIX}-${year}${month}${day}-${counter}`;
}
