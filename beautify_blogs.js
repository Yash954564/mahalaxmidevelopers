const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BLOGS_DIR = path.join(__dirname, 'blogs');

const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.html') && f !== 'blog-template.html');

files.forEach(file => {
    const filePath = path.join(BLOGS_DIR, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const $ = cheerio.load(content);

    // Skip if it's already beautified or a stub
    if ($('.blog-post-header').length) return;

    const title = $('h1').first().text() || $('title').text().split('|')[0].trim();
    const date = $('time').first().text() || 'Real Estate Insights';
    const description = $('meta[name="description"]').attr('content') || '';

    // Extract image from banner if possible
    let imageSrc = '../assets/images/nagpur-plots-hero-slide-1.webp';
    const bannerStyle = $('.page-banner').attr('style') || '';
    const imgMatch = bannerStyle.match(/url\(['"]?(.*?)['"]?\)/);
    if (imgMatch && imgMatch[1]) {
        imageSrc = imgMatch[1];
    } else {
        const firstImg = $('img').not('.footer-brand').not('.brand img').first().attr('src');
        if (firstImg) imageSrc = firstImg;
    }

    // --- RESTRUCTURE ---

    // 1. Create a Premium Header
    const premiumHeader = `
    <section class="blog-hero" style="position:relative; padding: 120px 0 80px; background: var(--bg-dark); overflow:hidden;">
        <div style="position:absolute; inset:0; opacity:0.2;">
            <img src="${imageSrc}" alt="" style="width:100%; height:100%; object-fit:cover; filter: blur(20px);">
        </div>
        <div class="container" style="position:relative; z-index:2; max-width: 800px; text-align:center;">
            <nav class="breadcrumb" style="justify-content:center; margin-bottom: 24px;">
                <a href="../index.html">Home</a> <span>/</span> <a href="../pages/blogs.html">Blogs</a> <span>/</span> <span>Post</span>
            </nav>
            <h1 class="heading-md" style="margin-bottom:16px;">${title}</h1>
            <div class="muted" style="margin-bottom:32px;">${date} · 5 min read</div>
            <img src="${imageSrc}" alt="${title}" style="width:100%; border-radius:16px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); margin-bottom: 40px;">
        </div>
    </section>
    `;

    // 2. Clean up old header/banner stuff
    $('.page-banner').remove();
    $('.breadcrumb').first().remove();
    $('h1').first().remove();
    $('time').first().remove();

    // 3. Middle CTA
    const middleCta = `
    <div class="blog-cta" style="background: rgba(186, 134, 53, 0.1); border: 1px solid var(--gold); border-radius: 12px; padding: 32px; margin: 48px 0; text-align:center;">
        <h3 style="margin-bottom: 8px;">Interested in Nagpur Real Estate?</h3>
        <p class="muted" style="margin-bottom: 24px;">We have premium NMRDA & RERA approved plots in Wardha Road, Besa, and Shankarpur.</p>
        <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
            <a class="btn btn-primary" href="tel:+917499654371">Call Now</a>
            <a class="btn btn-outline" href="https://wa.me/917499654371" style="color:var(--text)">WhatsApp Details</a>
        </div>
    </div>
    `;

    // 4. Bottom CTA
    const bottomCta = `
    <div style="margin-top: 64px; padding-top: 48px; border-top: 1px solid var(--border-light); text-align:center;">
        <h2 class="heading-sm">Take the next step towards your dream home</h2>
        <p class="muted" style="margin-bottom:32px;">Schedule a free site visit today with our experts.</p>
        <a class="btn btn-primary btn-lg" href="../pages/contact.html">Book Site Visit</a>
    </div>
    `;

    // Find a good place for the middle CTA (after the 3rd paragraph)
    const paragraphs = $('.prose p');
    if (paragraphs.length > 3) {
        $(paragraphs[Math.floor(paragraphs.length / 2)]).after(middleCta);
    } else {
        $('.prose').append(middleCta);
    }

    $('.prose').append(bottomCta);

    // Apply header
    $('main').prepend(premiumHeader);

    // Ensure the main container for prose is well-sized
    $('.prose').css({
        'max-width': '800px',
        'margin': '0 auto',
        'padding': '40px 20px'
    });

    fs.writeFileSync(filePath, $.html());
    console.log(`Beautified Blog: ${file}`);
});

console.log('All Blog Pages Beautified.');
