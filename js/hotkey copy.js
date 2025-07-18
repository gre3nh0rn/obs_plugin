// js/hotkey.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('Hotkey script loaded.');

    document.addEventListener('keydown', (event) => {
        // console.log(`Keydown event: Key='${event.key}', Target=${event.target.tagName}`);

        // 1. Periksa Fokus
        const focusedElement = document.activeElement;
        const focusedTagName = focusedElement ? focusedElement.tagName.toLowerCase() : null;
        const ignoredTags = ['textarea', 'input', 'select', 'button', 'a'];
        if (focusedTagName && ignoredTags.includes(focusedTagName)) {
            // console.log(`Focus is on ignored tag '${focusedTagName}', ignoring global hotkey.`);
            return;
        }

        // --- Mulai Logika Hotkey Global ---

        // Hanya proses hotkey panah, angka 1-9, dan 'c'/'C'
        const relevantKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'c', 'C'];
        if (!relevantKeys.includes(event.key) && !/^[1-9]$/.test(event.key)) {
            // console.log('Ignoring irrelevant key:', event.key);
            return;
        }

        // 2. Dapatkan Tab Aktif
        const activeTabButton = document.querySelector('.tab-button.active');
        if (!activeTabButton) {
            console.log('No active tab button found. Cannot process hotkey.');
            return;
        }
        const activeTabId = activeTabButton.dataset.tabId;
        if (!activeTabId) {
            console.error('Could not determine active tab ID from data-tab-id.');
            return;
        }

        let container = null;
        let itemSelector = '';

        // 3. Tentukan Kontainer dan Selector
        if (activeTabId === 'display') {
            container = document.getElementById('display-tab');
            itemSelector = '.paragraph';
        } else if (activeTabId === 'alkitab') {
            container = document.getElementById('alkitab-tab');
            container = container ? container.querySelector('#search-results') : null;
            itemSelector = '.verse-result';
        } else {
            // console.log('Hotkey not applicable for tab:', activeTabId);
            return;
        }

        if (!container) {
            console.log('Container element not found for tab:', activeTabId);
            return;
        }

        // 4. Dapatkan Item
        const items = Array.from(container.querySelectorAll(itemSelector));
        if (items.length === 0) {
            return;
        }

        // 5. Dapatkan Item Aktif Saat Ini
        const currentActive = container.querySelector(`${itemSelector}.active-group`);
        let currentIndex = currentActive ? items.indexOf(currentActive) : -1;
        let nextIndex = -1;

        // Cegah perilaku default browser *hanya* untuk hotkey yang kita tangani
        event.preventDefault();

        // 6. Logika Navigasi (Diperbaiki dan Ditambah)
        switch (event.key) {
            case 'ArrowLeft':
                console.log('Processing ArrowLeft...');
                nextIndex = (currentIndex > 0) ? currentIndex - 1 : (currentIndex === 0 ? 0 : items.length - 1);
                if (currentIndex === -1) nextIndex = items.length -1;
                break;

            case 'ArrowRight':
                console.log('Processing ArrowRight...');
                nextIndex = (currentIndex !== -1 && currentIndex < items.length - 1) ? currentIndex + 1 : currentIndex;
                 if (currentIndex === items.length - 1) nextIndex = items.length - 1;
                 if (currentIndex === -1) nextIndex = 0;
                break;

            // <<< PERUBAHAN DIMULAI: ArrowUp >>>
            case 'ArrowUp':
                console.log('Processing ArrowUp...');
                if (activeTabId === 'display') {
                    // Cari mundur untuk tag [verse 1], <ayat1>, (1), 1., [lyrics]
                    // Regex diperbarui untuk mencakup <ayat1>
                    const verseStartTags = /^\<(verse\s*1|lyrics|ayat\s*1)\>/mi;
                    let found = false;
                    const startSearchIndex = (currentIndex > 0) ? currentIndex - 1 : items.length - 1;
                    console.log(`Searching backwards for verse start tags from index ${startSearchIndex}`);

                    for (let i = startSearchIndex; i >= 0; i--) {
                        const rawText = items[i].dataset.rawText || items[i].textContent || '';
                        if (verseStartTags.test(rawText.trim())) {
                            console.log(`Verse start tag found in item ${i}`);
                            nextIndex = i;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        console.log('Verse start tag not found searching backwards. Going to first item.');
                        nextIndex = 0; // Fallback ke item pertama
                    }
                } else { // Untuk tab lain (misal: alkitab), tetap lompat ke awal
                    nextIndex = 0;
                }
                break;
            // <<< PERUBAHAN SELESAI: ArrowUp >>>

            // <<< PERUBAHAN DIMULAI: ArrowDown >>>
            case 'ArrowDown':
                console.log('Processing ArrowDown...');
                if (activeTabId === 'display') {
                    // Cari maju HANYA untuk tag [chorus] atau [reff]
                    const chorusReffTags = /^<(chorus|reff)>/mi;
                    let found = false;
                    console.log('Searching for:',chorusReffTags);
                    const startSearchIndex = (currentIndex === -1) ? 0 : currentIndex + 1;
                    console.log(`Searching forwards for chorus/reff tags from index ${startSearchIndex}`);

                    for (let i = startSearchIndex; i < items.length; i++) {
                        const rawText = items[i].dataset.rawText|| '';
                        console.log(rawText);
                        if (chorusReffTags.test(rawText.trim())) {
                            console.log(`Chorus/Reff tag found in item ${i}`);
                            nextIndex = i;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        console.log('Chorus/Reff tag not found after current index. Going to last item.');
                        nextIndex = items.length - 1; // Fallback ke item terakhir
                    }
                } else { // Untuk tab lain (misal: alkitab), tetap lompat  ke akhir
                    nextIndex = items.length - 1;
                }
                break;
            // <<< PERUBAHAN SELESAI: ArrowDown >>>

            // <<< PENAMBAHAN DIMULAI: Tombol 'c'/'C' >>>
            case 'c':
            case 'C':
                console.log('Processing C key...');
                if (activeTabId === 'display') {
                    // Cari maju untuk tag [coda] atau [bridge]
                    const codaBridgeTags =/^\<(coda|bridge)\>/mi;
                    let found = false;
                    console.log('Searching for:',codaBridgeTags);
                    const startSearchIndex = (currentIndex === -1) ? 0 : currentIndex + 1;
                    console.log(`Searching forwards for coda/bridge tags from index ${startSearchIndex}`);

                    for (let i = startSearchIndex; i < items.length; i++) {
                        const rawText = items[i].dataset.rawText || items[i].textContent || '';
                        if (codaBridgeTags.test(rawText.trim())) {
                            console.log(`Coda/Bridge tag found in item ${i}`);
                            nextIndex = i;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        console.log('Coda/Bridge tag not found after current index. Going to last item.');
                        nextIndex = items.length - 1; // Fallback ke item terakhir
                    }
                } else {
                    console.log('C key hotkey ignored on tab:', activeTabId);
                    return; // Abaikan di tab lain
                }
                break;
            // <<< PENAMBAHAN SELESAI: Tombol 'c'/'C' >>>

            default: // Angka 1-9 (Tetap mencari tag ayat N)
                if (/^[1-9]$/.test(event.key)) {
                    const digit = parseInt(event.key, 10);
                    console.log(`Processing digit ${digit} - searching for verse tag...`);

                    if (activeTabId === 'display') {
                        const verseTagRegex = new RegExp(`^(\\<verse\\s*${digit}\\>|<ayat${digit}\\>|\\(\\s*${digit}\\s*\\))`,'mi');
                        let found = false;
                        console.log(`Searching for regex:${verseTagRegex}`);

                        for (let i = 0; i < items.length; i++) {
                            const rawText = items[i].dataset.rawText || items[i].textContent || '';
                            console.log(rawText);
                            if (verseTagRegex.test(rawText.trim())) {
                                console.log(`Verse tag for digit ${digit} found in item ${i}`);
                                nextIndex = i;
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            console.log(`Verse tag for digit ${digit} not found.`);
                            // Biarkan nextIndex = -1 jika tidak ditemukan
                        }
                    } else {
                        console.log(`Digit hotkey ignored on tab '${activeTabId}'.`);
                        return;
                    }
                } else {
                    console.log('Ignoring unhandled key in switch:', event.key);
                    return;
                }
                break; // Akhir dari case default
        }

        console.log('Final calculated next index:', nextIndex);

        // 7. Aktifkan Item Berikutnya (Logika ini seharusnya sudah benar)
        if (nextIndex !== -1 && nextIndex < items.length && (nextIndex !== currentIndex || currentIndex === -1)) {
             console.log(`Attempting to activate item at index: ${nextIndex}`);
             setActiveItem(items[nextIndex], container, itemSelector);
        } else if (nextIndex !== -1 && nextIndex === currentIndex && currentIndex !== -1) {
             console.log(`Item at index ${nextIndex} is already active. Re-triggering click.`);
             // Memaksa re-trigger click pada item yang sama
             setActiveItem(items[nextIndex], container, itemSelector);
        } else {
            console.log('No valid next item to activate or index out of bounds.');
        }
    });

    // --- Fungsi setActiveItem (Tidak berubah) ---
    function setActiveItem(itemToActivate, container, itemSelector) {
        if (!itemToActivate || !container) {
            console.error('setActiveItem called with invalid item or container');
            return;
        }
        console.log('Setting active item:', itemToActivate);

        const currentActive = container.querySelector(`${itemSelector}.active-group`);
        if (currentActive && currentActive !== itemToActivate) {
            console.log('Removing active class from:', currentActive);
            currentActive.classList.remove('active-group');
        }

        if (!itemToActivate.classList.contains('active-group')) {
             itemToActivate.classList.add('active-group');
        }
        itemToActivate.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        if (typeof itemToActivate.click === 'function') {
            console.log('Simulating click on:', itemToActivate);
            itemToActivate.click();
        } else {
            console.warn('Item does not have a click function:', itemToActivate);
            const clickableChild = itemToActivate.querySelector('[onclick]');
            if (clickableChild && typeof clickableChild.click === 'function') {
                console.log('Simulating click on child:', clickableChild);
                clickableChild.click();
            } else {
                 console.warn('Could not find a clickable element within the item.');
            }
        }
    }
});

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
            //   .replace(/&/g, '&amp;')
              .replace(/&#039;/g, "'");
}