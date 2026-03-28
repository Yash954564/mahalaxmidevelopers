// Migrate legacy project pages to new sz template
const fs = require('fs');
const path = require('path');
const projectsDir = path.join(__dirname, 'projects');

// Project data extracted from legacy pages + mahalaxmiinfra.in
// We'll parse each file to extract: title, description, highlights, amenities, gallery, location, nearby, documents, videos, RERA, area, plots, address, status, thumbnail
function extractProjectData(html, filename) {
  const data = { filename };

  // Title from <h1>
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  data.rawTitle = h1 ? h1[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : filename.replace('.html', '').replace(/-/g, ' ');

  // Extract project number from filename
  const numMatch = filename.match(/(\d+)/);
  data.number = numMatch ? numMatch[1] : '';
  data.title = `Mahalaxmi Nagar ${data.number}`;

  // Status - check for completed/ongoing/upcoming  
  if (html.includes('Completed') || html.includes('completed')) data.status = 'Completed';
  else if (html.includes('Upcoming') || html.includes('upcoming')) data.status = 'Upcoming';
  else data.status = 'Ongoing';

  // RERA number
  const reraMatch = html.match(/RERA\s*(?:Number|No\.?)\s*<\/p>\s*<span[^>]*>\s*([\s\S]*?)\s*<\/span>/i);
  data.rera = reraMatch ? reraMatch[1].replace(/<[^>]*>/g, '').trim() : '';

  // Area
  const areaMatch = html.match(/Area\s*<\/p>\s*<span[^>]*>\s*([\s\S]*?)\s*<\/span>/i);
  data.area = areaMatch ? areaMatch[1].replace(/<[^>]*>/g, '').trim() : '';

  // Number of plots
  const plotsMatch = html.match(/Number of Plots\s*<\/p>\s*<span[^>]*>\s*([\s\S]*?)\s*<\/span>/i);
  data.plots = plotsMatch ? plotsMatch[1].replace(/<[^>]*>/g, '').trim() : '';

  // Site Address
  const addrMatch = html.match(/Site Address\s*<\/p>\s*<span[^>]*>\s*([\s\S]*?)\s*<\/span>/i);
  data.address = addrMatch ? addrMatch[1].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').trim() : '';

  // Description from first <p> in about section
  const descMatch = html.match(/<p class="text-base text-justify[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/p>/i);
  data.description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : `Mahalaxmi Developers launched ${data.title}. NIT/NMRDA sanctioned layout with RL.`;

  // Highlights list
  const highlightMatches = html.match(/<li data-list="bullet"[^>]*>[\s\S]*?<\/li>/gi) || [];
  data.highlights = highlightMatches.map(h => h.replace(/<[^>]*>/g, '').trim()).filter(h => h.length > 3);
  if (!data.highlights.length) {
    data.highlights = ['NIT / NMRDA sanctioned layout with RL', 'Bank finance available 75% to 80%', 'Layout fencing with entrance gate', 'All basic facilities included'];
  }

  // Amenities
  const amenityBlocks = html.match(/<h2 class="text-natural-dark text-xl[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/h2>/gi) || [];
  data.amenities = amenityBlocks.map(a => a.replace(/<[^>]*>/g, '').trim()).filter(a => a.length > 2 && a.length < 60);
  if (!data.amenities.length) {
    data.amenities = ['Internal Cement Concrete Road', 'Sewage Line', 'Electric Network', 'Garden', 'Storm Water Drainage'];
  }

  // Gallery images
  const galleryImgs = html.match(/src="([^"]*projects_images[^"]*gallery[^"]*)"/gi) || [];
  data.gallery = galleryImgs.map(g => {
    const m = g.match(/src="([^"]*)"/);
    return m ? m[1] : '';
  }).filter(Boolean);

  // Banner images
  const bannerImgs = html.match(/src="([^"]*projects_images[^"]*banner[^"]*)"/gi) || [];
  data.banners = bannerImgs.map(g => {
    const m = g.match(/src="([^"]*)"/);
    return m ? m[1] : '';
  }).filter(Boolean);

  // Map coordinates
  const mapMatch = html.match(/google\.com\/maps\?q=([\d.]+),([\d.]+)/);
  data.lat = mapMatch ? mapMatch[1] : '';
  data.lng = mapMatch ? mapMatch[2] : '';

  // Nearby locations
  const nearbyMatches = html.match(/<li>\s*([A-Z][^<]{2,50})\s*<\/li>/g) || [];
  data.nearby = nearbyMatches.map(n => n.replace(/<[^>]*>/g, '').trim()).filter(n => n.length < 50 && n.length > 2);

  // Documents
  const docMatches = html.match(/href="([^"]*documents[^"]*)"/gi) || [];
  data.documents = docMatches.map(d => {
    const m = d.match(/href="([^"]*)"/);
    return m ? m[1] : '';
  }).filter(Boolean);

  // Video IDs
  const videoMatches = html.match(/openModal\('([^']+)'\)/g) || [];
  data.videoIds = videoMatches.map(v => {
    const m = v.match(/'([^']+)'/);
    return m ? m[1] : '';
  }).filter(Boolean);

  // Thumbnail
  const thumbNum = data.number;
  const thumbFiles = fs.readdirSync(path.join(__dirname, 'assets', 'images')).filter(f => f.includes(`_thumb_`) && (f.includes(`M-${thumbNum}.`) || f.includes(`M-${thumbNum} `) || f.includes(`M-${thumbNum}-`)));
  data.thumbnail = thumbFiles.length ? `../assets/images/${thumbFiles[0]}` : (data.banners[0] || '../assets/images/nagpur-plots-hero-slide-1.webp');

  return data;
}

