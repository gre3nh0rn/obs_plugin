document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-switch'); // Pastikan ID ini sesuai dengan tombol Anda
    const body = document.body;
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // Fungsi untuk menerapkan tema
    function applyTheme(theme) {
        body.classList.remove('light-theme', 'dark-theme'); // Hapus kelas tema yang mungkin ada
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            if (themeToggle) themeToggle.textContent = '☀️'; // Atau ikon/teks untuk beralih ke terang
        } else {
            body.classList.add('light-theme');
            if (themeToggle) themeToggle.textContent = '🌙'; // Atau ikon/teks untuk beralih ke gelap
        }
        // Simpan preferensi tema pengguna
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
            console.warn("Could not save theme to localStorage:", e);
        }
    }

    // Fungsi untuk mendapatkan tema yang tersimpan atau preferensi sistem
    function getInitialTheme() {
        let savedTheme;
        try {
            savedTheme = localStorage.getItem('theme');
        } catch (e) {
            console.warn("Could not read theme from localStorage:", e);
            savedTheme = null;
        }

        if (savedTheme) {
            return savedTheme;
        } else if (prefersDarkScheme.matches) {
            return 'dark';
        }
        return 'light'; // Default ke tema terang
    }

    // Terapkan tema awal saat halaman dimuat
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);

    // Event listener untuk tombol toggle tema
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = body.classList.contains('dark-theme') ? 'dark' : 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }

    // (Opsional) Dengarkan perubahan preferensi sistem jika pengguna tidak punya preferensi tersimpan
    prefersDarkScheme.addEventListener('change', (e) => {
        let savedTheme;
        try {
            savedTheme = localStorage.getItem('theme');
        } catch (err) {
            // ignore
        }
        if (!savedTheme) { // Hanya ubah jika tidak ada preferensi pengguna yang eksplisit
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // // Event listener untuk sinkronisasi tema antar tab/jendela
    // window.addEventListener('storage', (event) => {
    //     if (event.key === 'theme' && event.newValue) {
    //         // Pastikan tema benar-benar berubah sebelum menerapkan ulang
    //         // Ini mencegah pembaruan yang tidak perlu jika nilai lama dan baru sama (meskipun jarang terjadi untuk 'theme')
    //         const currentThemeIsDark = body.classList.contains('dark-theme');
    //         if ((currentThemeIsDark && event.newValue === 'light') || (!currentThemeIsDark && event.newValue === 'dark')) {
    //             applyTheme(event.newValue);
    //         }
    //     }
    // });
});
