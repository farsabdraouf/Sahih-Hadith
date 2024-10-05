// تغيير هنا: استخدام مسار نسبي بدلاً من URL ثابت
const API_BASE_URL = '/v1';
let currentFilter = '0';

document.addEventListener('DOMContentLoaded', function() {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
        document.body.classList.add('dark-mode');
    }

    document.getElementById('searchForm').addEventListener('submit', performSearch);
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', function() {
            currentFilter = this.dataset.filter;
            document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            performSearch(event);
        });
    });

    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Add scroll-to-top functionality
    const scrollToTopBtn = document.getElementById('scrollToTop');
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 100) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

async function performSearch(e) {
    e.preventDefault();
    const searchQuery = document.getElementById('searchInput').value;
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const resultsEl = document.getElementById('results');

    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    resultsEl.innerHTML = '';

    const filterParam = currentFilter.split(',').map(f => `d[]=${f}`).join('&');
    const apiUrl = `${API_BASE_URL}/site/hadith/search?value=${encodeURIComponent(searchQuery)}&${filterParam}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('فشل في جلب البيانات');
        }
        const data = await response.json();
        displayResults(data.data);
    } catch (err) {
        errorEl.textContent = 'حدث خطأ أثناء جلب البيانات. يرجى المحاولة مرة أخرى.';
        errorEl.style.display = 'block';
    } finally {
        loadingEl.style.display = 'none';
    }
}

function displayResults(hadiths) {
    const resultsEl = document.getElementById('results');
    if (hadiths.length === 0) {
        resultsEl.innerHTML = '<p>لم يتم العثور على نتائج. حاول البحث عن حديث آخر.</p>';
        return;
    }

    const hadithsHtml = hadiths.map(hadith => `
        <div class="hadith-card">
            <div class="hadith-text">${hadith.hadith}</div>
            <div class="hadith-info">
                <p><strong>الراوي:</strong> ${hadith.rawi}</p>
                <p><strong>المحدث:</strong> ${hadith.mohdith}</p>
                <p><strong>الكتاب:</strong> ${hadith.book}</p>
                <p><strong>الدرجة:</strong> ${hadith.grade}</p>
            </div>
            ${hadith.hasSharhMetadata ? `<button class="sharh-button" onclick="showSharh('${hadith.sharhMetadata.id}')">عرض الشرح</button>` : ''}
        </div>
    `).join('');

    resultsEl.innerHTML = hadithsHtml;
}

async function showSharh(sharhId) {
    const modal = document.getElementById('sharhModal');
    const sharhContent = document.getElementById('sharhContent');
    modal.style.display = 'block';

    try {
        const response = await fetch(`${API_BASE_URL}/site/sharh/${sharhId}`);
        if (!response.ok) {
            throw new Error('فشل في جلب الشرح');
        }
        const data = await response.json();
        sharhContent.innerHTML = data.data.sharhMetadata.sharh || 'لا يوجد شرح متاح.';
    } catch (err) {
        sharhContent.innerHTML = 'حدث خطأ أثناء جلب الشرح. يرجى المحاولة مرة أخرى.';
    }
}

document.querySelector('.close').onclick = function() {
    document.getElementById('sharhModal').style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == document.getElementById('sharhModal')) {
        document.getElementById('sharhModal').style.display = 'none';
    }
}