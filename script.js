// script.js (KODE FRONEND LENGKAP & FINAL - WHATSAPP DAN KEMBALI FIXED)

document.addEventListener('DOMContentLoaded', () => {

    // --- KONFIGURASI WHATSAPP FIXED ---
    const ADMIN_WA_NUMBER = '6285385995323'; 
    const ADMIN_WA_MESSAGE = 'Halo Admin, saya ingin membeli voucher WiFi. Mohon bantuannya.'; 
    const WA_LINK = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(ADMIN_WA_MESSAGE)}`;
    // ---------------------------------
    
    // --- Konfigurasi Server (Wajib berjalan bersama server.js) ---
    const BACKEND_URL = 'https://vertexoptimasolusi.onrender.com/api';
    const pages = document.querySelectorAll('.page-content');
    const durationSelect = document.getElementById('select-duration');
    const totalInput = document.getElementById('input-total');
    const themeToggle = document.getElementById('theme-toggle');
    const langIdButton = document.getElementById('lang-id');
    const langEnButton = document.getElementById('lang-en');
    const voucherInput = document.querySelector('.voucher-input'); 

    let currentVouchers = []; 

    // --- Data Terjemahan ---
    const translations = {
        'id': { 'lang_id': 'Bahasa Indonesia', 'lang_en': 'Bahasa Inggris', 'login_title': 'MASUK', 'login_subtitle': 'Kode Voucher', 'login_button': 'MASUK', 'login_prompt': 'Belum punya kode?', 'login_buy_link': 'Beli di sini.', 'powered_by': 'Didukung oleh:', 'voucher_title': 'VOUCHER', 'contact_admin': 'HUBUNGI ADMIN', 'buy_self': 'BELI SENDIRI', 'form_name': 'NAMA', 'form_duration': 'DURASI', 'form_total': 'TOTAL', 'form_pay': 'BAYAR', 'qris_paid': 'SUDAH BAYAR?', 'success_back': 'KEMBALI', 'success_title': 'BERHASIL', 'success_buy_note': 'Silakan kembali dan masukkan kode-nya', 'success_login_note': 'Voucher berhasil dimasukkan. Selamat menikmati pengalaman internet yang stabil.', 'success_ok': 'OKE' },
        'en': { 'lang_id': 'Indonesian', 'lang_en': 'English', 'login_title': 'SIGN IN', 'login_subtitle': 'Voucher Code', 'login_button': 'SUBMIT', 'login_prompt': "Haven't a code yet?", 'login_buy_link': 'Buy here.', 'powered_by': 'Powered by:', 'voucher_title': 'VOUCHER', 'contact_admin': 'CONTACT ADMIN', 'buy_self': 'BUY YOURSELF', 'form_name': 'NAME', 'form_duration': 'DURATION', 'form_total': 'TOTAL', 'form_pay': 'PAY', 'qris_paid': 'ALREADY PAID?', 'success_back': 'BACK', 'success_title': 'SUCCESS', 'success_buy_note': 'Please go back and enter the code', 'success_login_note': 'Voucher successfully entered. Enjoy a stable internet experience.', 'success_ok': 'OKAY' }
    };

    // --- Fungsionalitas Umum ---
    function showPage(pageId) {
        pages.forEach(page => { page.style.display = 'none'; });
        const activePage = document.getElementById(pageId);
        if (activePage) activePage.style.display = 'flex'; 
    }

    function formatCurrency(number) { return 'Rp ' + parseInt(number).toLocaleString('id-ID'); }

    // --- Fungsionalitas Ganti Bahasa ---
    function changeLanguage(lang) {
        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            if (translations[lang] && translations[lang][key]) { element.innerText = translations[lang][key]; }
        });
        langIdButton.classList.remove('active'); langEnButton.classList.remove('active');
        if (lang === 'id') { langIdButton.classList.add('active'); } else { langEnButton.classList.add('active'); }
        localStorage.setItem('language', lang);
    }
    
    // --- Logika Harga Dinamis dari Server ---
    async function loadVoucherOptions() {
        try {
            const response = await fetch(`${BACKEND_URL}/vouchers`);
            if (!response.ok) throw new Error('Gagal mengambil data voucher dari server.');
            
            currentVouchers = await response.json();
            durationSelect.innerHTML = '';
            
            currentVouchers.forEach(v => {
                const option = document.createElement('option');
                option.value = v.code;
                option.setAttribute('data-price', v.price);
                option.innerText = v.label;
                durationSelect.appendChild(option);
            });
            
            if (currentVouchers.length > 0) { totalInput.value = formatCurrency(currentVouchers[0].price); }
        } catch (error) {
            console.error("Error loading vouchers:", error);
            durationSelect.innerHTML = '<option>Gagal memuat harga (Server Error)</option>';
            totalInput.value = 'Rp 0';
        }
    }

    durationSelect.addEventListener('change', () => {
        const selectedOption = durationSelect.options[durationSelect.selectedIndex];
        const price = selectedOption.getAttribute('data-price');
        totalInput.value = formatCurrency(price);
    });

    // --- Poin 17: Handler Pembayaran QRIS ---
    async function handlePay() {
        const selectedOption = durationSelect.options[durationSelect.selectedIndex];
        const voucherCode = selectedOption.value;
        const amount = selectedOption.getAttribute('data-price');
        
        try {
            const response = await fetch(`${BACKEND_URL}/qris/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voucherCode, amount }) });
            const data = await response.json();

            if (data.success) {
                document.querySelector('.qris-image').src = data.qris_image_url;
                document.querySelector('.qris-price').innerText = formatCurrency(data.amount);
                document.querySelector('.qris-timer').innerText = '05:00';
                showPage('page-qris');
            } else { alert('Gagal membuat transaksi QRIS.'); }
        } catch (error) { alert('Gagal terhubung ke server pembayaran.'); }
    }
    
    // --- Poin 17: Pemicu Pembuatan Voucher Setelah Bayar + SALIN OTOMATIS ---
    document.getElementById('btn-paid').addEventListener('click', async () => {
        const selectedOption = durationSelect.options[durationSelect.selectedIndex];
        const voucherPrefix = selectedOption.value; 

        try {
            const response = await fetch(`${BACKEND_URL}/qris/success`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voucherCodePrefix: voucherPrefix })
            });
            const data = await response.json();

            if (data.success) {
                const generatedVoucher = data.voucher;
                const voucherDisplay = document.querySelector('.voucher-code-display');
                voucherDisplay.innerText = generatedVoucher;
                
                await navigator.clipboard.writeText(generatedVoucher)
                    .then(() => { console.log('Kode voucher berhasil disalin ke clipboard.'); })
                    .catch(err => { console.error('Gagal menyalin kode:', err); });

                showPage('page-success-buy');
            } else { alert('Pembayaran belum terkonfirmasi atau ada masalah.'); }
        } catch (error) { alert('Gagal terhubung ke server untuk konfirmasi pembayaran.'); }
    });
    
    // --- Poin 18: Handler Aktivasi Voucher (Login) ---
    async function handleLogin() {
        const voucherValue = voucherInput.value.toUpperCase().trim();
        
        try {
            const response = await fetch(`${BACKEND_URL}/voucher/activate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voucherCode: voucherValue }) });
            const data = await response.json();

            if (data.success) { showPage('page-success-login'); } else { alert('Voucher Gagal: ' + data.message); }
        } catch (error) { alert('Gagal terhubung ke server untuk aktivasi voucher.'); }
    }


    // --- Handler Tombol Navigasi ---
    document.getElementById('buy-link').addEventListener('click', (e) => { e.preventDefault(); loadVoucherOptions(); showPage('page-buy-options'); });
    document.getElementById('btn-buy-self').addEventListener('click', () => showPage('page-buy-form'));
    document.getElementById('btn-pay').addEventListener('click', handlePay); 
    
    // FIXED: Tombol KEMBALI dari Form Beli ke Opsi Beli
    document.getElementById('btn-back-to-options').addEventListener('click', () => { showPage('page-buy-options'); });
    
    // FIXED: Tombol KEMBALI dari Opsi Beli ke Login (BARU DITAMBAH)
    document.getElementById('btn-back-to-login-from-options').addEventListener('click', () => { showPage('page-login'); });

    document.getElementById('btn-contact-admin').addEventListener('click', () => { window.open(WA_LINK, '_blank'); }); 
    
    // Tombol KEMBALI (Mengisi Input Voucher Otomatis)
    document.getElementById('btn-success-back').addEventListener('click', () => {
        const voucherCode = document.querySelector('.voucher-code-display').innerText;
        voucherInput.value = voucherCode; 
        showPage('page-login');
    });
    
    document.getElementById('login-submit-btn').addEventListener('click', handleLogin); 
    document.getElementById('btn-success-ok').addEventListener('click', () => { window.location.href = 'http://google.com'; });
    
    // Event Listeners Ganti Bahasa & Tema
    langIdButton.addEventListener('click', () => changeLanguage('id'));
    langEnButton.addEventListener('click', () => changeLanguage('en'));
    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) { document.body.classList.add('dark-mode'); localStorage.setItem('theme', 'dark'); } 
        else { document.body.classList.remove('dark-mode'); localStorage.setItem('theme', 'light'); }
    });


    // --- Inicialisasi Aplikasi ---
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') { document.body.classList.add('dark-mode'); themeToggle.checked = true; } else if (savedTheme === 'light') { document.body.classList.remove('dark-mode'); themeToggle.checked = false; }
    const savedLang = localStorage.getItem('language') || 'id';
    changeLanguage(savedLang); 
    showPage('page-login'); 
    loadVoucherOptions();
});
