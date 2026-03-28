// Rebuild individual blog pages with proper templates
const fs = require('fs');
const path = require('path');

const blogsDir = path.join(__dirname, 'blogs');
const curatedData = JSON.parse(fs.readFileSync(path.join(__dirname, 'blog_curated.json'), 'utf8'));

// Map file -> curated info
const curatedMap = {};
curatedData.forEach(b => { curatedMap[b.file] = b; });

// Hero images to cycle through
const heroImages = [
  'nagpur-plots-hero-slide-1.webp','nagpur-plots-hero-slide-2.webp','nagpur-plots-hero-slide-3.webp',
  'nagpur-plots-hero-slide-4.webp','nagpur-plots-hero-slide-5.webp'
];

function getHeroImg(index) {
  return heroImages[index % heroImages.length];
}

// Extract the actual article content from a blog file
function extractArticleContent(html) {
  // Try to get content from <article class="prose">
  let match = html.match(/<article\s+class="prose[^"]*"[^>]*>([\s\S]*?)<\/article>/i);
  if (match) return match[1];
  
  // Try content between blog-hero section end and sidebar
  match = html.match(/<\/section>\s*<section class="section">\s*<div class="container">\s*<div class="grid[^"]*"[^>]*>\s*<article[^>]*>([\s\S]*?)<\/article>/i);
  if (match) return match[1];

  // For legacy full pages, try to find main content area
  match = html.match(/<div class="blog-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  if (match) return match[1];

  // Fallback: grab everything in <main>
  match = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (match) return match[1];

  // Last resort: body content
  match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (match) return match[1];

  return html;
}

// Related blogs function
function getRelatedBlogs(currentFile, category) {
  const related = curatedData.filter(b => b.file !== currentFile);
  const sameCategory = related.filter(b => b.category === category);
  const picks = sameCategory.length >= 3 ? sameCategory.slice(0, 3) : [...sameCategory, ...related.filter(b => b.category !== category)].slice(0, 3);
  return picks;
}

function buildBlogPage(blog, index) {
  const heroImg = getHeroImg(index);
  const related = getRelatedBlogs(blog.file, blog.category);
  const slug = blog.file.replace('.html', '');
  
  // Read existing file to extract article content
  const filePath = path.join(blogsDir, blog.file);
  const existingHTML = fs.readFileSync(filePath, 'utf8');
  let articleContent = extractArticleContent(existingHTML);
  
  // Clean up the extracted content - remove duplicate CTA sections if any
  articleContent = articleContent.replace(/<div class="blog-cta"[\s\S]*?<\/div>\s*<\/div>/gi, '');

  const relatedHTML = related.map((r, ri) => `
            <a href="../blogs/${r.file}" style="text-decoration:none;color:inherit;" class="card blog-card">
              <img src="../assets/images/${getHeroImg(ri + index)}" alt="${r.title}" loading="lazy" style="height:180px;object-fit:cover;width:100%;border-radius:12px;">
              <div class="blog-meta" style="font-size:13px;color:var(--gold);margin-top:12px;font-weight:600;">${r.category}</div>
              <h3 style="font-size:17px;margin-top:8px;line-height:1.4;">${r.title}</h3>
            </a>`).join('');

  return `<!DOCTYPE html><html lang="en"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${blog.title} | Mahalaxmi Developers Blog</title>
  <meta name="description" content="${blog.desc}">
  <meta name="keywords" content="${slug.replace(/-/g, ', ')}, Nagpur plots, real estate Nagpur">
  <link rel="canonical" href="https://sz.mahalaxmidevelopers.com/blogs/${blog.file}">
  <meta name="robots" content="index,follow">
  <link rel="icon" href="../assets/images/mahalaxmi-infra-logo.avif" type="image/avif">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${blog.title}">
  <meta property="og:description" content="${blog.desc}">
  <meta property="og:url" content="https://sz.mahalaxmidevelopers.com/blogs/${blog.file}">
  <meta property="og:image" content="https://sz.mahalaxmidevelopers.com/assets/images/${heroImg}">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Playfair+Display:ital@1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/styles.css">
  <style>
    .prose h2{font-size:24px;margin:32px 0 16px;color:var(--dark);font-weight:700}
    .prose h3{font-size:20px;margin:24px 0 12px;color:var(--dark)}
    .prose p{margin-bottom:16px;font-size:16px;line-height:1.8;color:var(--text)}
    .prose ul,.prose ol{margin-bottom:24px;padding-left:20px}
    .prose li{margin-bottom:8px;line-height:1.7}
    .prose img{border-radius:8px;margin:24px 0;max-width:100%}
    .prose blockquote{padding:16px 24px;border-left:4px solid var(--gold);background:var(--bg-light);font-style:italic;margin:24px 0;border-radius:0 8px 8px 0}
    .prose a{color:var(--teal);text-decoration:underline}
    .blog-sidebar{position:sticky;top:100px}
    @media(max-width:768px){.blog-sidebar{position:static}}
  </style>
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Article","headline":"${blog.title.replace(/"/g, '\\"')}","description":"${blog.desc.replace(/"/g, '\\"')}","author":{"@type":"Organization","name":"Mahalaxmi Developers"},"publisher":{"@type":"Organization","name":"Mahalaxmi Developers","logo":{"@type":"ImageObject","url":"https://sz.mahalaxmidevelopers.com/assets/images/mahalaxmi-group-header-logo.svg"}},"datePublished":"2026-03-01","image":"https://sz.mahalaxmidevelopers.com/assets/images/${heroImg}"}
  </script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="header" id="header">
    <div class="container header-inner">
      <a class="brand" href="../index.html" aria-label="Mahalaxmi Developers home">
        <img src="../assets/images/mahalaxmi-group-header-logo.svg" alt="Mahalaxmi Group Logo" width="120" height="40">
      </a>
      <nav class="nav-links" aria-label="Primary navigation">
        <a href="../index.html">Home</a><a href="../pages/about.html">About</a><a href="../pages/projects.html">Projects</a><a href="../pages/blogs.html">Blogs</a><a href="../pages/contact.html">Contact</a>
      </nav>
      <div class="nav-cta"><a class="btn btn-primary" href="../pages/contact.html#lead">Get in Touch <img src="../assets/icons/right-arrow.svg" alt="" width="16" height="16"></a></div>
      <button class="mobile-toggle" id="mobileToggle" aria-label="Open menu">&#9776;</button>
    </div>
    <div class="mobile-menu" id="mobileMenu">
      <a href="../index.html">Home</a><a href="../pages/about.html">About</a><a href="../pages/projects.html">Projects</a><a href="../pages/blogs.html">Blogs</a><a href="../pages/contact.html">Contact</a>
      <a href="tel:+917499654371">Call: +91 74996 54371</a>
    </div>
  </header>

  <main id="main">
    <section style="position:relative;padding:100px 0 60px;background:var(--dark);overflow:hidden;color:#fff;text-align:center;">
      <div style="position:absolute;inset:0;opacity:0.15;z-index:1;">
        <img src="../assets/images/${heroImg}" alt="" style="width:100%;height:100%;object-fit:cover;filter:blur(20px);">
      </div>
      <div class="container" style="position:relative;z-index:2;max-width:800px;">
        <nav class="breadcrumb" style="justify-content:center;margin-bottom:24px;">
          <a href="../index.html" style="color:rgba(255,255,255,0.7);">Home</a> <span>/</span>
          <a href="../pages/blogs.html" style="color:rgba(255,255,255,0.7);">Blogs</a> <span>/</span>
          <span style="color:#fff;">${blog.category}</span>
        </nav>
        <div style="display:inline-block;background:var(--gold);color:#fff;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:16px;text-transform:uppercase;">${blog.category}</div>
        <h1 class="heading-md" style="margin-bottom:12px;color:#fff;">${blog.title}</h1>
        <div style="color:rgba(255,255,255,0.6);font-size:14px;margin-bottom:30px;">By Mahalaxmi Developers · March 2026 · 5 min read</div>
        <img src="../assets/images/${heroImg}" alt="${blog.title}" style="width:100%;border-radius:16px;box-shadow:var(--shadow-lg);object-fit:cover;max-height:450px;">
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="grid grid-7-5" style="gap:48px;align-items:start;">
          <article class="prose animate-in">
            ${articleContent}

            <div style="background:var(--bg-light);border-radius:16px;padding:32px;margin:40px 0;border-left:4px solid var(--gold);">
              <h3 style="margin-top:0;">Looking for verified plots?</h3>
              <p class="muted">We offer NMRDA and RERA approved plots in Nagpur's prime growth corridors.</p>
              <div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap;">
                <a class="btn btn-primary btn-sm" href="tel:+917499654371">Call Expert</a>
                <a class="btn btn-outline btn-sm" href="../pages/contact.html">Get Brochure</a>
              </div>
            </div>
          </article>

          <aside class="blog-sidebar">
            <div style="padding:24px;border:1px solid var(--border-light);border-radius:12px;">
              <h4 style="margin-bottom:16px;">Quick Links</h4>
              <ul style="display:flex;flex-direction:column;gap:12px;font-size:14px;">
                <li><a href="../pages/projects.html">Ongoing Projects</a></li>
                <li><a href="../pages/about.html">About Mahalaxmi</a></li>
                <li><a href="../pages/contact.html">Contact Us</a></li>
              </ul>
            </div>
            <div style="margin-top:32px;padding:48px 32px;background:var(--dark);color:#fff;border-radius:12px;display:flex;flex-direction:column;align-items:center;">
              <h4 style="color:#fff;margin-bottom:12px;font-size:20px;">Free Consultation</h4>
              <p style="font-size:14px;color:rgba(255,255,255,0.7);margin-bottom:24px;text-align:center;">Schedule a site visit with our experts.</p>
              <a href="tel:+917499654371" class="btn btn-primary" style="width:100%;text-align:center;">Book Now</a>
            </div>
          </aside>
        </div>
      </div>
    </section>

    <!-- Related Articles -->
    <section class="section" style="background:var(--bg-light);">
      <div class="container">
        <div class="sub-label"><span class="dot"></span> More Insights</div>
        <h2 class="heading-sm" style="margin-bottom:32px;">Related Articles</h2>
        <div class="grid grid-3">${relatedHTML}
        </div>
      </div>
    </section>
  </main>

  <footer class="footer" role="contentinfo">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="../index.html" aria-label="Mahalaxmi Developers home"><img class="footer-brand" src="../assets/images/mahalaxmi-group-footer-logo.svg" alt="Mahalaxmi Group Logo" width="120" height="40" loading="lazy"></a>
          <h4 style="margin-top:24px"><span class="dot"></span> Head Office</h4>
          <p style="font-size:14px;color:rgba(255,255,255,.7);line-height:1.7">N-103, 104 Laxmivihar Apartment, Besides Hotel Airport Center Point, Wardha Road, Somalwada, Nagpur - 440025</p>
          <iframe class="footer-map" src="https://maps.google.com/maps?width=600&amp;height=400&amp;hl=en&amp;q=Laxmi%2BVihar%2BComplex%2BNo.3&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen title="Office location"></iframe>
        </div>
        <div>
          <h4><span class="dot"></span> Quick Links</h4>
          <div class="footer-columns">
            <nav class="footer-links"><a href="../pages/about.html">About</a><a href="../pages/projects.html">Projects</a><a href="../pages/blogs.html">Blogs</a><a href="../pages/contact.html">Contact</a></nav>
            <nav class="footer-links"><a href="../plots/plots-in-manish-nagar/">Plots in Manish Nagar</a><a href="../plots/plots-in-besa/">Plots in Besa</a><a href="../plots/plots-in-beltarodi/">Plots in Beltarodi</a><a href="../plots/plots-on-wardha-road/">Plots on Wardha Road</a></nav>
          </div>
        </div>
        <div>
          <h4><span class="dot"></span> Contact Us</h4>
          <div class="footer-contact" style="display:flex;flex-direction:column;gap:8px">
            <a href="mailto:mahalaxmidevelopers14@gmail.com">mahalaxmidevelopers14@gmail.com</a>
            <a href="tel:+917499654371">+91 74996 54371</a>
          </div>
          <div style="margin-top:32px">
            <h3 style="font-family:'Playfair Display',serif;font-style:italic;font-size:28px;color:#fff;margin-bottom:16px">Stay up to date</h3>
            <form id="newsletterForm" style="display:flex;gap:12px;flex-wrap:wrap">
              <input type="email" name="email" placeholder="Enter your email" required style="flex:1;min-width:200px;padding:12px 14px;border:none;border-bottom:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;font-size:14px;outline:none">
              <button class="btn btn-primary" type="submit">Submit</button>
            </form>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-social">
          <a href="https://www.youtube.com/channel/UC4bvBlUgF6CWV0B8M3P0vCQ" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><img src="../assets/icons/youtube.svg" alt="YouTube" width="24" height="24" loading="lazy"></a>
          <a href="https://www.instagram.com/mahalaxminagpur/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><img src="../assets/icons/instagram.svg" alt="Instagram" width="24" height="24" loading="lazy"></a>
        </div>
        <span class="footer-copy">&copy; <span id="year"></span> Mahalaxmi Developers. All rights reserved.</span>
        <span class="footer-copy"><a href="../pages/privacy.html" style="text-decoration:underline">Privacy</a> &middot; <a href="../pages/terms.html" style="text-decoration:underline">Terms</a></span>
      </div>
    </div>
  </footer>

  <div class="floaters">
    <a class="floater floater-call" href="tel:+917499654371" aria-label="Call us"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
    <a class="floater floater-wa" href="#" data-wa="general" aria-label="WhatsApp us"><svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
  </div>

  <div class="modal" id="leadModal" aria-hidden="true" role="dialog" aria-modal="true">
    <div class="modal-backdrop" data-close-modal></div>
    <div class="modal-card">
      <div class="modal-head">
        <div class="modal-title-area"><h3>Get Project Details</h3><p class="muted" style="font-size:14px">We'll reply with pricing, approvals &amp; site visit options in 2 minutes.</p></div>
        <button class="modal-close" type="button" aria-label="Close popup" data-close-modal>&times;</button>
      </div>
      <form id="modalLeadForm" class="page-form" novalidate>
        <div class="grid grid-2" style="gap:16px;margin-bottom:0">
          <div class="field"><label for="mname">Name</label><input id="mname" name="name" autocomplete="name" placeholder="Your full name" required></div>
          <div class="field"><label for="mphone">Phone</label><input id="mphone" name="phone" inputmode="tel" autocomplete="tel" placeholder="10-digit mobile" required pattern="[0-9]{10}"></div>
        </div>
        <div class="field"><label for="memail">Email (Optional)</label><input id="memail" name="email" type="email" autocomplete="email" placeholder="email@example.com"></div>
        <div class="field"><label for="mmsg">Preferred Area / Message</label><textarea id="mmsg" name="message" rows="3" placeholder="I'm interested in plots..." required></textarea></div>
        <div class="form-actions">
          <button class="btn btn-primary" type="submit">Send Enquiry</button>
          <a class="btn btn-outline" href="#" data-wa="general" target="_blank" rel="noopener">WhatsApp Now</a>
        </div>
        <p class="muted form-status" id="modalStatus" role="status" aria-live="polite" style="margin-top:12px;font-size:12px;text-align:center;"></p>
      </form>
    </div>
  </div>

  <script src="../js/app.js" defer></script>
</body></html>`;
}

// Process all curated blogs
let count = 0;
curatedData.forEach((blog, index) => {
  const filePath = path.join(blogsDir, blog.file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${blog.file} - file not found`);
    return;
  }
  const fullPage = buildBlogPage(blog, index);
  fs.writeFileSync(filePath, fullPage);
  count++;
});

console.log(`✅ Rebuilt ${count} individual blog pages with full template`);
