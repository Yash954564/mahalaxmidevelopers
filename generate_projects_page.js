const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const PROJECTS_DIR = path.join(__dirname, 'projects');
const PROJECTS_HTML_FILE = path.join(__dirname, 'pages', 'projects.html');

const files = fs.readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.html'));

const projectData = [];

files.forEach(file => {
    const content = fs.readFileSync(path.join(PROJECTS_DIR, file), 'utf-8');
    const $ = cheerio.load(content);
    
    let title = '';
    // Look for h1 in the about section
    const h1 = $('h1').first();
    if (h1.length) {
        // extract text, removing extra spaces
        title = h1.text().replace(/\s+/g, ' ').trim();
    } else {
        title = $('title').text().split('|')[0].trim() || file.replace('.html', '').replace(/-/g, ' ');
    }

    // Determine status based on numbering or name
    let status = 'Completed';
    const numMatch = title.match(/\d+/);
    if (numMatch) {
        const num = parseInt(numMatch[0]);
        if (num >= 40 && num < 50) status = 'Ongoing';
        if (num >= 50) status = 'Upcoming';
    } else {
        if (title.toLowerCase().includes('tattva')) status = 'Ongoing';
        if (title.toLowerCase().includes('upcoming')) status = 'Upcoming';
    }

    // Extract image
    let imageSrc = '../assets/images/mahalaxmi-naya-45-thumbnail.jpg'; // fallback
    const heroImg = $('.swiper-slide img').first().attr('src') || $('img').first().attr('src');
    if (heroImg && heroImg.includes('assets/legacy/images/')) {
        imageSrc = heroImg;
    }

    // Extract description (first meaningful paragraph)
    let desc = 'Premium plotted development by Mahalaxmi Group. Experience premium living.';
    const p = $('p.text-justify').first().text() || $('p').filter((i, el) => $(el).text().length > 20 && !$(el).text().includes('©')).first().text();
    if (p && p.trim().length > 10) {
        desc = p.replace(/\s+/g, ' ').trim().substring(0, 150) + '...';
    }

    // Extract location
    let location = 'Nagpur, Maharashtra';
    // looking for location text
    const locationDiv = $('label[for="Location"]').parent().parent().find('.text-gray-500').first().text() || '';
    if (locationDiv.toLowerCase().includes('wardha')) location = 'Near Wardha Road';
    else if (title.toLowerCase().includes('gumgaon')) location = 'Gumgaon, Nagpur';
    else if (title.toLowerCase().includes('shankarpur')) location = 'Near Manish Nagar';
    else if (title.toLowerCase().includes('besa')) location = 'Besa, Nagpur';
    
    projectData.push({
        file: file,
        title: title,
        desc: desc,
        status: status,
        image: imageSrc,
        location: location
    });
});

// Sort by ongoing and upcoming first
projectData.sort((a, b) => {
    const order = { 'Ongoing': 1, 'Upcoming': 2, 'Completed': 3 };
    return order[a.status] - order[b.status];
});

const htmlContent = fs.readFileSync(PROJECTS_HTML_FILE, 'utf-8');
const $page = cheerio.load(htmlContent);

$page('.project-card').remove(); // clear existing main grid

let htmlStr = '';
projectData.forEach(proj => {
    let badgeColor = proj.status === 'Upcoming' ? 'style="background:var(--gold)"' : (proj.status === 'Completed' ? 'style="background:var(--teal)"' : '');
    
    htmlStr += `
          <article class="card project-card animate-in" data-status="${proj.status}" style="display:flex; flex-direction:column;">
            <span class="project-status" ${badgeColor}><img src="../assets/icons/RocketLaunch.svg" alt="" width="14" height="14"> ${proj.status}</span>
            <img class="card-thumb" src="${proj.image}" alt="${proj.title}" loading="lazy" style="height: 260px; object-fit: cover; width: 100%;">
            <h3 style="margin-top: 16px;">${proj.title}</h3>
            <p style="margin-bottom: 16px; color: var(--muted);">${proj.desc}</p>
            <div class="project-location" style="margin-bottom: 16px;"><img src="../assets/icons/MapPin.svg" alt="" width="18" height="18"> ${proj.location}</div>
            <div class="card-actions" style="margin-top: auto;"><a class="btn btn-primary" href="../projects/${proj.file}">Know More</a></div>
          </article>
    `;
});

$page('#projectsGrid').append(htmlStr);

// Remove the hardcoded 'Completed Projects' section to avoid duplication
const completedSection = $page('section').filter((i, el) => $page(el).find('h2').text().includes('Successfully'));
if (completedSection.length) {
    completedSection.remove();
}

fs.writeFileSync(PROJECTS_HTML_FILE, $page.html());
console.log('Successfully generated pages/projects.html with ' + projectData.length + ' projects.');