function buildProjectPage(data) {
  const slug = data.filename.replace('.html', '');
  const statusIcon = data.status === 'Completed' ? 'CheckCircle' : (data.status === 'Upcoming' ? 'Clock' : 'RocketLaunch');
  const bannerImg = data.banners[0] || data.thumbnail;

  const highlightsHTML = data.highlights.map(h =>
    `              <li style="display:flex;gap:12px;align-items:center"><img src="../assets/icons/CheckCircle.svg" alt="" width="20" height="20" style="filter:invert(40%) sepia(85%) saturate(300%) hue-rotate(345deg) brightness(85%) contrast(85%)">${h}</li>`
  ).join('\n');

  const amenitiesHTML = data.amenities.slice(0, 8).map(a =>
    `              <div class="amenity-item"><div><h4 style="font-size:15px">${a}</h4></div></div>`
  ).join('\n');

  const galleryHTML = data.gallery.length ? data.gallery.slice(0, 6).map(img =>
    `            <a href="${img}" style="display:block;border-radius:12px;overflow:hidden;"><img src="${img}" alt="${data.title} gallery" loading="lazy" style="width:100%;height:240px;object-fit:cover;border-radius:12px;transition:transform .3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'"></a>`
  ).join('\n') : '';

  const nearbyHTML = data.nearby.length ? data.nearby.map(n => `<li>${n}</li>`).join('\n                    ') : '';

  const documentsHTML = data.documents.length ? data.documents.map((doc, i) => {
    const docName = doc.split('/').pop().replace(/_/g, ' ').replace(/\.[^.]+$/, '').substring(0, 50);
    return `              <tr style="border-bottom:1px solid var(--border-light)">
                <td style="padding:14px 16px;font-size:14px">${docName}</td>
                <td style="padding:14px 16px"><a href="${doc}" target="_blank" download class="btn btn-outline btn-sm" style="font-size:12px">Download</a></td>
              </tr>`;
  }).join('\n') : '';

  const videosHTML = data.videoIds.length ? data.videoIds.map(vid =>
    `            <div style="position:relative;border-radius:12px;overflow:hidden;cursor:pointer" onclick="document.getElementById('videoModal').classList.add('is-open');document.getElementById('videoFrame').src='https://www.youtube.com/embed/${vid}'">
              <img src="https://img.youtube.com/vi/${vid}/hqdefault.jpg" alt="Video testimonial" loading="lazy" style="width:100%;height:220px;object-fit:cover;">
              <div class="play-btn"><svg width="20" height="20" viewBox="0 0 20 20" fill="var(--dark)"><path d="M6.5 4.5l9 5.5-9 5.5z"/></svg></div>
            </div>`
  ).join('\n') : '';

  const projectInfoHTML = (data.rera || data.area || data.plots) ? `
          <div style="background:var(--dark);border-radius:16px;padding:32px;margin:32px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;">
            ${data.rera ? `<div><p style="color:rgba(255,255,255,.6);font-size:13px;margin-bottom:4px">RERA Number</p><p style="color:#fff;font-weight:600;font-size:14px">${data.rera}</p></div>` : ''}
            ${data.area ? `<div><p style="color:rgba(255,255,255,.6);font-size:13px;margin-bottom:4px">Total Area</p><p style="color:#fff;font-weight:600">${data.area}</p></div>` : ''}
            ${data.plots ? `<div><p style="color:rgba(255,255,255,.6);font-size:13px;margin-bottom:4px">Number of Plots</p><p style="color:#fff;font-weight:600">${data.plots}</p></div>` : ''}
            ${data.address ? `<div style="grid-column:1/-1"><p style="color:rgba(255,255,255,.6);font-size:13px;margin-bottom:4px">Site Address</p><p style="color:#fff;font-weight:500;font-size:14px">${data.address}</p></div>` : ''}
          </div>` : '';

  return `<!DOCTYPE html><html lang="en"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${data.title} | Premium Plots in Nagpur | Mahalaxmi Developers</title>
  <meta name="description" content="${data.description.substring(0, 160)}">
  <meta name="keywords" content="${data.title}, plots in Nagpur, NMRDA approved plots Nagpur, ${slug.replace(/-/g, ' ')}">
  <link rel="canonical" href="https://sz.mahalaxmidevelopers.com/projects/${data.filename}">
  <meta name="robots" content="index,follow">
  <link rel="icon" href="../assets/images/mahalaxmi-infra-logo.avif" type="image/avif">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${data.title} | Mahalaxmi Developers">
  <meta property="og:description" content="${data.description.substring(0, 160)}">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Playfair+Display:ital@1&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/styles.css">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@type":"RealEstateListing","name":"${data.title}","description":"${data.description.substring(0, 160).replace(/"/g, '\\"')}","address":{"@type":"PostalAddress","addressLocality":"Nagpur","addressRegion":"Maharashtra","addressCountry":"IN"},"provider":{"@type":"Organization","name":"Mahalaxmi Developers"}}
  </script>
</head>
<body class="active-project-page">
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="header" id="header">
    <div class="container header-inner">
      <a class="brand" href="../" aria-label="Mahalaxmi Developers home"><img src="../assets/images/mahalaxmi-group-header-logo.svg" alt="Mahalaxmi Group Logo" width="120" height="40"></a>
      <nav class="nav-links" aria-label="Primary navigation"><a href="../">Home</a><a href="../pages/about.html">About</a><a href="../pages/projects.html">Projects</a><a href="../pages/blogs.html">Blogs</a><a href="../pages/contact.html">Contact</a></nav>
      <div class="nav-cta"><a class="btn btn-primary" href="../pages/contact.html#lead">Get in Touch <img src="../assets/icons/right-arrow.svg" alt="" width="16" height="16"></a></div>
      <button class="mobile-toggle" id="mobileToggle" aria-label="Open menu">&#9776;</button>
    </div>
    <div class="mobile-menu" id="mobileMenu"><a href="../">Home</a><a href="../pages/about.html">About</a><a href="../pages/projects.html">Projects</a><a href="../pages/blogs.html">Blogs</a><a href="../pages/contact.html">Contact</a><a href="tel:+917499654371">Call: +91 74996 54371</a></div>
  </header>

  <main id="main">
    <section class="hero project-layout-root" style="min-height:70vh">
      <div class="hero-media"><img class="is-active" src="${bannerImg}" alt="${data.title} overview" style="opacity:1" width="1600" height="600"></div>
      <div class="hero-overlay" style="background:linear-gradient(to top, rgba(23,17,7,0.9), transparent)"></div>
      <div class="container hero-content" style="padding-bottom:24px">
        <nav class="breadcrumb" style="margin-bottom:16px"><a href="../" style="color:#fff">Home</a> <span>/</span> <a href="../pages/projects.html" style="color:#fff">Projects</a> <span>/</span> <span>${data.title}</span></nav>
        <span class="project-status" style="position:relative;display:inline-flex;margin-bottom:12px;top:auto;right:auto"><img src="../assets/icons/${statusIcon}.svg" alt="" width="14" height="14" onerror="this.style.display='none'"> ${data.status} Project</span>
        <h1 class="heading-lg" style="color:#fff;margin-bottom:8px">${data.title.replace(/(\d+)$/, '<em class="serif-accent">$1</em>')}</h1>
        ${data.address ? `<p style="color:rgba(255,255,255,.8);font-size:16px;max-width:700px;margin-bottom:24px"><img src="../assets/icons/MapPin.svg" alt="" width="18" height="18" style="display:inline;vertical-align:bottom" onerror="this.style.display='none'"> ${data.address.substring(0, 100)}</p>` : ''}
        <div class="trust-badges">
          <span class="badge"><img src="../assets/icons/CheckCircle.svg" alt="" width="14" height="14" onerror="this.style.display='none'"> NMRDA Approved</span>
          <span class="badge"><img src="../assets/icons/CheckCircle.svg" alt="" width="14" height="14" onerror="this.style.display='none'"> Clear Title</span>
          <span class="badge"><img src="../assets/icons/CheckCircle.svg" alt="" width="14" height="14" onerror="this.style.display='none'"> 80% Bank Loan</span>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="grid grid-7-5" style="gap:48px;align-items:start">
          <div>
            <div class="sub-label"><span class="dot"></span> Overview</div>
            <h2 class="heading-sm" style="margin-bottom:16px">Project <em class="serif-accent">Details</em></h2>
            <p style="margin-bottom:16px;line-height:1.8;color:var(--text-light)">${data.description}</p>
            ${projectInfoHTML}

            <h3 style="margin-top:32px;margin-bottom:16px">Project Highlights</h3>
            <ul style="list-style:none;display:flex;flex-direction:column;gap:12px">
${highlightsHTML}
            </ul>

            <h3 style="margin-top:48px;margin-bottom:24px">Amenities</h3>
            <div class="grid grid-2" style="gap:24px">
${amenitiesHTML}
            </div>
${galleryHTML ? `
            <h3 style="margin-top:48px;margin-bottom:24px">Project Gallery</h3>
            <div class="grid grid-2" style="gap:16px">
${galleryHTML}
            </div>` : ''}
${data.lat && data.lng ? `
            <h3 style="margin-top:48px;margin-bottom:24px">Location</h3>
            <div style="border-radius:12px;overflow:hidden">
              <iframe width="100%" height="350" loading="lazy" allowfullscreen style="border:0;border-radius:12px" src="https://www.google.com/maps?q=${data.lat},${data.lng}&z=13&output=embed"></iframe>
            </div>` : ''}
${nearbyHTML ? `
            <h3 style="margin-top:48px;margin-bottom:16px">Nearby Locations</h3>
            <ul style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;padding-left:20px;color:var(--text-light);font-size:15px">
                    ${nearbyHTML}
            </ul>` : ''}
${documentsHTML ? `
            <h3 style="margin-top:48px;margin-bottom:16px">Documents</h3>
            <table style="width:100%;border-collapse:collapse">
              <thead><tr style="background:var(--dark);color:#fff"><th style="padding:14px 16px;text-align:left;border-radius:8px 0 0 0;font-size:14px">Document</th><th style="padding:14px 16px;text-align:left;border-radius:0 8px 0 0;font-size:14px">Action</th></tr></thead>
              <tbody>
${documentsHTML}
              </tbody>
            </table>` : ''}
${videosHTML ? `
            <h3 style="margin-top:48px;margin-bottom:24px">Videos</h3>
            <div class="grid grid-2" style="gap:16px">
${videosHTML}
            </div>` : ''}
          </div>

          <div style="position:sticky;top:90px" id="enquire">
            <div class="card" style="padding:28px">
              <h2 class="heading-sm" style="margin-bottom:8px">Get Layout &amp; Pricing</h2>
              <p class="muted" style="margin-bottom:24px;font-size:14px">Enter your details to receive the brochure, layout map, and exact pricing instantly.</p>
              <form id="contactForm" class="page-form" novalidate>
                <div class="field"><label for="name">Your Name</label><input id="name" name="name" autocomplete="name" placeholder="Enter your full name" required></div>
                <div class="field"><label for="phone">Phone Number</label><input id="phone" name="phone" inputmode="tel" autocomplete="tel" placeholder="10-digit mobile number" required pattern="[0-9]{10}"></div>
                <div class="field"><label for="email">Email Address</label><input id="email" name="email" type="email" autocomplete="email" placeholder="For sending brochure"></div>
                <input type="hidden" name="message" value="I am interested in ${data.title}. Please share pricing and layout map.">
                <div style="margin-top:24px;display:flex;flex-direction:column;gap:12px">
                  <button class="btn btn-primary" type="submit" style="width:100%">Download Brochure &amp; Prices</button>
                  <a class="btn btn-outline" href="#" data-wa="${slug}" style="width:100%">Get on WhatsApp</a>
                </div>
                <p class="form-status" id="contactStatus" role="status" aria-live="polite" style="margin-top:12px;text-align:center"></p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer" role="contentinfo">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="../"><img class="footer-brand" src="../assets/images/mahalaxmi-group-footer-logo.svg" alt="Mahalaxmi Group Logo" width="120" height="40" loading="lazy"></a>
          <h4 style="margin-top:24px"><span class="dot"></span> Head Office</h4>
          <p style="font-size:14px;color:rgba(255,255,255,.7);line-height:1.7">N-103, 104 Laxmivihar Apartment, Besides Hotel Airport Center Point, Wardha Road, Somalwada, Nagpur - 440025</p>
          <iframe class="footer-map" src="https://maps.google.com/maps?width=600&amp;height=400&amp;hl=en&amp;q=Laxmi%2BVihar%2BComplex%2BNo.3&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed" loading="lazy" allowfullscreen title="Office location"></iframe>
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
          <div class="footer-contact" style="display:flex;flex-direction:column;gap:8px"><a href="mailto:mahalaxmidevelopers14@gmail.com">mahalaxmidevelopers14@gmail.com</a><a href="tel:+917499654371">+91 74996 54371</a></div>
          <div style="margin-top:32px">
            <h3 style="font-family:'Playfair Display',serif;font-style:italic;font-size:28px;color:#fff;margin-bottom:16px">Stay up to date</h3>
            <form id="newsletterForm" style="display:flex;gap:12px;flex-wrap:wrap"><input type="email" name="email" placeholder="Enter your email" required style="flex:1;min-width:200px;padding:12px 14px;border:none;border-bottom:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;font-size:14px;outline:none"><button class="btn btn-primary" type="submit">Submit</button></form>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-social"><a href="https://www.youtube.com/channel/UC4bvBlUgF6CWV0B8M3P0vCQ" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><img src="../assets/icons/youtube.svg" alt="YouTube" width="24" height="24" loading="lazy"></a><a href="https://www.instagram.com/mahalaxminagpur/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><img src="../assets/icons/instagram.svg" alt="Instagram" width="24" height="24" loading="lazy"></a></div>
        <span class="footer-copy">&copy; <span id="year"></span> Mahalaxmi Developers. All rights reserved.</span>
        <span class="footer-copy"><a href="../pages/privacy.html" style="text-decoration:underline">Privacy</a> &middot; <a href="../pages/terms.html" style="text-decoration:underline">Terms</a></span>
      </div>
    </div>
  </footer>
  <div class="floaters"><a class="floater floater-call" href="tel:+917499654371" aria-label="Call us"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a class="floater floater-wa" href="#" data-wa="general" aria-label="WhatsApp us"><svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a></div>
  <div class="modal" id="leadModal" aria-hidden="true" role="dialog" aria-modal="true"><div class="modal-backdrop" data-close-modal></div><div class="modal-card"><div class="modal-head"><div class="modal-title-area"><h3>Get Project Details</h3><p class="muted" style="font-size:14px">We'll reply with pricing, approvals &amp; site visit options in 2 minutes.</p></div><button class="modal-close" type="button" aria-label="Close popup" data-close-modal>&times;</button></div><form id="modalLeadForm" class="page-form" novalidate><div class="grid grid-2" style="gap:16px;margin-bottom:0"><div class="field"><label for="mname">Name</label><input id="mname" name="name" autocomplete="name" placeholder="Your full name" required></div><div class="field"><label for="mphone">Phone</label><input id="mphone" name="phone" inputmode="tel" autocomplete="tel" placeholder="10-digit mobile" required pattern="[0-9]{10}"></div></div><div class="field"><label for="memail">Email (Optional)</label><input id="memail" name="email" type="email" autocomplete="email" placeholder="email@example.com"></div><div class="field"><label for="mmsg">Preferred Area / Message</label><textarea id="mmsg" name="message" rows="3" placeholder="I'm interested in ${data.title}..." required></textarea></div><div class="form-actions"><button class="btn btn-primary" type="submit">Send Enquiry</button><a class="btn btn-outline" href="#" data-wa="${slug}" target="_blank" rel="noopener">WhatsApp Now</a></div><p class="muted form-status" id="modalStatus" role="status" aria-live="polite" style="margin-top:12px;font-size:12px;text-align:center;"></p></form></div></div>
${data.videoIds.length ? `  <div class="video-modal" id="videoModal"><div class="modal-backdrop" onclick="this.parentElement.classList.remove('is-open');document.getElementById('videoFrame').src=''"></div><div class="video-modal-card"><button onclick="this.parentElement.parentElement.classList.remove('is-open');document.getElementById('videoFrame').src=''" style="position:absolute;top:-16px;right:-16px;width:36px;height:36px;border-radius:50%;background:var(--white);border:none;font-size:20px;cursor:pointer;box-shadow:var(--shadow)">×</button><iframe id="videoFrame" src="" allowfullscreen></iframe></div></div>` : ''}
  <script src="../js/app.js" defer></script>
</body></html>`;
}

