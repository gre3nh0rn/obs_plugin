document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const loadButton = document.getElementById('loadButton');
    const newButton = document.getElementById('newButton');
    const saveFileButton = document.getElementById('saveFileButton'); // Tombol Save baru
    const editor = document.getElementById('editor');
    const fileStatus = document.getElementById('file-status'); // Elemen status file

    // --- State ---
    let fileListModal = null;
    let loadTypeModal = null;
    let selectedFilename = null; // Nama file yang dipilih di modal (termasuk path relatif)
    let currentSelectedFileButton = null;
    let currentFilePath = null; // Path lengkap file yang sedang diedit/dibuka (null jika baru)
    let isModified = false; // Status apakah konten sudah diubah sejak load/save terakhir

    // --- Fungsi Utility ---
    // --- FUNGSI UNTUK MEMBUAT MODAL RESIZABLE ---
    function makeModalResizable(modalContentElement) {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'modal-resize-handle'; // Kelas CSS untuk styling handle
        modalContentElement.appendChild(resizeHandle);

        let initialX, initialY, initialWidth, initialHeight;

        function startDrag(e) {
            e.preventDefault(); // Mencegah seleksi teks saat drag
            initialX = e.clientX;
            initialY = e.clientY;
            initialWidth = modalContentElement.offsetWidth;
            initialHeight = modalContentElement.offsetHeight;

            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', stopDrag);
        }

        function doDrag(e) {
            let newWidth = initialWidth + (e.clientX - initialX);
            let newHeight = initialHeight + (e.clientY - initialY);

            // Batas ukuran minimum
            const minWidth = 250; // px
            const minHeight = 200; // px

            if (newWidth < minWidth) newWidth = minWidth;
            if (newHeight < minHeight) newHeight = minHeight;

            // Batas ukuran maksimum (opsional, bisa berdasarkan viewport)
            // const maxWidth = window.innerWidth * 0.9;
            // const maxHeight = window.innerHeight * 0.85;
            // if (newWidth > maxWidth) newWidth = maxWidth;
            // if (newHeight > maxHeight) newHeight = maxHeight;

            modalContentElement.style.width = newWidth + 'px';
            modalContentElement.style.height = newHeight + 'px';
        }

        function stopDrag() {
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
        }

        resizeHandle.addEventListener('mousedown', startDrag);
    }
    // --- AKHIR FUNGSI RESIZABLE ---

    // Fungsi fetchFileContent (tetap sama)
    async function fetchFileContent(filename, type) {
        // ... (kode fetchFileContent Anda yang sudah ada) ...
        // Pastikan fungsi ini mengembalikan konten file jika sukses
        if (!filename) {
            throw new Error("Nama file tidak valid.");
        }
        try {
            const response = await fetch(`./load_file.php?filename=${encodeURIComponent(filename)}`);
            if (!response.ok) {
                let errorText = `HTTP error! status: ${response.status}`;
                try { const errorData = await response.json(); if (errorData && errorData.message) errorText += ` - ${errorData.message}`; } catch (e) { /* Abaikan */ }
                throw new Error(errorText);
            }
            const data = await response.json();
            if (data.success) {
                return data.content; // Kembalikan konten
            } else {
                throw new Error(data.message || 'Gagal memuat konten file dari server.');
            }
        } catch (error) {
            console.error(`Error fetching content for ${filename}:`, error);
            throw error; // Lemparkan error agar bisa ditangkap
        }
    }

    window.fetchFileContent = fetchFileContent; // Buat global agar bisa dipanggi dari cp.js

    // Fungsi untuk memperbarui status UI (Save button, border, status text)
    function updateSaveState(modified, filePath = null) {
        isModified = modified;
        if (saveFileButton) {
            saveFileButton.disabled = !modified;
        }
        if (editor) {
            editor.classList.toggle('modified', modified);
        }
        if (fileStatus) {
            if (filePath) {
                // Tampilkan nama file saja dari path lengkap
                const displayFilename = filePath.includes('/') ? filePath.substring(filePath.lastIndexOf('/') + 1) : filePath;
                fileStatus.textContent = `File: ${displayFilename}${modified ? ' (diubah)' : ''}`;
            } else {
                fileStatus.textContent = `Dokumen baru${modified ? ' (diubah)' : ''}`;
            }
        }
        // Simpan status modifikasi ke state jika perlu (misal untuk konfirmasi sebelum menutup)
    }

    // --- Logika Modal (showLoadTypeModal, fetchAndShowFiles, showFileModal, closeFileModal, dll.) ---
    // ... (Kode modal Anda yang sudah ada) ...
    function showLoadTypeModal() {
        if (loadTypeModal) document.body.removeChild(loadTypeModal); // Hapus modal lama jika ada

        loadTypeModal = document.createElement('div');
        loadTypeModal.id = 'loadTypeModal';
        loadTypeModal.className = 'modal-popup'; // Tambahkan kelas untuk styling umum modal
        // Styling dasar (mirip fileLoadModal)
        Object.assign(loadTypeModal.style, {
            // position: 'fixed', left: '0', top: '0', width: '100%', height: '100%',
            // backgroundColor: 'rgba(0,0,0,0.5)', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: '1001' // Pastikan di atas modal file jika terbuka bersamaan (meski seharusnya tidak)
        });

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-popup-content'; // Kelas untuk konten modal
        Object.assign(modalContent.style, {
            // backgroundColor: 'white',
            padding: '25px', borderRadius: '5px',
            minWidth: '300px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            position: 'relative' // <-- TAMBAHKAN INI: Agar tombol close absolut relatif terhadap konten
        });

        // --- TOMBOL CLOSE KANAN ATAS (BARU) ---
        const topRightCloseButton = document.createElement('button');
        topRightCloseButton.innerHTML = 'X';// '&times;'; // Karakter 'X'
        // Object.assign(topRightCloseButton.style, {
        //     position: 'absolute',
        //     top: '8px', // Sesuaikan jarak dari atas
        //     right: '12px', // Sesuaikan jarak dari kanan
        //     background: 'none',
        //     border: 'none',
        //     fontSize: '1.6rem', // Ukuran 'X'
        //     lineHeight: '1',
        //     padding: '0',
        //     cursor: 'pointer',
        //     color: '#888' // Warna awal
        // });
        // topRightCloseButton.onmouseover = () => { topRightCloseButton.style.color = '#333'; }; // Warna saat hover
        // topRightCloseButton.onmouseout = () => { topRightCloseButton.style.color = '#888'; };
        topRightCloseButton.className = 'modal-close-button'; // Kelas untuk tombol close
        topRightCloseButton.onclick = closeLoadTypeModal; // Panggil fungsi close yang sesuai
        modalContent.appendChild(topRightCloseButton);
        // --- AKHIR TOMBOL CLOSE KANAN ATAS ---

        const title = document.createElement('h3');
        title.textContent = 'Pilih Tipe File';
        title.style.marginTop = '0';
        title.style.marginBottom = '20px';
        // Beri sedikit padding atas agar tidak tertutup tombol close
        title.style.paddingTop = '15px';
        modalContent.appendChild(title);

        const buttonDiv = document.createElement('div');
        buttonDiv.style.display = 'flex';
        buttonDiv.style.justifyContent = 'space-around';
        // buttonDiv.style.verticalAlign.at='center'; // Ini tidak valid, hapus saja
        buttonDiv.style.marginBottom = '15px'; // Kembalikan margin bawah jika perlu
        buttonDiv.style.border='none';


        // Tombol Muat Daftar Lagu
        const loadSongButton = document.createElement('button');
        loadSongButton.innerHTML = '<img src=./image/icon/music-note.png width=30px height=30px alt=""><br>Muat Lagu'; // Perbaiki tag img
        loadSongButton.style.padding = '10px 15px';
        loadSongButton.onclick = () => {
            closeLoadTypeModal();
            fetchAndShowFiles('song');
        };
        buttonDiv.appendChild(loadSongButton);

        // Tombol Muat Liturgi
        const loadLiturgyButton = document.createElement('button');
        loadLiturgyButton.innerHTML = '<img src=./image/icon/liturgy-icon.png width=30px height=30px alt=""><br>Muat Liturgi'; // Perbaiki tag img
        loadLiturgyButton.style.padding = '10px 15px';
        loadLiturgyButton.onclick = () => {
            closeLoadTypeModal();
            fetchAndShowFiles('liturgy');
        };
        buttonDiv.appendChild(loadLiturgyButton);

        modalContent.appendChild(buttonDiv);

        // Tombol Tutup Bawah (Batal) - Opsional, bisa dihapus jika sudah ada 'X'
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '<img src="./image/icon/close-icon.png" width=30px height=30px alt="">'; // Perbaiki tag img
        closeButton.style.marginTop = '10px';
        closeButton.style.padding = '8px 15px';
        closeButton.onclick = closeLoadTypeModal;
        // modalContent.appendChild(closeButton); // Uncomment jika masih ingin tombol batal di bawah

        loadTypeModal.appendChild(modalContent);
        makeModalResizable(modalContent); // Jadikan modal ini resizable
        document.body.appendChild(loadTypeModal);

        // Event listener untuk menutup modal (klik luar, Esc)
        loadTypeModal.addEventListener('click', (event) => {
            if (event.target === loadTypeModal) closeLoadTypeModal();
        });
        document.addEventListener('keydown', handleEscKeyForLoadType);
    }

    function closeLoadTypeModal() {
        if (loadTypeModal) {
            document.body.removeChild(loadTypeModal);
            loadTypeModal = null;
            document.removeEventListener('keydown', handleEscKeyForLoadType);
            // Kembalikan state tombol Load utama jika perlu
            if (loadButton) {
                loadButton.innerHTML='<img src="./image/icon/load-icon.png" alt="">Buka File</img>';
                // loadButton.textContent = '<img src="./image/icon/load-icon.png" alt=""> Buka File'; // Atau teks aslinya
                loadButton.disabled = false;
            }
        }
    }

    function handleEscKeyForLoadType(event) {
        if (event.key === 'Escape') closeLoadTypeModal();
    }

    // --- Fungsi untuk Fetch Daftar File Berdasarkan Tipe (BARU) ---
    async function fetchAndShowFiles(type) {
        // Tampilkan loading di tombol utama lagi atau di tempat lain
        if (loadButton) {
            loadButton.textContent = `Memuat ${type === 'song' ? 'Lagu' : 'Liturgi'}...`;
            loadButton.disabled = true;
        }

        try {
            // Panggil list_files.php dengan parameter type
            const response = await fetch(`./list_files.php?type=${type}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            if (data.success) {
                // Tentukan judul modal berdasarkan tipe
                const modalTitle = type === 'song' ? 'Pilih Lagu' : 'Pilih Liturgi';
                showFileModal(data.files, modalTitle, type); // Kirim files, title, dan type
            } else {
                throw new Error(data.message || `Gagal mengambil daftar ${type === 'song' ? 'lagu' : 'liturgi'}.`);
            }
        } catch (error) {
            console.error(`Error fetching file list for type ${type}:`, error);
            alert(`Gagal mengambil daftar file: ${error.message}`);
            // Kembalikan state tombol Load utama jika error
             if (loadButton) {
                loadButton.innerHTML='<img src="./image/icon/load-icon.png" alt="">Buka File</img>';
                //  loadButton.textContent = '<img src="./image/icon/load-icon.png" alt=""> Buka File'; // Atau teks aslinya
                 loadButton.disabled = false;
             }
        }
        // Jangan kembalikan state tombol di sini jika showFileModal berhasil,
        // karena modal file list akan terbuka. State tombol akan dikembalikan saat modal file ditutup.
    }

    // Tambahkan parameter 'modalTitle' dan 'fileType'
    function showFileModal(files, modalTitle = 'Pilih File', fileType = null) {
        if (fileListModal) document.body.removeChild(fileListModal);

        selectedFilename = null;
        currentSelectedFileButton = null;

        fileListModal = document.createElement('div');
        fileListModal.id = 'fileLoadModal';
        fileListModal.className = 'modal-popup'; // Tambahkan kelas untuk styling umum modal
        // Styling
        Object.assign(fileListModal.style, {
            // position: 'fixed', left: '0', top: '0', width: '100%', height: '100%',
            // backgroundColor: 'rgba(0,0,0,0.5)', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: '1000'
        });

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-popup-content'; // Kelas untuk konten modal
        // Styling
        Object.assign(modalContent.style, {
            // backgroundColor: 'white', 
            padding: '20px', borderRadius: '5px',
            maxHeight: '80%', /* Biarkan tinggi maksimal agar bisa scroll */
            minWidth: '400px', /* Mungkin perlu sedikit lebih lebar */
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)', display: 'flex',
            flexDirection: 'column',
            position: 'relative'
        });

        // --- TOMBOL CLOSE KANAN ATAS ---
        const topRightCloseButton = document.createElement('button');
        topRightCloseButton.innerHTML = 'X';//'&times;';
        // Object.assign(topRightCloseButton.style, {
        //     position: 'absolute', top: '8px', right: '12px', background: 'none',
        //     border: 'none', fontSize: '1.6rem', lineHeight: '1', padding: '0',
        //     cursor: 'pointer', color: '#888'
        // });
        // topRightCloseButton.onmouseover = () => { topRightCloseButton.style.color = '#333'; };
        // topRightCloseButton.onmouseout = () => { topRightCloseButton.style.color = '#888'; };
        topRightCloseButton.className = 'modal-close-button'; // Kelas untuk tombol close
        topRightCloseButton.onclick = closeFileModal;
        modalContent.appendChild(topRightCloseButton);
        // --- AKHIR TOMBOL CLOSE KANAN ATAS ---

        const title = document.createElement('h3');
        title.textContent = modalTitle;
        Object.assign(title.style, {
            marginTop: '0', marginBottom: '15px', textAlign: 'center', paddingTop: '15px'
        });
        modalContent.appendChild(title);

        // --- INPUT PENCARIAN (BARU) ---
        const searchInput = document.createElement('input');
        searchInput.setAttribute('type', 'text');
        searchInput.setAttribute('placeholder', 'Cari file...');
        Object.assign(searchInput.style, {
            width: 'calc(100% - 20px)', // Lebar penuh dikurangi padding
            padding: '8px 10px',
            marginBottom: '10px', // Jarak ke daftar file
            border: '1px solid #ccc',
            borderRadius: '3px',
            boxSizing: 'border-box' // Agar padding tidak menambah lebar total
        });
        modalContent.appendChild(searchInput);
        // --- AKHIR INPUT PENCARIAN ---

        const fileListContainer = document.createElement('div');
        // Styling (atur maxHeight di sini agar bisa scroll)
        Object.assign(fileListContainer.style, {
            maxHeight: '350px', // Batasi tinggi container list agar bisa discroll
            overflowY: 'auto', // Aktifkan scroll vertikal jika perlu
            marginBottom: '15px',
            border: '1px solid #eee', padding: '5px'
        });

        const fileList = document.createElement('ul');
        Object.assign(fileList.style, { listStyle: 'none', padding: '0', margin: '0' });

        // Simpan referensi ke elemen list item untuk filtering
        const listItems = [];

        if (files.length === 0) {
            const noFilesItem = document.createElement('li');
            noFilesItem.textContent = `Tidak ada file ${fileType === 'song' ? 'lagu' : (fileType === 'liturgy' ? 'liturgi' : '')} ditemukan.`;
            Object.assign(noFilesItem.style, {
                padding: '10px', textAlign: 'center', color: '#888'
            });
            fileList.appendChild(noFilesItem);
        } else {
            files.forEach(filename => { // filename mungkin sekarang termasuk path relatif e.g., "lagu/nama_lagu.txt"
                const listItem = document.createElement('li'); // Buat <li>
                const fileButton = document.createElement('button');
                const displayFilename = filename.includes('/') ? filename.substring(filename.lastIndexOf('/') + 1) : filename;
                fileButton.className = 'file-list-button'; // Kelas untuk tombol file
                fileButton.textContent = displayFilename;
                // Styling tombol file
                 Object.assign(fileButton.style, {
                    // width: '100%', padding: '8px 12px', marginBottom: '4px', textAlign: 'left',
                    cursor: 'pointer', //border: '1px solid #ccc', backgroundColor: '#f9f9f9',
                    borderRadius: '3px', transition: 'background-color 0.2s, border-color 0.2s'
                });
                // fileButton.onmouseover = () => { if (fileButton !== currentSelectedFileButton) fileButton.style.backgroundColor = '#eee'; };
                // fileButton.onmouseout = () => { if (fileButton !== currentSelectedFileButton) fileButton.style.backgroundColor = '#f9f9f9'; };

                fileButton.addEventListener('click', () => {
                    if (currentSelectedFileButton) {
                        // Object.assign(currentSelectedFileButton.style, {
                        //     backgroundColor: '#f9f9f9', borderColor: '#ccc', fontWeight: 'normal'
                        // });
                        currentSelectedFileButton.classList.remove('selected');
                    }
                    selectedFilename = filename; // Simpan path lengkap
                    currentSelectedFileButton = fileButton;
                    // Object.assign(currentSelectedFileButton.style, {
                    //     backgroundColor: '#d0e0ff', borderColor: '#a0c0ff', fontWeight: 'bold'
                    // });
                    currentSelectedFileButton.classList.add('selected');

                    // Aktifkan tombol aksi modal
                    modalOpenFileButton.disabled = false;
                    modalInsertFileButton.disabled = false;
                    modalLinkFileButton.disabled = false;
                });

                listItem.appendChild(fileButton); // Masukkan button ke dalam <li>
                fileList.appendChild(listItem); // Masukkan <li> ke <ul>
                listItems.push(listItem); // Simpan <li> untuk filtering
            });
        }
        fileListContainer.appendChild(fileList);
        modalContent.appendChild(fileListContainer);

        // --- TOMBOL AKSI DI DALAM MODAL (Open, Insert, Link) ---
        const modalActionsDiv = document.createElement('div');
        Object.assign(modalActionsDiv.style, {
            display: 'flex', justifyContent: 'space-around', padding: '10px 0',
            borderTop: '1px solid #eee'
        });

        const modalOpenFileButton = document.createElement('button');
        modalOpenFileButton.innerHTML = '<img src="image/icon/open-icon.png" alt="" style="height:1em; margin-right:5px; vertical-align:middle;"> Open';
        modalOpenFileButton.disabled = true;
        modalOpenFileButton.style.padding = '8px 12px';
        modalOpenFileButton.onclick = () => handleModalOpen(fileType);

        const modalInsertFileButton = document.createElement('button');
        modalInsertFileButton.innerHTML = '<img src="image/icon/insert-icon.png" alt="" style="height:1em; margin-right:5px; vertical-align:middle;"> Insert';
        modalInsertFileButton.disabled = true;
        modalInsertFileButton.style.padding = '8px 12px';
        modalInsertFileButton.onclick = () => handleModalInsert(fileType);

        const modalLinkFileButton = document.createElement('button');
        modalLinkFileButton.innerHTML = '<img src="image/icon/link-icon.png" alt="" style="height:1em; margin-right:5px; vertical-align:middle;"> Link';
        modalLinkFileButton.disabled = true;
        modalLinkFileButton.style.padding = '8px 12px';
        modalLinkFileButton.onclick = () => handleModalLink(fileType);

        modalActionsDiv.appendChild(modalOpenFileButton);
        modalActionsDiv.appendChild(modalInsertFileButton);
        modalActionsDiv.appendChild(modalLinkFileButton);
        modalContent.appendChild(modalActionsDiv);

        // Tombol tutup modal bawah (Close) - Opsional
        // const closeButton = document.createElement('button');
        // ... (kode tombol close bawah jika masih diperlukan) ...

        fileListModal.appendChild(modalContent);
        makeModalResizable(modalContent); // Jadikan modal ini resizable
        document.body.appendChild(fileListModal);

        // --- LOGIKA FILTER PENCARIAN (BARU) ---
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            listItems.forEach(item => {
                // Dapatkan teks dari tombol di dalam list item
                const buttonText = item.querySelector('button')?.textContent.toLowerCase() || '';
                // Tampilkan atau sembunyikan list item berdasarkan pencocokan
                if (buttonText.includes(searchTerm)) {
                    item.style.display = ''; // Tampilkan (reset ke default)
                } else {
                    item.style.display = 'none'; // Sembunyikan
                }
            });
        });
        // --- AKHIR LOGIKA FILTER ---


        // Event listener untuk menutup modal (klik luar, Esc)
        fileListModal.addEventListener('click', (event) => {
            if (event.target === fileListModal) closeFileModal();
        });
        document.addEventListener('keydown', handleEscKeyForFileList);
    }

    // Fungsi untuk menutup modal daftar file (diganti nama dari closeModal)
    function closeFileModal() {
        if (fileListModal) {
            document.body.removeChild(fileListModal);
            fileListModal = null;
            selectedFilename = null;
            currentSelectedFileButton = null;
            document.removeEventListener('keydown', handleEscKeyForFileList);
            // Kembalikan state tombol Load utama setelah modal file ditutup
            if (loadButton) {
                loadButton.innerHTML='<img src="./image/icon/load-icon.png" alt="">Buka File</img>';
                // loadButton.textContent = HTMLAreaElement 'Buka File'; // Atau teks aslinya
                loadButton.disabled = false;
            }
        }
    }

    // Handler tombol Escape untuk modal daftar file
    function handleEscKeyForFileList(event) {
        if (event.key === 'Escape') closeFileModal();
    }
    // Pastikan fungsi-fungsi ini tidak mengganggu state `currentFilePath` dan `isModified`
    // kecuali saat file benar-benar dibuka (`handleModalOpen`).

    // --- Handler untuk Tombol Aksi di Modal (DIMODIFIKASI) ---

    // Handler Tombol 'Open' di Modal
    async function handleModalOpen(fileType) {
        if (!selectedFilename || !editor) return;
        const displayFilename = selectedFilename.includes('/') ? selectedFilename.substring(selectedFilename.lastIndexOf('/') + 1) : selectedFilename;
        editor.value = `Membuka ${displayFilename}...`;
        editor.disabled = true;
        updateSaveState(false); // Reset status modifikasi saat mulai membuka
        if (saveFileButton) saveFileButton.disabled = true; // Disable save selama loading

        try {
            const content = await fetchFileContent(selectedFilename, fileType);
            editor.value = content;
            currentFilePath = selectedFilename; // !! Set path file yang sedang dibuka
            updateSaveState(false, currentFilePath); // Update UI: tidak dimodifikasi, tampilkan nama file
            if (typeof updatePreview === 'function') updatePreview();
            localStorage.setItem('savedText', content); // Simpan ke local storage jika perlu
            closeFileModal();
        } catch (error) {
            alert(`Gagal membuka file "${displayFilename}": ${error.message}`);
            editor.value = `Gagal membuka ${displayFilename}.\n\nError: ${error.message}`;
            currentFilePath = null; // Reset path jika gagal
            updateSaveState(false); // Kembali ke status dokumen baru (tidak dimodifikasi)
        } finally {
            editor.disabled = false;
            // Pastikan tombol Load utama kembali normal jika modal ditutup karena error
            if (loadButton && !fileListModal) {
                loadButton.innerHTML='<img src="./image/icon/load-icon.png" alt="">Buka File</img>';
                //  loadButton.textContent = '<img src="./image/icon/load-icon.png" alt=""> Buka File';
                 loadButton.disabled = false;
            }
        }
    }

    // Handler Tombol 'Insert' di Modal (Tidak mengubah currentFilePath atau isModified)
    async function handleModalInsert(fileType) {
        // ... (Kode handleModalInsert Anda) ...
        if (!selectedFilename || !editor) return;
        const displayFilename = selectedFilename.includes('/') ? selectedFilename.substring(selectedFilename.lastIndexOf('/') + 1) : selectedFilename;
        editor.disabled = true;
        try {
            const contentToInsert = await fetchFileContent(selectedFilename, fileType);
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const currentText = editor.value;
            editor.value = currentText.substring(0, start) + contentToInsert + currentText.substring(end);
            editor.focus();
            editor.selectionStart = editor.selectionEnd = start + contentToInsert.length;

            if (typeof updatePreview === 'function') updatePreview();
            localStorage.setItem('savedText', editor.value);
            closeFileModal();
        } catch (error) {
            alert(`Gagal menyisipkan file "${displayFilename}": ${error.message}`);
        } finally {
            editor.disabled = false;
             if (loadButton && editor.disabled) {
                loadButton.innerHTML='<img src="./image/icon/load-icon.png" alt="">Buka File</img>';
                //  loadButton.textContent = '<img src="./image/icon/load-icon.png" alt=""> Buka File';
                 loadButton.disabled = false;
             }
        }
        // Setelah berhasil insert, konten editor berubah, jadi set modified
        if (!editor.disabled) { // Pastikan operasi fetch selesai
             updateSaveState(true, currentFilePath); // Tandai sebagai dimodifikasi
        }
    }

    // Handler Tombol 'Link' di Modal (Tidak mengubah currentFilePath atau isModified)
    function handleModalLink(fileType) {
        if (!selectedFilename || !editor) return;
        const displayFilename = selectedFilename.includes('/') ? selectedFilename.substring(selectedFilename.lastIndexOf('/') + 1) : selectedFilename;
        const filenameOnly = displayFilename.split('.')[0]; // Ambil nama tanpa ekstensi

        try {
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const currentText = editor.value;

            // Gunakan selectedFilename (yang mungkin berisi path) untuk data-filename
            // Gunakan filenameOnly (tanpa ekstensi) untuk teks link
            const linkHtml = `<a href="" class="file-link" data-filename="${escapeHtml(selectedFilename)}">${escapeHtml(filenameOnly)}</a>`;

            // --- MODIFIKASI: Gunakan document.execCommand atau insertText API jika memungkinkan ---
            // Cara sederhana:
            editor.value = currentText.substring(0, start) + linkHtml + currentText.substring(end);

            // Fokus kembali dan atur posisi kursor setelah link
            editor.focus();
            const newCursorPos = start + linkHtml.length;
            editor.selectionStart = editor.selectionEnd = newCursorPos;

            // --- HAPUS PEMANGGILAN INI ---
            // if (typeof updatePreview === 'function') updatePreview();
            // localStorage.setItem('savedText', editor.value);
            // --- AKHIR PENGHAPUSAN ---

            // Tandai bahwa konten telah dimodifikasi SETELAH berhasil insert
            updateSaveState(true, currentFilePath); // Tandai sebagai dimodifikasi

            closeFileModal(); // Tutup modal setelah berhasil

        } catch (error) {
            console.error("Error creating link:", error);
            alert(`Gagal membuat link untuk file "${displayFilename}".`);
             // Kembalikan state tombol Load jika error dan modal belum tertutup
             if (loadButton && fileListModal) {
                loadButton.innerHTML='<img src="./image/icon/load-icon.png" alt="">Buka File</img>';
                loadButton.disabled = false;
             }
        }
        // --- PINDAHKAN INI KE DALAM TRY SETELAH INSERT BERHASIL ---
        // updateSaveState(true, currentFilePath); // Tandai sebagai dimodifikasi
    }

    // Helper escapeHtml (pastikan benar)
    function escapeHtml(str) {
        if (typeof str !== 'string') return '';
        // Urutan penting: & harus pertama
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;'); // atau &apos;
    }

    // --- Event Listener untuk Editor ---
    if (editor) {
        // Gunakan variabel timeout yang sama seperti di cp.js jika memungkinkan,
        // atau buat yang baru khusus untuk file_handler jika perlu.
        let editorInputTimeout;
        editor.addEventListener('input', () => {
            // Tandai sebagai dimodifikasi
            if (!isModified) {
                updateSaveState(true, currentFilePath);
            }

            // Debounce pemanggilan updatePreview dari cp.js
            clearTimeout(editorInputTimeout);
            editorInputTimeout = setTimeout(() => {
                if (typeof updatePreview === 'function') {
                    updatePreview(); // Panggil fungsi preview dari cp.js
                }
            }, 300); // Sesuaikan delay jika perlu (samakan dengan cp.js)

             // Simpan ke localStorage saat mengetik (jika diinginkan, mungkin lebih baik di cp.js saja)
             // localStorage.setItem('savedText', editor.value);
        });
    }

    // --- Event Listener dan Logika Tombol Save ---
    if (saveFileButton) {
        saveFileButton.addEventListener('click', async () => {
            if (!isModified || !editor) return; // Jangan lakukan apa-apa jika tidak ada perubahan

            const content = editor.value;
            let filePathToSave = currentFilePath; // Gunakan path saat ini jika ada
            let isSaveAs = false;

            // 1. Cek apakah perlu "Save As" (belum ada path atau user memilih save as)
            if (!filePathToSave) {
                isSaveAs = true;
                // Minta nama file
                const firstLine = content.split('\n')[0].trim().substring(0, 50); // Ambil 50 char pertama baris 1
                let suggestedFilename = firstLine.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'dokumen_baru'; // Bersihkan karakter ilegal
                if (!suggestedFilename.toLowerCase().endsWith('.txt')) {
                    suggestedFilename += '.txt';
                }

                const filenameInput = prompt(`Simpan sebagai:\n(Nama file akan otomatis diakhiri .txt jika belum)`, suggestedFilename);
                if (filenameInput === null) return; // User membatalkan

                let filename = filenameInput.trim();
                if (!filename) {
                    alert("Nama file tidak boleh kosong.");
                    return;
                }
                // Pastikan ekstensi .txt
                if (!filename.toLowerCase().endsWith('.txt')) {
                    filename += '.txt';
                }
                // Hapus karakter ilegal tambahan (double check)
                filename = filename.replace(/[\/\\]/g, ''); // Hapus slash

                // Minta folder tujuan
                let folderChoice = '';
                while (folderChoice !== 'lagu' && folderChoice !== 'liturgi') {
                    const folderInput = prompt("Pilih folder penyimpanan:\nKetik 'lagu' atau 'liturgi'", "lagu");
                    if (folderInput === null) return; // User membatalkan
                    folderChoice = folderInput.trim().toLowerCase();
                    if (folderChoice !== 'lagu' && folderChoice !== 'liturgi') {
                        alert("Pilihan tidak valid. Harap ketik 'lagu' atau 'liturgi'.");
                    }
                }

                // Bentuk path lengkap
                filePathToSave = `lagu-liturgi/${folderChoice}/${filename}`;
            }

            // 2. Kirim data ke PHP untuk disimpan
            saveFileButton.disabled = true; // Disable tombol selama proses
            saveFileButton.innerHTML = '<img src="image/icon/loading-icon.gif" alt=""> Menyimpan...'; // Tampilkan loading

            try {
                const formData = new FormData();
                formData.append('filePath', filePathToSave);
                formData.append('content', content);

                const response = await fetch('./save_file.php', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    let errorText = `HTTP error! status: ${response.status}`;
                     try { const errorData = await response.json(); if (errorData && errorData.message) errorText += ` - ${errorData.message}`; } catch (e) { /* Abaikan */ }
                    throw new Error(errorText);
                }

                const result = await response.json();

                if (result.success) {
                    currentFilePath = filePathToSave; // Update path saat ini setelah save berhasil
                    updateSaveState(false, currentFilePath); // Update UI: tidak dimodifikasi
                    alert(`File "${result.filename || basename(filePathToSave)}" berhasil disimpan.`);
                    // Reset tombol save
                    saveFileButton.innerHTML = '<img src="image/icon/save-icon.png" alt=""> Simpan';
                    // saveFileButton.disabled tetap false karena isModified false
                } else {
                    throw new Error(result.message || 'Gagal menyimpan file di server.');
                }

            } catch (error) {
                console.error('Error saving file:', error);
                alert(`Gagal menyimpan file: ${error.message}`);
                // Kembalikan state tombol jika gagal, tapi tetap aktif karena masih modified
                saveFileButton.disabled = false; // Aktifkan lagi karena masih ada perubahan
                saveFileButton.innerHTML = '<img src="image/icon/save-icon.png" alt=""> Simpan';
            }
        });
    }

    // Helper basename (jika result.filename tidak ada)
    function basename(path) {
        return path.split(/[\\/]/).pop();
    }


    // --- Event Listeners Tombol Utama (Load, New) ---

    // Tombol 'Muat File' (Load)
    if (loadButton) {
        loadButton.addEventListener('click', () => {
            // Cek jika ada perubahan yang belum disimpan
            if (isModified) {
                if (!confirm("Ada perubahan yang belum disimpan. Yakin ingin memuat file lain? Perubahan akan hilang.")) {
                    return; // Batalkan jika user tidak yakin
                }
            }
            loadButton.textContent = 'Memilih Tipe...';
            loadButton.disabled = true;
            showLoadTypeModal();
        });
    } else { console.error('Tombol "loadButton" tidak ditemukan!'); }

    // Tombol 'Teks Baru' (New)
    if (newButton) {
        newButton.addEventListener('click', () => {
            // Cek jika ada perubahan yang belum disimpan
            if (isModified) {
                if (!confirm("Ada perubahan yang belum disimpan. Yakin ingin membuat dokumen baru? Perubahan akan hilang.")) {
                    return; // Batalkan jika user tidak yakin
                }
            }
            if (editor) {
                editor.value = '';
            }
            currentFilePath = null; // Reset path file
            updateSaveState(false); // Update UI: dokumen baru, tidak dimodifikasi
            if (typeof updatePreview === 'function') updatePreview();
            localStorage.removeItem('savedText'); // Hapus dari local storage jika perlu
            // Tutup modal jika terbuka (opsional)
            closeFileModal();
            closeLoadTypeModal();
        });
    } else { console.error('Tombol "newButton" tidak ditemukan!'); }

    // --- Inisialisasi ---
    // Muat teks terakhir dari localStorage jika ada (opsional)
    const lastSavedText = localStorage.getItem('savedText');
    if (editor && lastSavedText) {
        // editor.value = lastSavedText;
        // Anda mungkin tidak ingin memuat otomatis di sini,
        // biarkan user memilih via Load atau New.
        // Jika dimuat, tentukan apakah ini dianggap 'modified' atau tidak.
    }
    updateSaveState(false); // Set state awal saat halaman dimuat

});
