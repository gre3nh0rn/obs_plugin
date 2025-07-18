// Fungsi untuk menampilkan modal simpan
function showSaveDialog(currentContent, suggestedFilename = 'untitled.txt') {
    // Hapus modal lama jika ada
    const existingModal = document.getElementById('saveFileDialog');
    if (existingModal) {
        existingModal.remove();
    }

    // Buat elemen modal
    const modal = document.createElement('div');
    modal.id = 'saveFileDialog';
    modal.className = 'modal'; // Tambahkan kelas untuk styling CSS
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-button" onclick="this.parentElement.parentElement.remove()">&times;</button>
            <h3>Simpan File Baru</h3>
            <div class="form-group">
                <label>Simpan ke Folder:</label>
                <div>
                    <input type="radio" id="saveFolderLagu" name="saveFolder" value="lagu" checked>
                    <label for="saveFolderLagu">Lagu</label>
                </div>
                <div>
                    <input type="radio" id="saveFolderLiturgi" name="saveFolder" value="liturgi">
                    <label for="saveFolderLiturgi">Liturgi</label>
                </div>
            </div>
            <div class="form-group">
                <label for="saveFilenameInput">Nama File:</label>
                <input type="text" id="saveFilenameInput" value="${suggestedFilename}">
                <small>Ekstensi .txt akan ditambahkan jika belum ada.</small>
            </div>
            <div id="saveErrorMsg" class="error-message" style="display: none; color: red; margin-top: 10px;"></div>
            <div class="modal-actions">
                <button id="confirmSaveBtn">Simpan</button>
                <button onclick="this.closest('.modal').remove()">Batal</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block'; // Tampilkan modal

    const confirmButton = modal.querySelector('#confirmSaveBtn');
    const filenameInput = modal.querySelector('#saveFilenameInput');
    const errorMsgDiv = modal.querySelector('#saveErrorMsg');

    // Fokus ke input nama file
    filenameInput.focus();
    filenameInput.select(); // Pilih teks yang ada

    confirmButton.onclick = () => {
        const selectedFolder = modal.querySelector('input[name="saveFolder"]:checked').value;
        let filename = filenameInput.value.trim();

        errorMsgDiv.style.display = 'none'; // Sembunyikan error sebelumnya

        // --- Validasi Sederhana ---
        if (!filename) {
            errorMsgDiv.textContent = 'Nama file tidak boleh kosong.';
            errorMsgDiv.style.display = 'block';
            return;
        }

        // Pastikan diakhiri .txt (case-insensitive check)
        if (!filename.toLowerCase().endsWith('.txt')) {
            filename += '.txt';
        }

        // Ganti karakter yang tidak valid untuk nama file (contoh sederhana)
        filename = filename.replace(/[\/\?\*:"<>\|]/g, '_');

        // --- Buat Path Lengkap ---
        const fullRelativePath = `lagu-liturgi/${selectedFolder}/${filename}`;

        // --- Kirim ke Backend ---
        confirmButton.disabled = true;
        confirmButton.textContent = 'Menyimpan...';

        fetch('./save_file.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            // Kirim path lengkap dan konten
            body: `filePath=${encodeURIComponent(fullRelativePath)}&content=${encodeURIComponent(currentContent)}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Sukses: ${data.message}`); // Ganti dengan notifikasi yang lebih baik jika perlu
                // Update UI jika perlu (misalnya status file)
                document.getElementById('file-status').textContent = `File: ${data.filename}`; // Asumsi ada elemen ini
                editor.classList.remove('modified'); // Tandai sudah tidak dimodifikasi
                modal.remove(); // Tutup modal
            } else {
                errorMsgDiv.textContent = `Gagal menyimpan: ${data.message}`;
                errorMsgDiv.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error saving file:', error);
            errorMsgDiv.textContent = 'Terjadi kesalahan jaringan saat menyimpan.';
            errorMsgDiv.style.display = 'block';
        })
        .finally(() => {
            confirmButton.disabled = false;
            confirmButton.textContent = 'Simpan';
        });
    };

    // Tutup modal jika klik di luar kontennya
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.remove();
        }
    });
}

// Fungsi helper untuk menyarankan nama file (contoh: dari baris pertama)
function generateSuggestedFilename(content) {
    const firstLine = content.split('\n')[0].trim();
    // Bersihkan karakter non-alfanumerik (kecuali spasi dan strip), ganti spasi dengan _, batasi panjang
    let suggested = firstLine.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '_').substring(0, 50);
    if (!suggested) {
        suggested = 'untitled'; // Default jika baris pertama kosong atau aneh
    }
    return suggested + '.txt'; // Langsung tambahkan .txt
}

// --- Cara Menggunakan ---
// Ganti logika tombol "Simpan" Anda yang lama untuk memanggil fungsi ini:
// Misalnya, jika Anda punya tombol dengan id="saveButton" dan editor dengan id="editor"

/*
const saveButton = document.getElementById('saveButton');
const editor = document.getElementById('editor'); // Asumsi ini textarea Anda

saveButton.addEventListener('click', () => {
    const contentToSave = editor.value;
    if (!contentToSave) {
        alert('Tidak ada konten untuk disimpan.');
        return;
    }
    const suggestedName = generateSuggestedFilename(contentToSave);
    showSaveDialog(contentToSave, suggestedName);
});
*/
