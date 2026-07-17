// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(reg => {
            console.log('✓ Service Worker registered successfully');
            updateStatus('Service Worker ready for offline access');
        })
        .catch(err => {
            console.error('✗ Service Worker registration failed:', err);
            updateStatus('Offline mode may not be available');
        });
}

// Install button for PWA
let deferredPrompt = null;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.add('show');
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        installBtn.classList.remove('show');
    }
});

window.addEventListener('appinstalled', () => {
    console.log('✓ App installed');
    deferredPrompt = null;
});

// Online/Offline status indicator
function updateStatusIndicator() {
    const indicator = document.getElementById('statusIndicator');
    if (navigator.onLine) {
        indicator.style.display = 'none';
    } else {
        indicator.style.display = 'block';
        indicator.className = 'offline-indicator';
        indicator.textContent = '🔌 You are offline - Using cached Bible data';
    }
}

window.addEventListener('online', updateStatusIndicator);
window.addEventListener('offline', updateStatusIndicator);
updateStatusIndicator();

// Bible data management
let bibleData = null;
const bookSelect = document.getElementById('bookSelect');
const chapterSelect = document.getElementById('chapterSelect');
const content = document.getElementById('content');

// Load Bible data
async function loadBibleData() {
    try {
        updateStatus('Loading Bible data...');
        
        // Try to fetch from network first
        const response = await fetch('bible-kjv.json');
        if (!response.ok) throw new Error('Network response was not ok');
        
        bibleData = await response.json();
        console.log('✓ Bible data loaded from network');
        
        // Cache it immediately for offline use
        if ('caches' in window) {
            const cache = await caches.open('bible-v1');
            cache.put('bible-kjv.json', response);
        }
    } catch (error) {
        console.warn('Network load failed, trying cache:', error);
        try {
            if ('caches' in window) {
                const cache = await caches.open('bible-v1');
                const cachedResponse = await cache.match('bible-kjv.json');
                if (cachedResponse) {
                    bibleData = await cachedResponse.json();
                    console.log('✓ Bible data loaded from cache');
                } else {
                    throw new Error('No cached Bible data');
                }
            }
        } catch (cacheError) {
            console.error('✗ Failed to load Bible data:', cacheError);
            content.innerHTML = '<div class="error">Failed to load Bible data. Please check your connection and refresh.</div>';
            updateStatus('Error: Could not load Bible data');
            return;
        }
    }

    populateBooks();
    updateStatus('Ready - Select a book to read');
}

// Populate books dropdown
function populateBooks() {
    if (!bibleData) return;

    const books = Object.keys(bibleData);
    bookSelect.innerHTML = '<option value="">Select a book...</option>';
    
    books.forEach(book => {
        const option = document.createElement('option');
        option.value = book;
        option.textContent = book;
        bookSelect.appendChild(option);
    });
}

// Handle book selection
bookSelect.addEventListener('change', (e) => {
    const selectedBook = e.target.value;
    chapterSelect.innerHTML = '<option value="">Select a chapter...</option>';
    content.innerHTML = '<div class="loading">Select a chapter to read.</div>';

    if (selectedBook && bibleData && bibleData[selectedBook]) {
        const chapters = Object.keys(bibleData[selectedBook]).map(Number).sort((a, b) => a - b);
        
        chapters.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter;
            option.textContent = `Chapter ${chapter}`;
            chapterSelect.appendChild(option);
        });
    }
});

// Handle chapter selection
chapterSelect.addEventListener('change', (e) => {
    const selectedBook = bookSelect.value;
    const selectedChapter = e.target.value;

    if (selectedBook && selectedChapter && bibleData) {
        displayChapter(selectedBook, selectedChapter);
    }
});

// Display chapter content
function displayChapter(book, chapter) {
    const chapterData = bibleData[book]?.[chapter];
    
    if (!chapterData) {
        content.innerHTML = '<div class="error">Chapter not found.</div>';
        return;
    }

    let html = `<div class="chapter-title">${book} ${chapter}</div><div class="verses">`;

    if (Array.isArray(chapterData)) {
        chapterData.forEach((verse, index) => {
            const verseNumber = index + 1;
            html += `
                <div class="verse">
                    <span class="verse-number">${verseNumber}</span>
                    <span class="verse-text">${escapeHtml(verse)}</span>
                </div>
            `;
        });
    } else if (typeof chapterData === 'object') {
        // Handle object format with verse numbers as keys
        Object.entries(chapterData).forEach(([verseNum, text]) => {
            html += `
                <div class="verse">
                    <span class="verse-number">${verseNum}</span>
                    <span class="verse-text">${escapeHtml(text)}</span>
                </div>
            `;
        });
    }

    html += '</div>';
    content.innerHTML = html;
    window.scrollTo(0, 0);
    updateStatus(`Displaying ${book} ${chapter}`);
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update status message
function updateStatus(message) {
    document.getElementById('status').textContent = message;
}

// Initialize on page load
window.addEventListener('load', loadBibleData);

// Log when offline/online
window.addEventListener('online', () => console.log('✓ Back online'));
window.addEventListener('offline', () => console.log('⚠ Gone offline'));