// Process legacy project files (not the naya- ones which are already good)
const legacyFiles = fs.readdirSync(projectsDir)
  .filter(f => f.endsWith('.html') && f.startsWith('mahalaxmi-nagar-'));

let count = 0;
legacyFiles.forEach(file => {
  const filePath = path.join(projectsDir, file);
  const html = fs.readFileSync(filePath, 'utf8');
  const data = extractProjectData(html, file);
  const newPage = buildProjectPage(data);
  fs.writeFileSync(filePath, newPage);
  count++;
  console.log(`✅ ${file} (${data.title}) - ${data.highlights.length} highlights, ${data.amenities.length} amenities, ${data.gallery.length} gallery imgs`);
});

// Also handle tattva-apas.html
const tattvaPath = path.join(projectsDir, 'tattva-apas.html');
if (fs.existsSync(tattvaPath)) {
  const html = fs.readFileSync(tattvaPath, 'utf8');
  const data = extractProjectData(html, 'tattva-apas.html');
  data.title = 'Tattva Apas';
  data.number = '';
  const newPage = buildProjectPage(data);
  fs.writeFileSync(tattvaPath, newPage);
  count++;
  console.log(`✅ tattva-apas.html (Tattva Apas) - ${data.highlights.length} highlights, ${data.gallery.length} gallery imgs`);
}

console.log(`\n🎉 Rebuilt ${count} project pages with standardized template`);
