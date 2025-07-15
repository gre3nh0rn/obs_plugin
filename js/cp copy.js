        // Fungsi untuk switch tab
        /**
         * Mengalihkan ke tab yang ditentukan dan menandai tombol serta konten sebagai aktif.
         * @param {string} tabName - ID tab tujuan (misal: 'display', 'alkitab').
         * @param {HTMLElement} [clickedButton] - Tombol yang diklik (opsional, tapi direkomendasikan).
         */
        function switchTab(tabName, clickedButton) {
            console.log(`[switchTab] Called for: ${tabName}`); // Log saat fungsi dipanggil

            // 1. Hapus 'active' dari SEMUA tombol
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            // 2. Hapus 'active' dari SEMUA panel konten
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            // 3. Tambahkan 'active' ke tombol yang benar
            let targetButton = null; // Variabel untuk menyimpan tombol target
            if (clickedButton) {
                targetButton = clickedButton;
                console.log('[switchTab] Using clickedButton:', targetButton);
            } else {
                // Fallback jika tombol tidak diberikan
                const selector = `.tab-button[data-tab-id="${tabName}"]`;
                targetButton = document.querySelector(selector);
                console.log(`[switchTab] Querying for button with selector: ${selector}`, targetButton);
            }

            if (targetButton) {
                targetButton.classList.add('active');
                // *** LOG SETELAH MENAMBAHKAN KELAS ***
                console.log('[switchTab] Added "active" class to button:', targetButton, 'Classes now:', targetButton.className);
            } else {
                console.error(`[switchTab] Button for tab "${tabName}" not found.`);
            }

            // 4. Aktifkan panel konten yang sesuai
            const contentElement = document.getElementById(`${tabName}-tab`);
            if (contentElement) {
                contentElement.classList.add('active');
                console.log('[switchTab] Activated content:', contentElement);
            } else {
                console.error(`[switchTab] Content element with id="${tabName}-tab" not found.`);
            }

            // *** TAMBAHKAN PENGECEKAN INI ***
            // Cek status kelas SEGERA setelah modifikasi
            const checkButtonAgain = document.querySelector(`.tab-button[data-tab-id="${tabName}"]`);
            if (checkButtonAgain) {
                console.log(`[switchTab] IMMEDIATE CHECK: Button for ${tabName} has 'active'?`, checkButtonAgain.classList.contains('active'));
            } else {
                console.log(`[switchTab] IMMEDIATE CHECK: Button for ${tabName} not found for check.`);
            }
            // *** AKHIR PENGECEKAN TAMBAHAN ***
        }

        function toggleLeftPanel() {
            const leftPanel = document.getElementById('left-panel');
            const toggleLabel = document.querySelector('.toggle-label');
            const fileLoader = document.getElementById('file-loader');
            const editor = document.getElementById('editor');
            const preview = document.getElementById('preview');

            if (!leftPanel || !toggleLabel) return; // Guard clause

            leftPanel.classList.toggle('fullscreen');

            if (leftPanel.classList.contains('fullscreen')) {
                toggleLabel.textContent = 'EDIT...';
                if (fileLoader) fileLoader.style.display = 'none';
            } else {
                toggleLabel.textContent = 'TAMPILKAN...';
                if (fileLoader) fileLoader.style.display = 'flex';
            }

            updatePreview();
        }

        const editor = document.getElementById('editor');
        const preview = document.getElementById('preview');

        let updatePreviewTimeout;
        if (editor) {
            editor.addEventListener('input', () => {
                clearTimeout(updatePreviewTimeout);
                updatePreviewTimeout = setTimeout(updatePreview, 300); // Debounce updatePreview
                localStorage.setItem('savedText', editor.value); // Simpan teks editor untuk pemulihan
            });
        }

        window.addEventListener('load', () => {
            // Muat teks editor terakhir
            const savedEditorText = localStorage.getItem('savedText');

            if (editor && savedEditorText) {
                editor.value = savedEditorText;
                updatePreview(); // Update preview berdasarkan teks yang dimuat
            }

            // Inisialisasi style controls (sudah ada di kode Anda)
            // ... (kode inisialisasi slider, color picker, dll.) ...
            const savedStyleJSON = localStorage.getItem('lastDisplayStyle');
            const defaultFontSize = 80;
            const defaultFontColor = '#000000';
            const defaultBgColor = '#ffffff';
            const defaultOpacityValue = 50;
            const defaultOutlineWidth = '0';
            const defaultOutlineColor = '#000000';

            let currentStyle = {
                fontSize: defaultFontSize,
                fontColor: defaultFontColor,
                bgColor: defaultBgColor,
                opacity: (defaultOpacityValue / 100).toFixed(2),
                outlineWidth: defaultOutlineWidth,
                outlineColor: defaultOutlineColor
            };

            if (savedStyleJSON) {
                try {
                    const savedStyle = JSON.parse(savedStyleJSON);
                    // Gabungkan savedStyle ke currentStyle, prioritaskan nilai tersimpan
                    currentStyle = { ...currentStyle, ...savedStyle };
                } catch (e) {
                    console.error("Gagal memuat style tersimpan:", e);
                    // Gunakan default jika parse gagal
                }
            }

            // Terapkan nilai (dari saved atau default) ke kontrol UI
            try {
                document.getElementById('fontSizeSlider').value = currentStyle.fontSize;
                document.getElementById('fontSizeValue').textContent = currentStyle.fontSize + 'px';
                document.getElementById('fontColor-picker').value = currentStyle.fontColor;
                document.getElementById('bgColor-picker').value = currentStyle.bgColor;
                const opacityValue = parseFloat(currentStyle.opacity) * 100;
                document.getElementById('OpacityValueSlider').value = opacityValue;
                document.getElementById('opacity').textContent = opacityValue.toFixed(0) + '%';
                document.getElementById('outlineWidthSettingInput').value = currentStyle.outlineWidth;
                // Panggil fungsi update untuk label outline agar konsisten (None atau X.Ypx)
                updateOutlineWidth(currentStyle.outlineWidth);
                document.getElementById('outlineColorSettingInput').value = currentStyle.outlineColor;
            } catch (uiError) {
                console.error("Error applying initial style to UI controls:", uiError);
            }

            // Panggil updateStyle sekali di awal untuk memastikan nilai awal tersimpan jika belum ada
            updateStyle();

            try {
                // Memberi nama pada jendela ('liveDisplayWindow') penting
                // agar browser mencoba menggunakan kembali jendela/tab yang sama
                // jika sudah terbuka, daripada membuka yang baru setiap kali refresh.
                const displayWindowName = 'liveDisplayWindow';
                let displayWindow = window.open('browser.html', displayWindowName);
        
                // Cek apakah jendela berhasil dibuka (tidak diblokir popup blocker)
                if (!displayWindow || displayWindow.closed || typeof displayWindow.closed == 'undefined') {
                    // Jendela mungkin diblokir. Beri tahu pengguna (opsional).
                    console.warn("Jendela display ('browser.html') mungkin diblokir oleh popup blocker browser. Mohon izinkan popup untuk situs ini agar berfungsi otomatis.");
                    // Anda bisa menampilkan pesan di halaman control panel jika mau.
                    // Contoh: document.getElementById('popup-blocker-warning').style.display = 'block';
                } else {
                    console.log("Jendela display ('browser.html') berhasil dibuka atau difokuskan.");
                    // displayWindow.focus(); // Opsional: Coba bawa jendela ke depan (mungkin tidak selalu berhasil)
                }
            } catch (error) {
                console.error("Terjadi error saat mencoba membuka jendela display:", error);
                // Beri tahu pengguna tentang kemungkinan masalah (misalnya popup blocker)
            }
            
        });

        // Fungsi ini dipanggil sebelum openBrowserWindow saat paragraf di preview/display diklik
        function selectParagraph(element, index) {
            console.log("Paragraph selected:", element, "Index:", index);
            // Tentukan area asal (preview atau display-tab)
            const parentContainer = element.closest('.tab-content, #preview'); // Cari kontainer terdekat

            if (!parentContainer) {
                console.error("selectParagraph: Tidak dapat menemukan kontainer induk (.tab-content atau #preview).");
                return;
            }

            // Hapus kelas 'selected' dan 'active-group' HANYA dari paragraf di dalam kontainer yang sama
            parentContainer.querySelectorAll('.paragraph.selected').forEach(p => {
                p.classList.remove('selected');
            });
            parentContainer.querySelectorAll('.paragraph.active-group').forEach(p => {
                p.classList.remove('active-group');
            });


            // Tambahkan kelas 'selected' dan 'active-group' ke paragraf yang diklik
            element.classList.add('selected');
            element.classList.add('active-group'); // <-- TAMBAHKAN INI

            console.log(`[selectParagraph] Added .active-group to:`, element);

            // openBrowserWindow dipanggil langsung dari atribut onclick, jadi tidak perlu dipanggil di sini
        }

        // --- MODIFIKASI: Tambahkan parameter 'source' ---
        /**
         * Membuka (atau lebih tepatnya, mengirim data ke) jendela browser display.
         * @param {string} rawText Konten HTML mentah yang akan ditampilkan.
         * @param {string} source Sumber konten ('editor', 'bible', 'displayTab', 'unknown').
         */
        function openBrowserWindow(rawText, source = 'unknown') {
            console.log(`openBrowserWindow called with source: ${source}`); // Debug log
            // 1. Simpan style TERBARU ke localStorage SEBELUM mengirim teks
            updateStyle(); // Pastikan style terbaru tersimpan

            // 2. Simpan teks mentah ke localStorage
            localStorage.setItem('lastDisplayedText', rawText);

            // 3. === TAMBAHKAN INI ===
            // Simpan sumber teks ke localStorage
            localStorage.setItem('lastDisplaySource', source);
            // === AKHIR TAMBAHAN ===
        }

        // Fungsi untuk memperbarui style dan menyimpannya ke localStorage
        function updateStyle() {
            try {
                const style = {
                    fontSize: document.getElementById('fontSizeSlider').value,
                    fontColor: document.getElementById('fontColor-picker').value,
                    bgColor: document.getElementById('bgColor-picker').value,
                    opacity: (document.getElementById('OpacityValueSlider').value / 100).toFixed(2),
                    outlineWidth: document.getElementById('outlineWidthSettingInput').value,
                    outlineColor: document.getElementById('outlineColorSettingInput').value
                };
                localStorage.setItem('lastDisplayStyle', JSON.stringify(style));
                // console.log("Style updated and saved:", style); // Aktifkan jika perlu debug
            } catch (error) {
                console.error("Error updating or saving style:", error);
            }
        }

        // Fungsi update UI slider (tetap sama, pastikan memanggil updateStyle)
        function updateFontSize(value) {
            document.getElementById('fontSizeValue').textContent = value + 'px';
            updateStyle();
        }

        function updateOpacity(value) {
            document.getElementById('opacity').textContent = value + '%';
            updateStyle();
        }

        function updateOutlineWidth(value) {
            const widthValueLabel = document.getElementById('outlineWidthValue');
            const width = parseFloat(value);
            if (widthValueLabel) {
                widthValueLabel.textContent = width === 0 ? '0px' : `${width.toFixed(1)}px`;
            }
            updateStyle();
        }

        // Helper hexToRgb (tetap sama)
        function hexToRgb(hex) {
            if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return '255, 255, 255';
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `${r}, ${g}, ${b}`;
        }

        // --- Logika Pencarian Alkitab ---

        function handleSearchInput(event) {
            if (event && event.key !== 'Enter') return;
            const query = document.getElementById('search-input').value;
            const translation = document.getElementById('translation').value;
            console.log(query,translation);
            searchVerse(query, translation);
        }

        function parseQuery(query) {
            // ... (kode parseQuery Anda yang sudah ada) ...
            const results = [];
            const parts = query.split(';').map(p => p.trim()).filter(p => p);

            parts.forEach(part => {
                const regex = /([1-2]?\s?\w+)\s+(\d+):(\d+(?:-\d+)?(?:,\s*\d+(?:-\d+)?)*)/i;
                const match = part.match(regex);

                if (match) {
                    const book = match[1].trim();
                    const chapter = parseInt(match[2], 10);
                    const verseParts = match[3].split(',');

                    verseParts.forEach(vp => {
                        const trimmedVp = vp.trim();
                        if (!trimmedVp) return;

                        const rangeMatch = trimmedVp.match(/^(\d+)(?:-(\d+))?$/);
                        if (rangeMatch) {
                            const startVerse = parseInt(rangeMatch[1], 10);
                            const endVerse = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : startVerse;
                            results.push({
                                book: book,
                                chapter: chapter,
                                startVerse: startVerse,
                                endVerse: endVerse,
                                name: `${book} ${chapter}:${startVerse}${endVerse !== startVerse ? `-${endVerse}` : ''}`
                            });
                        }
                    });
                } else {
                     console.warn(`Format query tidak dikenali: "${part}"`);
                }
            });
            return results;
        }

        function searchVerse(query, translation) {
            // ... (kode searchVerse Anda yang sudah ada, pastikan onclick memanggil selectVerse) ...
            const searchResults = document.getElementById('search-results');
            if (!searchResults) {
                console.error("Kesalahan Kritis: Elemen #search-results tidak ditemukan di halaman HTML.");
                return; // Hentikan eksekusi lebih lanjut jika elemen tidak ada
            }
            
            searchResults.innerHTML = '<div class="verse-result">Mencari ayat...</div>';

            const parsedQueries = parseQuery(query);
            console.log("Parsed Queries:", parsedQueries);

            if (parsedQueries.length === 0 && query.trim() !== '') {
                 searchResults.innerHTML = '<div class="verse-result">Format pencarian tidak valid. Contoh: Yohanes 3:16</div>';
                 return;
            }
             if (parsedQueries.length === 0) {
                 searchResults.innerHTML = '';
                 return;
             }

            const promises = parsedQueries.map(q => {
                const passageQuery = `${q.book} ${q.chapter}:${q.startVerse}${q.endVerse && q.endVerse !== q.startVerse ? `-${q.endVerse}` : ''}`;
                const apiUrl = `https://alkitab.sabda.org/api/passage.php?passage=${encodeURIComponent(passageQuery)}&ver=${translation}`;
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
                console.log("Fetching:", proxyUrl);

                return fetch(proxyUrl)
                    .then(response => response.ok ? response.json() : Promise.reject(`HTTP error! status: ${response.status}`))
                    .then(data => {
                        console.log("API Response Data:", data);
                        if (data.contents) {
                            const parser = new DOMParser();
                            const xmlDoc = parser.parseFromString(data.contents, "text/xml");
                            console.log("Parsed XML:", xmlDoc);
                            const parseError = xmlDoc.querySelector("parsererror");
                            if (parseError) throw new Error("Gagal memproses respons XML.");

                            const bookElement = xmlDoc.querySelector("book");
                            const chapterElement = xmlDoc.querySelector("chapter");
                            const verseElements = xmlDoc.getElementsByTagName("verse");

                            const xmlBookName = bookElement?.getAttribute("name") || q.book;
                            const xmlChapterNum = chapterElement?.getAttribute("num") || q.chapter;
                            const chapterTitle = chapterElement?.querySelector("title")?.textContent;

                            let resultHTML = '';
                            if (verseElements.length === 0) {
                                const messageElement = xmlDoc.querySelector("message");
                                return `<div class="verse-result error">${messageElement?.textContent || 'Ayat tidak ditemukan dalam respons.'}</div>`;
                            }

                            for (let i = 0; i < verseElements.length; i++) {
                                const verseElement = verseElements[i];
                                let verseNumber = verseElement.getAttribute("num") || verseElement.getAttribute("number");
                                let verseTextContent = verseElement.textContent.trim();

                                if (!verseNumber) {
                                    const numberMatch = verseTextContent.match(/^(\d+)\s*/);
                                    if (numberMatch) {
                                        verseNumber = numberMatch[1];
                                        verseTextContent = verseTextContent.substring(numberMatch[0].length).trim();
                                    } else { verseNumber = "?"; }
                                } else {
                                     verseTextContent = verseTextContent.replace(new RegExp(`^${verseNumber}\\s*`), '').trim();
                                }

                                const contentElement = verseElement.querySelector("content, text");
                                const verseText = contentElement ? contentElement.textContent.trim() : verseTextContent;
                                const verseTitle = verseElement.querySelector("title")?.textContent.trim();
                                const displayBook = xmlBookName;
                                const displayChapter = xmlChapterNum;
                                const displayVerse = verseNumber;
                                const escapedText = verseText ? escapeHtmlForAttr(verseText) : ''; // Gunakan escape untuk JS

                                // --- Pastikan onclick memanggil selectVerse ---
                                resultHTML += `
                                  <div class="verse-result"
                                       data-book="${displayBook}" data-chapter="${displayChapter}" data-verse="${displayVerse}"
                                       onclick="selectVerse(this, '${escapeHtmlForJs(displayBook)}', '${displayChapter}', '${displayVerse}', '${escapedText}')">
                                    ${verseTitle ? `<div class="verse-title">${verseTitle}</div>` : ''}
                                    <div class="icon"><img src="image/icon/bible-icon.png" alt="Alkitab"></div>
                                    <div class="verse-text">
                                      <strong>${displayBook} ${displayChapter}:${displayVerse}</strong>
                                      <p>${verseText || 'Teks tidak tersedia'}</p>
                                    </div>
                                  </div>`;

                            }
                            if (chapterTitle) {
                                 resultHTML = `<div class="chapter-title">Pasal ${xmlChapterNum}: ${chapterTitle}</div>` + resultHTML;
                            }
                            return resultHTML;
                        } else {
                            if (data.status && (data.status.http_code >= 400 || data.status.error)) {
                                throw new Error(`Proxy error: ${data.status.error || `HTTP ${data.status.http_code}`}`);
                            }
                            return `<div class="verse-result error">Tidak ada konten diterima dari API untuk ${passageQuery}.</div>`;
                        }
                    })
                    .catch(error => {
                        console.error(`Error fetching data for ${passageQuery}:`, error);
                        return `<div class="verse-result error">Gagal mengambil data: ${error.message}</div>`;
                    });
            });

            Promise.all(promises.map(p => p.catch(e => e)))
                .then(results => {
                    let finalHtml = '';
                    let hasSuccess = false;
                    results.forEach(result => {
                        if (result instanceof Error) {
                            finalHtml += `<div class="verse-result error">${result.message}</div>`;
                        } else if (typeof result === 'string') {
                            finalHtml += result;
                            if (!result.includes('class="verse-result error"')) hasSuccess = true;
                        }
                    });

                    // Fallback logic (jika diperlukan)
                    if (!hasSuccess && query.trim() !== '' /* && typeof bibleData !== 'undefined' */) {
                         console.log("API fetch failed or returned no verses, attempting offline fallback...");
                         // ... (kode fallback Anda jika ada) ...
                         // Pastikan onclick di fallback juga memanggil selectVerse
                         // Contoh: onclick="selectVerse('${escapeHtmlForJs(book)}', '${chapter}', '${verse}', '${escapedOfflineText}')"
                         if (!finalHtml.includes('class="verse-result error"')) {
                              finalHtml = '<div class="verse-result">Ayat tidak ditemukan (online maupun offline).</div>';
                         }
                    } else if (!hasSuccess && !finalHtml.includes('class="verse-result error"')) {
                         finalHtml = '<div class="verse-result">Ayat tidak ditemukan.</div>';
                    }

                    searchResults.innerHTML = finalHtml;

                    // --- >>> PENAMBAHAN DIMULAI: Auto-select hasil ayat pertama <<< ---
                    // Tunggu sebentar agar DOM update (opsional)
                    return new Promise(resolve => setTimeout(resolve, 0)).then(() => {
                        const firstVerseResult = searchResults.querySelector('.verse-result:first-of-type'); // Cari elemen hasil pertama
                        // Pastikan elemen ada, BUKAN pesan error, dan bisa diklik
                        if (firstVerseResult && !firstVerseResult.classList.contains('error') && typeof firstVerseResult.click === 'function') {
                            console.log('Auto-selecting first Bible verse result:', firstVerseResult);
                            firstVerseResult.click(); // Simulasikan klik
                        } else {
                             if (firstVerseResult && firstVerseResult.classList.contains('error')) {
                                 console.log('First Bible result is an error message, not auto-selecting.');
                             } else {
                                 console.log('First Bible verse result not found or not clickable.');
                             }
                        }
                    });
                    // --- >>> PENAMBAHAN SELESAI <<< ---

                })
                 .catch(timeoutError => {
                     console.error("API request timed out:", timeoutError);
                     searchResults.innerHTML = `<div class="verse-result error">Waktu tunggu permintaan API habis.</div>`;
                 });
        }

        // --- MODIFIKASI: Tambahkan parameter 'element', panggil openBrowserWindow dengan source 'bible' ---
        function selectVerse(element, book, chapter, verse, text) {
            // --- TAMBAHAN: Atur kelas active-group ---
            const searchResultsContainer = element.closest('#search-results');
            if (searchResultsContainer) {
                // Hapus .active-group dari item lain di kontainer ini
                searchResultsContainer.querySelectorAll('.verse-result.active-group').forEach(vr => {
                    vr.classList.remove('active-group');
                });
            } else {
                console.warn("selectVerse: Tidak dapat menemukan kontainer #search-results.");
            }
            // Tambahkan .active-group ke elemen yang diklik
            element.classList.add('active-group');
            console.log(`[selectVerse] Added .active-group to:`, element);
            // --- AKHIR TAMBAHAN ---

            // Buat konten HTML sebagai string (logika ini tetap sama)
            const htmlContent = `<div class="icon"><img src="image/icon/bible-icon.png" alt="Alkitab"></div><div class="verse-text"><strong>${book} ${chapter}:${verse}</strong><p>${text}</p></div>`;

            // Panggil openBrowserWindow dengan source 'bible' (logika ini tetap sama)
            openBrowserWindow(htmlContent, 'bible');
        }

        // Fungsi handleVerseClick (untuk link ayat di preview)
        function handleVerseClick(verseQuery) {
            switchTab('alkitab'); // Pindah ke tab Alkitab
            document.getElementById('search-input').value = verseQuery; // Isi input pencarian
            handleSearchInput(); // Lakukan pencarian
        }

        // --- Logika untuk Link File di Preview ---
        const previewArea = document.getElementById('preview');
        const displayTabContent = document.getElementById('display-tab');

        // Pastikan displayTabContent ada dan bisa difokuskan (cek tabindex di HTML)
        if (displayTabContent && displayTabContent.getAttribute('tabindex') !== '-1') {
            console.warn("#display-tab belum memiliki tabindex='-1'. Fokus mungkin tidak bekerja.");
            // Anda bisa menambahkannya di sini jika perlu, tapi lebih baik di HTML:
            // displayTabContent.setAttribute('tabindex', '-1');
        }

        if (previewArea && displayTabContent) {
            previewArea.addEventListener('click', async (event) => {
                const linkElement = event.target.closest('a.file-link');
                if (linkElement) {
                    event.preventDefault();
                    event.stopPropagation();

                    const filename = linkElement.dataset.filename;
                    if (!filename) {
                        console.error('Link diklik tapi tidak ada data-filename.');
                        alert('Error: Tidak dapat menemukan nama file dari link.');
                        return;
                    }

                    console.log(`File link clicked: ${filename}. Fetching content...`);
                    const originalLinkText = linkElement.textContent; // Simpan teks asli
                    linkElement.textContent = `Memuat ${filename.split('/').pop()}...`; // Feedback loading

                    try {
                        // Ambil konten mentah
                        const rawFileContent = await fetchFileContent(filename);

                        // Pisahkan konten MENTAH menjadi paragraf mentah
                        // Sesuaikan pemisah ('\n\n' atau '\r\n\r\n') jika perlu
                        const rawParagraphs = rawFileContent.split('\r\n\r\n');

                        displayTabContent.innerHTML = rawParagraphs.map((rawParagraphText, index) => {
                            if (!rawParagraphText.trim()) return '';
                        
                            // --- TAMBAHKAN LOGIKA DETEKSI PENANDA ---
                            let sectionType = 'verse'; // Default
                            const rawLower = rawParagraphText.toLowerCase().trim();
                            if (rawLower.includes('[chorus]') || rawLower.includes('<chorus>') || rawLower.includes('<chorus>')) { // Sesuaikan penanda mentah Anda
                                sectionType = 'chorus';
                            } else if (rawLower.match(/^\[verse (\d+)\]/) || rawLower.match(/^<ayat(\d+)>/) || rawLower.match(/^\((\d+)\)/) || rawLower.match(/^(\d+)\./)) {
                                 // Coba ekstrak nomor ayat jika ada penanda spesifik
                                 const match = rawLower.match(/^\[verse (\d+)\]/) || rawLower.match(/^<ayat(\d+)>/) || rawLower.match(/^\((\d+)\)/) || rawLower.match(/^(\d+)\./);
                                 if (match && match[1]) {
                                     sectionType = `verse-${match[1]}`; // e.g., 'verse-1', 'verse-2'
                                 } else if (rawLower.includes('[lyrics]') || rawLower.includes('<lyrics>')) { // Penanda awal lirik/ayat 1
                                     sectionType = 'verse-1'; // Atau 'lyrics-start'
                                 }
                            } else if (rawLower.includes('[lyrics]') || rawLower.includes('<lyrics>')) { // Penanda awal lirik/ayat 1 (jika format lain)
                                 sectionType = 'verse-1'; // Atau 'lyrics-start'
                            }
                            // Tambahkan kondisi lain jika perlu (intro, bridge, dll.)
                            // --- AKHIR LOGIKA DETEKSI PENANDA ---
                        
                            // 1. Format teks mentah HANYA untuk ditampilkan di display-tab
                            const formattedParagraphForDisplay = applyFormatting(rawParagraphText);
                        
                            // 2. Escape teks MENTAH untuk dikirim via onclick
                            const escapedRawTextForOnClick = escapeHtmlForAttr(rawParagraphText);
                            
                        
                            // 3. Buat elemen:
                            //    - onclick mengirim teks MENTAH yang di-escape
                            //    - innerHTML berisi teks yang sudah diformat untuk tampilan di tab
                            const escapedRawTextForDataAttr = escapeHtmlForAttr(rawParagraphText);
                            //    - TAMBAHKAN data-section attribute
                            return `<div class="paragraph"
                                         data-section="${sectionType}"
                                         data-raw-text="${escapedRawTextForDataAttr}"
                                         onclick="selectParagraph(this, ${index}); openBrowserWindow(\`${escapedRawTextForOnClick}\`, 'displayTab')">
                                     ${formattedParagraphForDisplay}
                                     </div>`;
                        }).join('');
                        

                        // Pindah ke tab Display
                        if (typeof switchTab === 'function') {
                            // Cari tombol tab 'display' berdasarkan data attribute
                            const displayTabButton = document.querySelector('.tab-button[data-tab-id="display"]');
                            if (displayTabButton) {
                                // Panggil switchTab dengan nama tab dan elemen tombolnya
                                switchTab('display', displayTabButton);
                                console.log(`Konten "${filename}" ditampilkan dan tab Display diaktifkan.`);
                            } else {
                                console.error("Tombol tab Display tidak ditemukan untuk diaktifkan.");
                                switchTab('display'); // Fallback
                            }
                        } else {
                            console.error("Fungsi switchTab tidak ditemukan.");
                        }
                        
                        // --- >>> PENAMBAHAN DIMULAI: Auto-select paragraf pertama <<< ---
                        // Tunggu sebentar agar DOM update (opsional, tapi bisa membantu)
                        await new Promise(resolve => setTimeout(resolve, 10));

                        const firstParagraph = displayTabContent.querySelector('.paragraph:first-of-type'); // Gunakan :first-of-type untuk keamanan
                        if (firstParagraph && typeof firstParagraph.click === 'function') {
                            console.log('Auto-selecting first song paragraph:', firstParagraph);
                            firstParagraph.click(); // Simulasikan klik pada paragraf pertama

                            // --- >>> PENAMBAHAN FOKUS <<< ---
                            // Beri jeda sangat singkat agar browser selesai memproses klik & update DOM
                            await new Promise(resolve => setTimeout(resolve, 50)); // 50ms biasanya cukup

                            if (displayTabContent) {
                                console.log('Setting focus to #display-tab container.');
                                // Opsi { preventScroll: true } mencegah halaman melompat jika elemen sudah terlihat
                                displayTabContent.focus({ preventScroll: true });
                            } else {
                                console.warn('Cannot set focus, #display-tab not found.');
                            }
                            // --- >>> AKHIR PENAMBAHAN FOKUS <<< ---

                        } else {
                            console.log('First song paragraph not found or not clickable.');
                            // Jika paragraf pertama tidak ada, mungkin tetap fokuskan ke kontainer?
                            if (displayTabContent) {
                                console.log('Setting focus to #display-tab container (no first paragraph).');
                                displayTabContent.focus({ preventScroll: true });
                            }
                        }
                        // Cek status tombol SEGERA SETELAH memanggil switchTab
                        
                        const displayButtonAfterSwitch = document.querySelector('.tab-button[data-tab-id="display"]');
                        if (displayButtonAfterSwitch) {
                            console.log('[FileLinkClick] AFTER switchTab call, display button has "active"?', displayButtonAfterSwitch.classList.contains('active'));
                        } else {
                            console.log('[FileLinkClick] AFTER switchTab call, display button not found.');
                        }
                        console.log(`Konten "${filename}" ditampilkan di tab Display.`);

                    } catch (error) {
                        console.error(`Gagal memproses link untuk ${filename}:`, error);
                        alert(`Gagal menampilkan konten "${filename}": ${error.message}`);
                        displayTabContent.innerHTML = `<div class="error">Gagal memuat konten: ${error.message}</div>`;
                    } finally {
                         linkElement.textContent = originalLinkText; // Kembalikan teks link
                    }

                }
            });
        } else {
            if (!previewArea) console.error('Elemen #preview tidak ditemukan.');
            if (!displayTabContent) console.error('Elemen #display-tab tidak ditemukan.');
        }

        // Fungsi applyFormatting (pastikan ada)
        function applyFormatting(rawText) {
            const textToFormat = rawText || '';
            // Regex untuk link ayat (sebelum markdown lain agar tidak konflik)
            const verseRegex = /([1-2]?\s?\w+)\s(\d{1,3}:\d{1,3}(?:-\d{1,3})?(?:,\s*\d{1,3}(?:-\d{1,3})?)*)/g;
            return textToFormat
                .replace(verseRegex, (match) => `<span class="verse" onclick="handleVerseClick('${escapeHtmlForJs(match)}')">${match}</span>`)
                .replace(/\%(.*?)\%/g, '<span class="not-angka">$1</span>')
                .replace(/\*([\s\S]*?)\*/g, '<span class="bold">$1</span>')
                .replace(/\_([\s\S]*?)\_/g, '<span class="italic">$1</span>')
                .replace(/\#([\s\S]*?)\#/gm, '<span class="lyric">$1</span>');
        }

        // Fungsi escapeHtml untuk atribut HTML (jika diperlukan terpisah)
        function escapeHtmlForAttr(str) {
            if (typeof str !== 'string') return '';
            return str.replace(/"/g, '&quot;')
                    //   .replace(/>/g, '&gt;')
                    //   .replace(/</g, '&lt;')
                      .replace(/&/g, '&amp;')
                      .replace(/'/g, '&#039;');
        }

        // Fungsi escape untuk string di dalam JavaScript (misal, atribut onclick)
        function escapeHtmlForJs(str) {
            if (typeof str !== 'string') return '';
            return str.replace(/\\/g, '\\\\') // Escape backslash
                      .replace(/`/g, '\\`')  // Escape backtick
                      .replace(/'/g, "\\'") // Escape single quote
                      .replace(/"/g, '\\"'); // Escape double quote (opsional, tergantung konteks)
        }

        /**
         * Menangani klik pada elemen paragraf di area preview.
         * Membaca teks mentah dari data attribute dan mengirimkannya ke display.
         * @param {HTMLElement} element Elemen div.paragraph yang diklik.
         * @param {number} index Indeks paragraf.
         */
        function handlePreviewParagraphClick(element, index) {
            // 1. Panggil selectParagraph untuk efek visual (jika masih relevan)
            selectParagraph(element, index);

            // 2. Ambil teks mentah dari data attribute 'data-raw-text'
            //    Gunakan || '' sebagai fallback jika atribut tidak ada atau kosong
            const rawText = element.dataset.rawText || '';

            // 3. Panggil openBrowserWindow dengan teks mentah dan source 'editor'
            openBrowserWindow(rawText, 'editor');
        }

        // Fungsi updatePreview (membuat paragraf di #preview) - VERSI DATA ATTRIBUTE
        function updatePreview() {
            const editor = document.getElementById('editor');
            const preview = document.getElementById('preview');
            if (!editor || !preview) return;

            const rawEditorText = editor.value; // Ambil teks mentah lengkap dari editor

            // 1. Pisahkan teks MENTAH menjadi paragraf mentah
            const rawParagraphs = rawEditorText.split('\n\n'); // Atau split lain jika perlu

            preview.innerHTML = rawParagraphs.map((rawParagraphText, index) => {
                // 2. Format teks mentah paragraf INI untuk ditampilkan di preview
                //    Ini akan menghasilkan HTML dengan <span class="verse" onclick="...">, <a class="file-link" ...> dll.
                const formattedParagraphForPreview = applyFormatting(rawParagraphText);
                // 3. Escape teks MENTAH paragraf ini untuk DATA ATTRIBUTE HTML
                //    Gunakan escapeHtmlForAttr yang sesuai untuk atribut HTML.
                const escapedRawTextForDataAttr = escapeHtmlForAttr(rawParagraphText);
                // 4. Buat elemen div.paragraph:
                //    - Tambahkan atribut data-raw-text berisi teks mentah yang sudah di-escape untuk HTML.
                //    - Atribut onclick sekarang memanggil handlePreviewParagraphClick(this, index).
                //    - innerHTML berisi teks yang sudah diformat untuk tampilan preview.
                return `<div class="paragraph"
                            data-raw-text="${escapedRawTextForDataAttr}"
                            onclick="handlePreviewParagraphClick(this, ${index})">
                        ${formattedParagraphForPreview}
                        </div>`;

            }).join('');
        }

        // (Sudah dipanggil di dalam event listener 'load' setelah memuat savedText)
        // --- Event Listener untuk Slider dan Color Picker ---
        document.getElementById('fontSizeSlider')?.addEventListener('input', (e) => updateFontSize(e.target.value));
        document.getElementById('OpacityValueSlider')?.addEventListener('input', (e) => updateOpacity(e.target.value));
        document.getElementById('outlineWidthSettingInput')?.addEventListener('input', (e) => updateOutlineWidth(e.target.value));
        document.getElementById('fontColor-picker')?.addEventListener('input', updateStyle);
        document.getElementById('bgColor-picker')?.addEventListener('input', updateStyle);
        document.getElementById('outlineColorSettingInput')?.addEventListener('input', updateStyle);

        // --- Logika untuk Settings Icons (Hover di Right Panel) ---
        document.addEventListener('DOMContentLoaded', () => {
            const leftPanel = document.getElementById('left-panel');
            const rightPanel = document.getElementById('right-panel');
            const settingsIconsContainer = document.querySelector('#right-panel .settings-icons');

                // --- PENANGANAN TOGGLE UNTUK LOGO DAN TEKS ---
            const settingLogoToggle = document.getElementById('settingLogoToggle');
            const settingTextToggle = document.getElementById('settingTextToggle');
            // Mungkin Anda juga memiliki settingScreenToggle untuk 'toggleContent'
            const settingScreenToggle = document.getElementById('settingScreenToggle');

            // Fungsi helper untuk menyimpan pengaturan ke localStorage
            // Jika Anda sudah punya fungsi serupa, Anda bisa menggunakannya.
            // Fungsi ini juga akan memicu 'storage' event yang bisa didengar oleh browser.html
            function saveSettingToLocalStorage(key, value) {
                localStorage.setItem(key, value);
                console.log(`[cp.js] Setting saved: ${key} = ${value}`);
                // Browser secara otomatis akan memicu 'storage' event di tab lain
                // untuk perubahan localStorage.
            }

            // Inisialisasi dan event listener untuk Setting Screen Toggle (Global Display)
            if (settingScreenToggle) {
                // Atur status awal checkbox dari localStorage
                settingScreenToggle.checked = localStorage.getItem('toggleContent') === 'false';
                // Tambahkan event listener untuk menyimpan perubahan
                settingScreenToggle.addEventListener('change', function() {
                    saveSettingToLocalStorage('toggleContent', this.checked);
                });
            }

            // Inisialisasi dan event listener untuk Logo Gereja
            if (settingLogoToggle) {
                // Atur status awal checkbox. Defaultnya true (terlihat) jika belum ada di localStorage atau bukan 'false'.
                settingLogoToggle.checked = localStorage.getItem('settingLogoEnabled') !== 'false';
                // Tambahkan event listener untuk menyimpan perubahan
                settingLogoToggle.addEventListener('change', function() {
                    saveSettingToLocalStorage('settingLogoEnabled', this.checked);
                });
            }

            // Inisialisasi dan event listener untuk Teks/Lirik
            if (settingTextToggle) {
                // Atur status awal checkbox. Defaultnya true (terlihat) jika belum ada di localStorage atau bukan 'false'.
                settingTextToggle.checked = localStorage.getItem('settingTextEnabled') !== 'false';
                // Tambahkan event listener untuk menyimpan perubahan
                settingTextToggle.addEventListener('change', function() {
                    saveSettingToLocalStorage('settingTextEnabled', this.checked);
                });
            }
            // --- AKHIR PENANGANAN TOGGLE UNTUK LOGO DAN TEKS ---

            
            if (leftPanel && rightPanel && settingsIconsContainer) {
                let hideIconsTimeout; // Timeout untuk menyembunyikan ikon

                const showIcons = () => {
                    clearTimeout(hideIconsTimeout); // Batalkan timeout sembunyikan jika ada
                    settingsIconsContainer.classList.add('visible');
                };

                const startHideTimeout = () => {
                    clearTimeout(hideIconsTimeout); // Hapus timeout lama
                    hideIconsTimeout = setTimeout(() => {
                        // Hanya sembunyikan jika mouse TIDAK sedang di atas ikon
                        if (!settingsIconsContainer.matches(':hover')) {
                            settingsIconsContainer.classList.remove('visible');
                        }
                    }, 300); // Delay sebelum menyembunyikan (misal 300ms)
                };

                // Tampilkan saat mouse di area atas right panel
                rightPanel.addEventListener('mousemove', (event) => {
                    const panelRect = rightPanel.getBoundingClientRect();
                    const mouseY = event.clientY - panelRect.top;
                    const hoverThreshold = panelRect.height * 0.04; // Area 4% atas

                    if (mouseY <= hoverThreshold) {
                        showIcons();
                    } else {
                        // Jika mouse di luar area atas TAPI tidak sedang hover di ikon, mulai timeout
                        if (!settingsIconsContainer.matches(':hover')) {
                            startHideTimeout();
                        }
                    }
                });

                // Jaga agar tetap tampil saat mouse hover di atas ikon itu sendiri
                settingsIconsContainer.addEventListener('mouseenter', showIcons);

                // Mulai timeout untuk menyembunyikan saat mouse keluar dari ikon
                settingsIconsContainer.addEventListener('mouseleave', startHideTimeout);

                // Sembunyikan saat mouse keluar dari right panel (kecuali menuju ikon)
                rightPanel.addEventListener('mouseleave', (event) => {
                    if (!event.relatedTarget || !settingsIconsContainer.contains(event.relatedTarget)) {
                         startHideTimeout();
                    }
                });

                // Sembunyikan saat mouse masuk ke left panel
                leftPanel.addEventListener('mouseenter', () => {
                    settingsIconsContainer.classList.remove('visible');
                    clearTimeout(hideIconsTimeout); // Hapus timeout jika ada
                });

            } else {
                console.error("Elemen panel (#left-panel, #right-panel) atau container ikon (.settings-icons) tidak ditemukan.");
            }
        }); // Akhir DOMContentLoaded untuk hover ikon

// Ambil elemen-elemen dari tab setting
const settingScreenToggle = document.getElementById('settingScreenToggle');
const settingLogoToggle = document.getElementById('settingLogoToggle');
const settingTextToggle = document.getElementById('settingTextToggle');
const layoutButtons = document.querySelectorAll('.layout-button');

// Fungsi untuk menyimpan setting ke localStorage
function saveSetting(key, value) {
    try {
        localStorage.setItem(key, value);
        // Kirim event storage manual agar browser.html langsung update jika terbuka
        window.dispatchEvent(new StorageEvent('storage', {
            key: key,
            newValue: value,
            storageArea: localStorage
        }));
    } catch (e) {
        console.error("Gagal menyimpan ke localStorage:", e);
    }
}

// Fungsi untuk memuat dan menerapkan setting saat halaman control panel dibuka
function loadAndApplySettings() {

    // 1. Pengaturan Toggle
    const screenEnabled = localStorage.getItem('toggleContent') !== 'true'; // Baca dari toggleContent yang sudah ada
    const logoEnabled = localStorage.getItem('settingLogoEnabled') !== 'true'; // Default true jika null
    const textEnabled = localStorage.getItem('settingTextEnabled') !== 'true'; // Default true jika null

    if (settingScreenToggle) {
        settingScreenToggle.checked = screenEnabled;
        settingScreenToggle.addEventListener('change', () => {
            // Perhatikan: 'toggleContent' menyimpan status 'hidden', jadi nilainya terbalik
            saveSetting('toggleContent', !settingScreenToggle.checked);
            console.log('[cp.js] Global Display (settingScreenToggle) changed. toggleContent set to:', !settingScreenToggle.checked);
        });
    }

    if (settingLogoToggle) {
        settingLogoToggle.checked = logoEnabled;
        settingLogoToggle.addEventListener('change', () => {
            saveSetting('settingLogoEnabled', settingLogoToggle.checked);
            console.log('[cp.js] Logo Toggle (settingLogoToggle) changed. settingLogoEnabled set to:', settingLogoToggle.checked);
        });
    }

    if (settingTextToggle) {
        settingTextToggle.checked = textEnabled;
        settingTextToggle.addEventListener('change', () => {
            saveSetting('settingTextEnabled', settingTextToggle.checked);
            console.log('[cp.js] Text Toggle (settingTextToggle) changed. settingTextEnabled set to:', settingTextToggle.checked);
        });
    }

    // 2. Pengaturan Layout
    const currentLayout = localStorage.getItem('settingLayout') || 'fullscreen'; // Default fullscreen
    console.log('[cp.js] Initial layout from localStorage:', currentLayout);

    if (!layoutButtons || layoutButtons.length === 0) console.warn('[cp.js] Layout buttons not found!');
    console.log('[cp.js] loadAndApplySettings: Layout awal dari localStorage:', currentLayout);

    if (!layoutButtons || layoutButtons.length === 0) {
        console.warn('[cp.js] loadAndApplySettings: Tombol layout (.layout-button) tidak ditemukan!');
    } else {
        console.log(`[cp.js] loadAndApplySettings: Ditemukan ${layoutButtons.length} tombol layout.`);
    }

    layoutButtons.forEach(button => {
        const layout = button.getAttribute('data-layout');
        if (layout === currentLayout) {
            button.classList.add('active');
        }

        button.addEventListener('click', () => {
            const newLayout = button.getAttribute('data-layout');
            // Hapus kelas aktif dari semua tombol layout
            layoutButtons.forEach(btn => btn.classList.remove('active'));
            // Tambahkan kelas aktif ke tombol yang diklik
            button.classList.add('active');
            // Simpan layout yang dipilih
            saveSetting('settingLayout', newLayout);
            // Event 'storage' akan dipicu secara otomatis oleh browser untuk tab lain (browser.html)
        });
    });
}

// Panggil loadAndApplySettings setelah DOM sepenuhnya dimuat
document.addEventListener('DOMContentLoaded', () => {
    loadAndApplySettings();
});