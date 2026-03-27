const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BLOGS_DIR = path.join(__dirname, 'blogs');
const BLOGS_HTML_FILE = path.join(__dirname, 'pages', 'blogs.html');

const excludedKeywords = [
    'about-us', 'contact', 'complete-projects', 'ongoing-projects', 'upcoming-projects',
    'mahalaxmi-nagar', 'tattva-apas', 'reviews-residential-plots', 'mahalaxmi-developers-residential-plots'
];

const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.html') && f !== 'blog-template.html');

const blogData = [];

files.forEach(file => {
    // Skip non-blog pages
    const isExcluded = excludedKeywords.some(kw => file.includes(kw));
    if (isExcluded) return;

    const content = fs.readFileSync(path.join(BLOGS_DIR, file), 'utf-8');
    const $ = cheerio.load(content);
    
    // Fallback parsing for our generated files
    const title = $('h1').first().text() || $('title').text() || file;
    const desc = $('meta[name="description"]').attr('content') || '';
    const dateStr = $('time').text() || 'Real Estate Insights';
    
    // Extract background image from section.page-banner
    // style="background: linear-gradient(...), url('../assets/images/IMAGE_NAME') ..."
    let imageSrc = '../assets/images/Crafting.png';
    const bannerStyle = $('.page-banner').attr('style') || '';
    const imgMatch = bannerStyle.match(/url\(['"]?(.*?)['"]?\)/);
    if (imgMatch && imgMatch[1]) {
        imageSrc = imgMatch[1];
    } else {
        // some don't have banner style if they weren't migrated with the full template (e.g., the hand-stubbed ones)
        // check for og:image or first image in card
        const firstImg = $('img').first().attr('src');
        if (firstImg) {
            imageSrc = firstImg;
        }
    }

    // calculate read time based on word count of prose
    const textContent = $('.prose').text() || $('body').text();
    const wordCount = textContent.split(/\s+/).length;
    const readTime = Math.max(2, Math.ceil(wordCount / 200)) + ' min read';

    const category = desc.toLowerCase().includes('legal') || desc.toLowerCase().includes('document') ? 'Legal & Documentation' : 
                     (desc.toLowerCase().includes('loan') || desc.toLowerCase().includes('finance') ? 'Finance' : 'Buying Guide');

    blogData.push({
        file: file,
        title: title.split('|')[0].trim(), // clean title
        desc: desc,
        date: dateStr,
        image: imageSrc,
        readTime: readTime,
        category: category
    });
});

// Now inject into pages/blogs.html
const blogsHtmlContent = fs.readFileSync(BLOGS_HTML_FILE, 'utf-8');
const $page = cheerio.load(blogsHtmlContent);

// Clear existing cards
$page('.blog-card').remove();

// Insert new cards
blogData.forEach(blog => {
    const cardHtml = `
          <article class="card blog-card animate-in">
            <img src="${blog.image}" alt="${blog.title}" loading="lazy" style="height: 240px; object-fit: cover; width: 100%;">
            <div class="blog-meta" style="font-size: 13px; color: var(--gold); margin-top: 16px; margin-bottom: 8px;">${blog.category} · ${blog.date} · ${blog.readTime}</div>
            <h3 style="margin-bottom: 8px;"><a href="../blogs/${blog.file}" style="text-decoration: none; color: inherit;">${blog.title}</a></h3>
            <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${blog.desc}</p>
            <a href="../blogs/${blog.file}" style="margin-top:auto;display:inline-flex;align-items:center;gap:4px;color:var(--gold);font-weight:600;font-size:14px; text-decoration: none;">Read Article <img src="../assets/icons/right-arrow.svg" alt="" width="12" height="12"></a>
          </article>
    `;
    $page('.grid-3').append(cardHtml);
});

// To implement pagination, we'll just write the cards and add a data attribute, and a quick inline script or update the pagination DOM.
// Let's add an id to the grid
$page('.grid-3').attr('id', 'blogsGrid');

// Update pagination controls
$page('.pagination-container').remove(); // if it exists
$page('.grid-3').after(`
<div class="pagination-container" style="margin-top:48px;text-align:center">
    <p class="muted" id="pageIndicator" style="margin-bottom: 16px;">Showing page 1</p>
    <div id="paginationControls" style="display:inline-flex;gap:8px">
    </div>
</div>
<script>
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('#blogsGrid .blog-card');
    const cardsPerPage = 9;
    const totalPages = Math.ceil(cards.length / cardsPerPage);
    const paginationControls = document.getElementById('paginationControls');
    const pageIndicator = document.getElementById('pageIndicator');
    
    function showPage(page) {
        cards.forEach((card, index) => {
            if (index >= (page - 1) * cardsPerPage && index < page * cardsPerPage) {
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
            } else {
                card.style.display = 'none';
            }
        });
        
        pageIndicator.textContent = \`Showing page \${page} of \${totalPages}\`;
        
        // Update buttons
        paginationControls.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn ' + (i === page ? 'btn-primary' : 'btn-outline');
            btn.style.padding = '8px 16px';
            if (i !== page) {
                btn.style.color = 'var(--text)';
            }
            btn.textContent = i;
            btn.onclick = () => showPage(i);
            paginationControls.appendChild(btn);
        }
        
        window.scrollTo({ top: document.getElementById('blogsGrid').offsetTop - 100, behavior: 'smooth' });
    }
    
    if (cards.length > 0) {
        showPage(1);
    } else {
        pageIndicator.textContent = 'No articles found.';
    }
});
</script>
`);

// The previous version had some static pagination html, let's remove it
$page('div:contains("Showing page 1 of 3")').closest('div').remove();

fs.writeFileSync(BLOGS_HTML_FILE, $page.html());
console.log('Successfully generated pages/blogs.html with ' + blogData.length + ' blogs.');
