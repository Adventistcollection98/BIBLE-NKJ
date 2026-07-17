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
    if (installBtn) installBtn.classList.add('show');
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            installBtn.classList.remove('show');
        }
    });
}

window.addEventListener('appinstalled', () => {
    console.log('✓ App installed');
    deferredPrompt = null;
});

// Online/Offline status indicator
function updateStatusIndicator() {
    const indicator = document.getElementById('statusIndicator');
    if (!indicator) return;
    
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
let currentBook = "";
let currentChapter = "";

const bookSelect = document.getElementById('bookSelect');
const chapterGrid = document.getElementById('chapter-grid'); // Linked to sidebar grid
const content = document.getElementById('content');

// Load Bible data
async function loadBibleData() {
    try {
        updateStatus('Loading Bible data...');
        
        // Try to fetch from network first
        const response = await fetch('bible-kjv.json');
        if (!response.ok) throw new Error('Network response was not ok');
        
        // Clone the response because .json() consumes the stream, 
        // and we need to pass a fresh response stream to cache.put()
        const responseClone = response.clone();
        bibleData = await response.json();
        console.log('✓ Bible data loaded from network');
        
        // Cache it immediately for offline use
        if ('caches' in window) {
            const cache = await caches.open('bible-v1');
            cache.put('bible-kjv.json', responseClone);
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

// Handle book selection -> Updates the Sidebar Chapter Grid
bookSelect.addEventListener('change', (e) => {
    currentBook = e.target.value;
    chapterGrid.innerHTML = ''; 
    content.innerHTML = '<div class="loading">Select a chapter from the grid to read.</div>';

    if (currentBook && bibleData && bibleData[currentBook]) {
        // Handle both numeric sorting for array profiles and pure key variations
        const chapters = Object.keys(bibleData[currentBook]).map(Number).sort((a, b) => a - b);
        
        chapters.forEach(chapter => {
            const btn = document.createElement('button');
            btn.className = 'chap-btn';
            btn.textContent = chapter;
            
            // Grid interaction setup
            btn.addEventListener('click', () => {
                document.querySelectorAll('.chap-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                currentChapter = chapter.toString();
                displayChapter(currentBook, currentChapter);
            });
            
            chapterGrid.appendChild(btn);
        });

        // Automatically trigger Chapter 1 for quick reading flow
        if (chapterGrid.firstChild) {
            chapterGrid.firstChild.click();
        }
    }
});

// Display chapter content
function displayChapter(book, chapter) {
    const chapterData = bibleData[book]?.[chapter];
    
    if (!chapterData) {
        content.innerHTML = '<div class="error">Chapter not found.</div>';
        return;
    }

    let html = `<div class="chapter-title"><h2>${book} ${chapter}</h2></div><hr style="border:0; border-top:1px solid #e5e5ea; margin-bottom:20px;"><div class="verses">`;

    if (Array.isArray(chapterData)) {
        chapterData.forEach((verse, index) => {
            const verseNumber = index + 1;
            html += `
                <div class="verse" style="margin-bottom: 12px; line-height: 1.7; font-size: 1.15rem;">
                    <span class="verse-number" style="font-weight: bold; color: #8e8e93; margin-right: 6px; font-size: 0.85rem; vertical-align: super;">${verseNumber}</span>
                    <span class="verse-text">${escapeHtml(verse)}</span>
                </div>
            `;
        });
    } else if (typeof chapterData === 'object') {
        Object.entries(chapterData).forEach(([verseNum, text]) => {
            html += `
                <div class="verse" style="margin-bottom: 12px; line-height: 1.7; font-size: 1.15rem;">
                    <span class="verse-number" style="font-weight: bold; color: #8e8e93; margin-right: 6px; font-size: 0.85rem; vertical-align: super;">${verseNum}</span>
                    <span class="verse-text">${escapeHtml(text)}</span>
                </div>
            `;
        });
    }

    html += '</div>';
    
    // Target the main reading viewport element or clear the page container fallback
    const mainViewport = document.getElementById('main-content') || window;
    content.innerHTML = html;
    mainViewport.scrollTo(0, 0);
    
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
    const statusEl = document.getElementById('status');
    if (statusEl) statusEl.textContent = message;
}

// Initialize on page load
window.addEventListener('load', loadBibleData);

// Log when offline/online
window.addEventListener('online', () => console.log('✓ Back online'));
window.addEventListener('offline', () => console.log('⚠ Gone offline'));