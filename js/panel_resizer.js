document.addEventListener('DOMContentLoaded', () => {
    const resizer = document.getElementById('resizer');
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    const mainContainer = document.getElementById('main-container');

    // --- Konstanta ---
    const MIN_PANEL_WIDTH = 150;
    const LOCALSTORAGE_KEY = 'panelSplitPercentage';

    let isResizing = false;

    // --- Fungsi untuk memuat lebar tersimpan ---
    function loadPanelWidth() {
        const savedPercentage = localStorage.getItem(LOCALSTORAGE_KEY);
        if (savedPercentage) {
            const percentage = parseFloat(savedPercentage);
            if (!isNaN(percentage) && percentage > 0 && percentage < 100) {
                applyPanelSplit(percentage); // Gunakan fungsi terpisah
                console.log(`Loaded panel split: ${percentage}%`);
            } else {
                setDefaultWidths();
            }
        } else {
             setDefaultWidths();
        }
    }

    // --- Fungsi untuk menerapkan pembagian panel ---
    function applyPanelSplit(leftPercentage) {
        const rightPercentage = 100 - leftPercentage;

        // Set flex-grow berdasarkan persentase
        leftPanel.style.flexGrow = leftPercentage.toString();
        rightPanel.style.flexGrow = rightPercentage.toString();

        // Set flex-basis ke 0 agar flex-grow yang diutamakan
        leftPanel.style.flexBasis = '0';
        rightPanel.style.flexBasis = '0';
    }

    // --- Fungsi untuk mengatur lebar default (50/50) ---
    function setDefaultWidths() {
        // Gunakan flex-grow 1 untuk membagi rata
        leftPanel.style.flexGrow = '1';
        rightPanel.style.flexGrow = '1';
        // Reset basis ke default (auto), yang bekerja baik dengan grow: 1
        leftPanel.style.flexBasis = 'auto'; // Atau bisa juga '0'
        rightPanel.style.flexBasis = 'auto'; // Atau bisa juga '0'
        console.log('Set default panel widths (50/50)');
    }


    // --- Event Listener untuk Resizer ---
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';

        let startX = e.clientX;
        let startLeftWidth = leftPanel.offsetWidth;

        // --- Mouse Move Handler ---
        const handleMouseMove = (moveEvent) => {
            if (!isResizing) return;

            const currentX = moveEvent.clientX;
            const deltaX = currentX - startX;

            let newLeftWidth = startLeftWidth + deltaX;
            const containerWidth = mainContainer.offsetWidth;
            const resizerWidth = resizer.offsetWidth;
            let newRightWidth = containerWidth - newLeftWidth - resizerWidth;

            if (newLeftWidth < MIN_PANEL_WIDTH) {
                newLeftWidth = MIN_PANEL_WIDTH;
                newRightWidth = containerWidth - newLeftWidth - resizerWidth;
            }
            if (newRightWidth < MIN_PANEL_WIDTH) {
                newRightWidth = MIN_PANEL_WIDTH;
                newLeftWidth = containerWidth - newRightWidth - resizerWidth;
            }

            // Selama drag, gunakan flex-basis pixel dan grow 0 untuk presisi
            leftPanel.style.flexBasis = `${newLeftWidth}px`;
            rightPanel.style.flexBasis = `${newRightWidth}px`;
            leftPanel.style.flexGrow = '0';
            rightPanel.style.flexGrow = '0';
        };

        // --- Mouse Up Handler ---
        const handleMouseUp = () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.userSelect = '';
                document.body.style.cursor = '';

                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);

                // Hitung persentase akhir
                const finalContainerWidth = mainContainer.offsetWidth;
                const finalResizerWidth = resizer.offsetWidth;
                const finalAvailableWidth = finalContainerWidth - finalResizerWidth;
                const finalLeftWidth = leftPanel.offsetWidth;
                let leftPercentage = 50; // Default jika perhitungan gagal*/

                if (finalAvailableWidth > 0) {
                     leftPercentage = (finalLeftWidth / finalAvailableWidth) * 100;
                     // Batasi persentase agar tidak ekstrim jika ada error kecil
                     leftPercentage = Math.max(1, Math.min(99, leftPercentage));
                }


                if (leftPercentage > 0 && leftPercentage < 100) {
                    localStorage.setItem(LOCALSTORAGE_KEY, leftPercentage.toFixed(2));
                    console.log(`Saved panel split: ${leftPercentage.toFixed(2)}%`);

                    // Terapkan state akhir menggunakan fungsi yang sama dengan load
                    applyPanelSplit(leftPercentage);

                } else {
                    console.warn("Could not save panel split due to invalid width calculation. Resetting to default.");
                    setDefaultWidths(); // Reset ke default jika gagal
                    localStorage.removeItem(LOCALSTORAGE_KEY); // Hapus key yang mungkin rusak
                }
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        e.preventDefault();
    });

    // --- Muat lebar panel saat halaman dimuat ---
    loadPanelWidth();

    // --- Opsional: Handle window resize ---
    // Dengan flex-grow dan flex-basis: 0, ini seharusnya sudah cukup responsif.
    // Namun, jika ingin memastikan rasio tetap sama persis saat window resize:
    // window.addEventListener('resize', () => {
    //     if (!isResizing) {
    //         // Cukup panggil loadPanelWidth lagi, karena persentase sudah tersimpan
    //         loadPanelWidth();
    //     }
    // });

});
