// script.js – BDDN Client-side Logic
// Optimized: DOM queries cached, event delegation used, keyboard-accessible form

// ── CONFIG ──────────────────────────────────────────────
const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycby87Ymind6vZaG8VT9YbdG_cVRmPCMHcqFi74qV0NkAu7yxCqKsEBCVFI8PEDlsPiY5xQ/exec";

// ── HELPERS ─────────────────────────────────────────────

/**
 * Shows a toast notification.
 * @param {string} msg   – The message to display.
 * @param {'success'|'error'} type – Visual style.
 */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `show ${type}`;
  setTimeout(() => { t.className = ''; }, 4500);
}

// ── MOBILE NAV ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks   = document.getElementById('navLinks');

  if (!menuToggle || !navLinks) return;

  /** Toggle mobile menu open/closed */
  function toggleMenu(force) {
    const isOpen = force !== undefined ? force : navLinks.classList.contains('active');
    const open   = force !== undefined ? force : !isOpen;

    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.classList.toggle('active', open);
    navLinks.classList.toggle('active', open);
  }

  menuToggle.addEventListener('click', () => toggleMenu());

  // Close menu when any nav link is clicked (smooth scroll handles the rest)
  navLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') toggleMenu(false);
  });

  // Close menu when clicking outside the navbar
  document.addEventListener('click', (e) => {
    const navbar = document.querySelector('.navbar');
    if (navbar && !navbar.contains(e.target) && navLinks.classList.contains('active')) {
      toggleMenu(false);
    }
  });

  // Close menu on Escape key press (keyboard accessibility)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('active')) {
      toggleMenu(false);
      menuToggle.focus();
    }
  });
});

// ── ENROLLMENT FORM ─────────────────────────────────────

/**
 * Validates and submits the enrollment form to Google Sheets.
 */
async function submitForm() {
  const nameEl    = document.getElementById('name');
  const phoneEl   = document.getElementById('phone');
  const courseEl  = document.getElementById('course');
  const messageEl = document.getElementById('message');
  const btn       = document.getElementById('submitBtn');

  if (!nameEl || !phoneEl || !courseEl || !btn) return;

  // Guard: Check URL is configured
  if (!GOOGLE_SHEET_URL || GOOGLE_SHEET_URL === 'YOUR_GOOGLE_SHEET_WEBAPP_URL_HERE') {
    showToast('⚠️ Configuration error. Please contact us directly.', 'error');
    console.error('GOOGLE_SHEET_URL is not configured in script.js.');
    return;
  }

  const name    = nameEl.value.trim();
  const phone   = phoneEl.value.trim();
  const course  = courseEl.value;
  const message = messageEl ? messageEl.value.trim() : '';

  // Field validation
  if (!name) {
    showToast('⚠️ Please enter your full name.', 'error');
    nameEl.focus();
    return;
  }
  if (!phone) {
    showToast('⚠️ Please enter your phone number.', 'error');
    phoneEl.focus();
    return;
  }
  if (!course) {
    showToast('⚠️ Please select a course.', 'error');
    courseEl.focus();
    return;
  }

  // Validate 10-digit Indian phone number
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    showToast('⚠️ Please enter a valid 10-digit Indian phone number.', 'error');
    phoneEl.focus();
    return;
  }

  // Name: at least 2 characters
  if (name.length < 2) {
    showToast('⚠️ Please enter your full name (at least 2 characters).', 'error');
    nameEl.focus();
    return;
  }

  // Disable button & show spinner
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" role="status" aria-label="Submitting"></span> Submitting…';

  try {
    const res  = await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      mode:   'cors',
      body:   JSON.stringify({ name, phone, course, message })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showToast(`✅ Thank you, ${name}! We'll call you shortly.`, 'success');
      // Reset form fields
      nameEl.value   = '';
      phoneEl.value  = '';
      courseEl.value = '';
      if (messageEl) messageEl.value = '';
    } else {
      showToast(`❌ ${data.error || 'Something went wrong. Please try again.'}`, 'error');
    }
  } catch (err) {
    console.error('Submission Error:', err);
    showToast('❌ Network error. Please check your connection and try again.', 'error');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = 'Submit Enrollment Request';
  }
}

// Allow pressing Enter in form inputs to submit
document.addEventListener('DOMContentLoaded', () => {
  const formInputs = ['name', 'phone', 'course', 'message'];
  formInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && id !== 'message') {
          e.preventDefault();
          submitForm();
        }
      });
    }
  });
});

// ── WHATSAPP ENROLL ─────────────────────────────────────

/**
 * Lazily reads the WhatsApp number from contact_config.js at call time.
 * Falls back to the hardcoded number if the config hasn't loaded yet.
 * @returns {string} E.164 format without '+', e.g. '919955889177'
 */
function getWhatsAppNumber() {
  return (window.BDDN_CONTACT && window.BDDN_CONTACT.whatsapp) || '919955889177';
}

/**
 * Reads the enrollment form values, validates them, and opens a
 * pre-filled WhatsApp chat with the enquiry details.
 * Called by the "Send via WhatsApp" button in the enroll section.
 * @param {Event} e – The click event.
 * @returns {boolean} false (prevents default anchor navigation).
 */
function openWhatsAppEnroll(e) {
  if (e) e.preventDefault();

  const nameEl    = document.getElementById('name');
  const phoneEl   = document.getElementById('phone');
  const courseEl  = document.getElementById('course');
  const messageEl = document.getElementById('message');

  const name    = nameEl    ? nameEl.value.trim()    : '';
  const phone   = phoneEl   ? phoneEl.value.trim()   : '';
  const course  = courseEl  ? courseEl.value          : '';
  const message = messageEl ? messageEl.value.trim() : '';

  // Validation
  if (!name) {
    showToast('⚠️ Please enter your full name before sending on WhatsApp.', 'error');
    if (nameEl) nameEl.focus();
    return false;
  }
  if (!phone) {
    showToast('⚠️ Please enter your phone number before sending on WhatsApp.', 'error');
    if (phoneEl) phoneEl.focus();
    return false;
  }
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    showToast('⚠️ Please enter a valid 10-digit Indian phone number.', 'error');
    if (phoneEl) phoneEl.focus();
    return false;
  }
  if (!course) {
    showToast('⚠️ Please select a course before sending on WhatsApp.', 'error');
    if (courseEl) courseEl.focus();
    return false;
  }

  // Build message
  let text = 'Hello BDDN! 👋\n\nI would like to enroll in your program.\n\n';
  text += `📌 *Name:* ${name}\n`;
  text += `📞 *Phone:* ${phone}\n`;
  text += `📚 *Course:* ${course}\n`;
  if (message) text += `💬 *Message:* ${message}\n`;
  text += '\nPlease get in touch with me. Thank you!';

  const url = `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return false;
}

// ── GALLERY DATA & LIGHTBOX (Feature 1) ──────────────────────

const GALLERY_IMAGES = [
  { src: "images/gallery-classroom.webp", caption: "BDDN Classroom Session" },
  { src: "images/gallery-computer-lab.webp", caption: "Fully Equipped Computer Lab" },
  { src: "images/gallery-entrance.webp", caption: "Welcome to BDDN Darbhanga" },
  { src: "images/gallery-inauguration.webp", caption: "BDDN Inauguration Ceremony" },
  { src: "images/gallery-powerbi.webp", caption: "Data Visualization & Power BI Training" },
  { src: "images/gallery-training.webp", caption: "Hands-on Student Training Session" },
  { src: "images/gallery-workstations.webp", caption: "Modern Practice Workstations" }
];

let currentLightboxIndex = 0;

function initGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  grid.innerHTML = GALLERY_IMAGES.map((img, idx) => `
    <div class="gallery-card" data-index="${idx}" role="listitem" tabindex="0" aria-label="${img.caption}">
      <img src="${img.src}" alt="${img.caption}" loading="lazy" width="1024" height="1024" />
      <div class="gallery-overlay">
        <div class="gallery-caption">${img.caption}</div>
      </div>
    </div>
  `).join('');

  // Click & Keyboard accessibility for cards
  grid.querySelectorAll('.gallery-card').forEach((card) => {
    const idx = parseInt(card.getAttribute('data-index'), 10);
    card.addEventListener('click', () => openLightbox(idx));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(idx);
      }
    });
  });
}

// Cached lightbox DOM references (queried once at init, not on every open)
let _lbBox = null, _lbImg = null, _lbCaption = null;

function initLightboxRefs() {
  _lbBox     = document.getElementById('lightbox');
  _lbImg     = document.getElementById('lightboxImg');
  _lbCaption = document.getElementById('lightboxCaption');
}

function openLightbox(index) {
  currentLightboxIndex = index;
  if (!_lbBox || !_lbImg || !_lbCaption) return;

  const data = GALLERY_IMAGES[index];
  _lbImg.src = data.src;
  _lbImg.alt = data.caption;
  _lbCaption.textContent = data.caption;

  _lbBox.setAttribute('aria-hidden', 'false');
  _lbBox.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  const closeBtn = document.getElementById('lightboxClose');
  if (closeBtn) closeBtn.focus();
}

function closeLightbox() {
  if (!_lbBox) return;
  _lbBox.setAttribute('aria-hidden', 'true');
  _lbBox.style.display = 'none';
  document.body.style.overflow = '';
}

function changeLightboxImage(dir) {
  let newIdx = currentLightboxIndex + dir;
  if (newIdx < 0) newIdx = GALLERY_IMAGES.length - 1;
  if (newIdx >= GALLERY_IMAGES.length) newIdx = 0;
  openLightbox(newIdx);
}

// ── BROCHURE POPUP MODAL (Feature 6) ─────────────────────────

function openBrochureModal(courseName) {
  const modal = document.getElementById('brochureModal');
  const courseSel = document.getElementById('modal-course');
  if (!modal) return;

  if (courseSel && courseName) {
    courseSel.value = courseName;
  }

  modal.setAttribute('aria-hidden', 'false');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  const closeBtn = document.getElementById('modalClose');
  if (closeBtn) closeBtn.focus();
}

function closeBrochureModal() {
  const modal = document.getElementById('brochureModal');
  if (!modal) return;

  modal.setAttribute('aria-hidden', 'true');
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

function sendBrochureViaWhatsApp() {
  const nameEl = document.getElementById('modal-name');
  const phoneEl = document.getElementById('modal-phone');
  const courseEl = document.getElementById('modal-course');

  if (!nameEl || !phoneEl || !courseEl) return;

  const name = nameEl.value.trim();
  const phone = phoneEl.value.trim();
  const course = courseEl.value;

  if (!name) {
    showToast('⚠️ Please enter your full name.', 'error');
    nameEl.focus();
    return;
  }
  if (!phone) {
    showToast('⚠️ Please enter your phone number.', 'error');
    phoneEl.focus();
    return;
  }

  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    showToast('⚠️ Please enter a valid 10-digit Indian phone number.', 'error');
    phoneEl.focus();
    return;
  }

  // Pre-fill whatsapp message
  let text = `Hello BDDN! 👋\n\nI would like to request the brochure/syllabus.\n\n`;
  text += `📌 *Name:* ${name}\n`;
  text += `📞 *Phone:* ${phone}\n`;
  text += `📚 *Syllabus Requested:* ${course}\n\n`;
  text += `Please send me the PDF link on WhatsApp. Thank you!`;

  const url = `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  
  // Auto-close modal and reset fields
  closeBrochureModal();
  nameEl.value = '';
  phoneEl.value = '';
}

// ── CURRICULUM TAB SWITCHING (Feature 5) ───────────────────────

function switchCurrTab(tabId) {
  const daTab = document.getElementById('tab-da');
  const dmTab = document.getElementById('tab-dm');
  const daPanel = document.getElementById('panel-da');
  const dmPanel = document.getElementById('panel-dm');

  if (tabId === 'da') {
    if (daTab) { daTab.classList.add('active'); daTab.setAttribute('aria-selected', 'true'); }
    if (dmTab) { dmTab.classList.remove('active'); dmTab.setAttribute('aria-selected', 'false'); }
    if (daPanel) daPanel.classList.add('active');
    if (dmPanel) dmPanel.classList.remove('active');
  } else {
    if (daTab) { daTab.classList.remove('active'); daTab.setAttribute('aria-selected', 'false'); }
    if (dmTab) { dmTab.classList.add('active'); dmTab.setAttribute('aria-selected', 'true'); }
    if (daPanel) daPanel.classList.remove('active');
    if (dmPanel) dmPanel.classList.add('active');
  }
}

// ── FAQ ACCORDION (Feature 7) ────────────────────────────────

function toggleFaq(btn) {
  const item = btn.parentElement;
  if (!item) return;

  const answer = item.querySelector('.faq-answer');
  const isActive = item.classList.contains('active');

  // Close all other FAQ items for "one-open-at-a-time" behavior
  const allItems = document.querySelectorAll('.faq-item');
  allItems.forEach(i => {
    i.classList.remove('active');
    const q = i.querySelector('.faq-question');
    if (q) q.setAttribute('aria-expanded', 'false');
    const ans = i.querySelector('.faq-answer');
    if (ans) ans.style.maxHeight = null;
  });

  if (!isActive) {
    item.classList.add('active');
    btn.setAttribute('aria-expanded', 'true');
    if (answer) {
      answer.style.maxHeight = answer.scrollHeight + "px";
    }
  } else {
    item.classList.remove('active');
    btn.setAttribute('aria-expanded', 'false');
    if (answer) {
      answer.style.maxHeight = null;
    }
  }
}

// ── VIDEOS GRID POPULATION & PLAYBACK (Feature 8) ──────────────

function initVideos() {
  const grid = document.getElementById('videosGrid');
  if (!grid || typeof YOUTUBE_VIDEOS === 'undefined') return;

  grid.innerHTML = YOUTUBE_VIDEOS.map(video => `
    <div class="video-card">
      <div class="video-thumbnail-container" data-video-id="${video.id}" aria-label="Play video: ${video.title}" tabindex="0">
        <img src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg" alt="${video.title} thumbnail" loading="lazy" width="320" height="180" />
        <div class="video-play-btn" role="button" aria-label="Play">▶</div>
      </div>
      <div class="video-info">
        <h3 class="video-title">${video.title}</h3>
        <p class="video-desc">${video.description}</p>
      </div>
    </div>
  `).join('');

  // Click & Keyboard accessibility for play video
  grid.querySelectorAll('.video-thumbnail-container').forEach(container => {
    const videoId = container.getAttribute('data-video-id');
    container.addEventListener('click', () => playVideo(container, videoId));
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        playVideo(container, videoId);
      }
    });
  });
}

function playVideo(container, videoId) {
  const videoTitle = container.getAttribute('aria-label') || 'BDDN YouTube Video';
  container.innerHTML = `
    <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
            title="${videoTitle}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
    </iframe>
  `;
}

// ── SCROLL NAVBAR ───────────────────────────────────────
function initScrollNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  
  function checkScroll() {
    if (window.scrollY > 15) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  
  window.addEventListener('scroll', checkScroll, { passive: true });
  checkScroll();
}

// ── DETECT SUBFOLDER DEPTH ──────────────────────────────
function getRootPath() {
  const path = window.location.pathname;
  if (path.includes('/blog/') || path.includes('/courses/')) {
    return '../';
  }
  return '';
}

// ── UNIVERSAL NAVBAR PATH PATCHER ────────────────────────
function initUniversalNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const rootPath = getRootPath();
  
  // Detect if we are on the homepage
  const path = window.location.pathname;
  const isHomepage = !!document.getElementById('home');

  // 1. Fix Brand Link and Brand Logo Image
  const brandLink = navbar.querySelector('.nav-brand');
  if (brandLink) {
    brandLink.href = isHomepage ? '#home' : rootPath + 'index.html';
    const brandImg = brandLink.querySelector('img');
    if (brandImg) {
      let src = brandImg.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        const filename = src.substring(src.lastIndexOf('/') + 1);
        brandImg.src = rootPath + filename;
      }
    }
  }

  // 2. Fix Links inside nav-links
  const navLinks = document.getElementById('navLinks');
  if (navLinks) {
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      const text = link.textContent.trim().toLowerCase();

      if (href.startsWith('#')) {
        if (href === '#enroll' && path.includes('/courses/')) {
          // Keep local enroll scroll for course pages
          return;
        }
        if (isHomepage) {
          // Keep as local scroll on homepage
          return;
        } else {
          // Navigate to homepage section
          link.href = rootPath + 'index.html' + href;
        }
      } else {
        // It's a page link like 'blog.html' or 'links.html'
        if (!href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          const filename = href.substring(href.lastIndexOf('/') + 1);
          link.href = rootPath + filename;
        }
      }

      // Add 'active' class to current page link
      const currentPageName = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
      const linkPageName = link.getAttribute('href').split('#')[0].split('/').pop();
      
      if (currentPageName === linkPageName) {
        link.classList.add('active');
      } else {
        if (linkPageName && linkPageName !== 'index.html') {
          link.classList.remove('active');
        }
      }
    });
  }
}

// ── MEGA MENU INJECTOR ──────────────────────────────────
function initMegaMenu() {
  const navLinks = document.getElementById('navLinks');
  if (!navLinks) return;

  const coursesLink = Array.from(navLinks.querySelectorAll('a')).find(
    el => el.textContent.trim().toLowerCase().startsWith('courses')
  );
  if (!coursesLink) return;

  const coursesData = window.BDDN_COURSES || [];
  const activeCourses = coursesData.filter(c => c.active);

  const categories = {};
  activeCourses.forEach(course => {
    if (!categories[course.category]) {
      categories[course.category] = [];
    }
    categories[course.category].push(course);
  });

  const rootPath = getRootPath();
  let menuHtml = `<div class="mega-menu-columns">`;

  for (const [category, list] of Object.entries(categories)) {
    menuHtml += `
      <div class="mega-menu-col">
        <div class="mega-menu-category">${category}</div>
    `;
    list.forEach(course => {
      const courseUrl = rootPath + course.url;
      menuHtml += `
        <a href="${courseUrl}" class="mega-menu-item">
          <span class="mega-item-name">${course.name}</span>
          <span class="mega-item-summary">${course.summary}</span>
        </a>
      `;
    });
    menuHtml += `</div>`;
  }
  menuHtml += `</div>`;

  const dropdownContainer = document.createElement('div');
  dropdownContainer.className = 'nav-dropdown';
  dropdownContainer.role = 'none';

  const triggerButton = document.createElement('button');
  triggerButton.className = 'nav-dropdown-trigger';
  triggerButton.setAttribute('aria-expanded', 'false');
  triggerButton.setAttribute('aria-haspopup', 'true');
  triggerButton.setAttribute('role', 'menuitem');
  triggerButton.innerHTML = `Courses <span class="arrow-down">▼</span>`;

  const megaMenuPanel = document.createElement('div');
  megaMenuPanel.className = 'mega-menu';
  megaMenuPanel.setAttribute('role', 'menu');
  megaMenuPanel.setAttribute('aria-label', 'Courses Mega Menu');
  megaMenuPanel.innerHTML = menuHtml;

  dropdownContainer.appendChild(triggerButton);
  dropdownContainer.appendChild(megaMenuPanel);

  coursesLink.parentNode.replaceChild(dropdownContainer, coursesLink);

  triggerButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isExpanded = triggerButton.getAttribute('aria-expanded') === 'true';
    triggerButton.setAttribute('aria-expanded', String(!isExpanded));
    dropdownContainer.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!dropdownContainer.contains(e.target)) {
      triggerButton.setAttribute('aria-expanded', 'false');
      dropdownContainer.classList.remove('active');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      triggerButton.setAttribute('aria-expanded', 'false');
      dropdownContainer.classList.remove('active');
    }
  });
}

// ── HOMEPAGE COURSES CARDS GENERATOR ─────────────────────
function initHomepageCourses() {
  const courseGrid = document.querySelector('#courses .course-grid');
  if (!courseGrid) return;

  const coursesData = window.BDDN_COURSES || [];
  const activeCourses = coursesData.filter(c => c.active);

  const rootPath = getRootPath();
  const categoryIcons = {
    "Data & AI": "📊",
    "Marketing": "📣",
    "Business Intelligence": "💼"
  };

  courseGrid.innerHTML = activeCourses.map(course => {
    const icon = categoryIcons[course.category] || "🎓";
    const courseUrl = rootPath + course.url;
    return `
      <article class="course-card" aria-labelledby="course-${course.id}">
        <div class="course-icon-wrap"><span role="img" aria-label="${course.category}">${icon}</span></div>
        <h3 id="course-${course.id}">${course.name}</h3>
        <p class="course-summary">${course.summary}</p>
        <div class="course-duration">
          <span class="duration-icon">🕐</span>
          <strong>Duration:</strong> ${course.duration}
        </div>
        <div class="course-actions">
          <a href="${courseUrl}" class="course-cta-btn" aria-label="Learn more about ${course.name}">Learn More →</a>
        </div>
      </article>
    `;
  }).join('');
}

// ── AUTO-POPULATE SELECT OPTIONS FOR ENROLLMENT ─────────
function initCourseSelectDropdowns() {
  const courseDropdowns = [
    document.getElementById('course'),
    document.getElementById('modal-course')
  ];

  const coursesData = window.BDDN_COURSES || [];
  const activeCourses = coursesData.filter(c => c.active);

  courseDropdowns.forEach(dropdown => {
    if (!dropdown) return;
    const currentValue = dropdown.value;
    dropdown.innerHTML = '<option value="" disabled selected>Select a Course...</option>' + 
      activeCourses.map(course => `
        <option value="${course.name}">${course.name}</option>
      `).join('');
    if (currentValue) {
      dropdown.value = currentValue;
    }
  });
}

// ── DOCUMENT INITIALIZATION & EVENT REGISTERING ───────────────

document.addEventListener('DOMContentLoaded', () => {
  initUniversalNavbar();
  initScrollNavbar();
  initMegaMenu();
  initHomepageCourses();
  initCourseSelectDropdowns();
  initGallery();
  initLightboxRefs(); // Cache lightbox DOM refs after gallery is initialized
  initVideos();

  // Dynamic binding for Brochure download buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.course-syllabus-btn, .curr-download-btn');
    if (btn) {
      const course = btn.getAttribute('data-course');
      openBrochureModal(course);
    }
  });

  // Dynamic binding for FAQs
  document.addEventListener('click', (e) => {
    const q = e.target.closest('.faq-question');
    if (q) {
      toggleFaq(q);
    }
  });

  // Tab switching listeners
  const tabDa = document.getElementById('tab-da');
  const tabDm = document.getElementById('tab-dm');
  if (tabDa) tabDa.addEventListener('click', () => switchCurrTab('da'));
  if (tabDm) tabDm.addEventListener('click', () => switchCurrTab('dm'));

  // Form submission event listener
  const enrollForm = document.getElementById('enrollForm');
  if (enrollForm) {
    enrollForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitForm();
    });
  }

  // WhatsApp form button click listener
  const waFormBtn = document.getElementById('whatsappFormBtn');
  if (waFormBtn) waFormBtn.addEventListener('click', openWhatsAppEnroll);

  // Modal Send button click listener
  const modalSendBtn = document.getElementById('modalSendBtn');
  if (modalSendBtn) modalSendBtn.addEventListener('click', sendBrochureViaWhatsApp);

  // Lightbox Close / Prev / Next clicks
  const lbClose = document.getElementById('lightboxClose');
  const lbPrev = document.getElementById('lightboxPrev');
  const lbNext = document.getElementById('lightboxNext');
  const lb = document.getElementById('lightbox');

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', () => changeLightboxImage(-1));
  if (lbNext) lbNext.addEventListener('click', () => changeLightboxImage(1));
  if (lb) {
    lb.addEventListener('click', (e) => {
      if (e.target === lb || e.target.classList.contains('lightbox-inner')) {
        closeLightbox();
      }
    });
  }

  // Brochure modal Close click
  const modClose = document.getElementById('modalClose');
  const brochureModal = document.getElementById('brochureModal');
  if (modClose) modClose.addEventListener('click', closeBrochureModal);
  if (brochureModal) {
    brochureModal.addEventListener('click', (e) => {
      if (e.target === brochureModal) {
        closeBrochureModal();
      }
    });
  }

  // Global escape key handler for Modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const lightbox = document.getElementById('lightbox');
      const brochureModal = document.getElementById('brochureModal');
      
      if (lightbox && lightbox.getAttribute('aria-hidden') === 'false') {
        closeLightbox();
      }
      if (brochureModal && brochureModal.getAttribute('aria-hidden') === 'false') {
        closeBrochureModal();
      }
    }
  });
});

// ── RESOURCES PAGE (links.html) ─────────────────────────
// Guard: only runs when #resGrid exists (i.e. on links.html)

(function initResourcesPage() {
  const resGrid  = document.getElementById('resGrid');
  const resCount = document.getElementById('resCount');
  const resSearch = document.getElementById('resSearch');

  if (!resGrid || !resCount || !resSearch) return; // Not on resources page

  /** Maps keywords in a link caption to a display emoji */
  const ICONS = {
    python: '🐍', sql: '🗄️', 'power bi': '📊', tableau: '📊', excel: '📋',
    data: '📈', seo: '🔍', marketing: '📣', google: '🔍', youtube: '🎬',
    video: '🎬', book: '📚', guide: '📚', roadmap: '📚', course: '🎓',
    tool: '🛠️', javascript: '🟨', html: '🌐', css: '🎨', ai: '🤖', ml: '🤖',
    blueprint: '📋', career: '🚀', prospectus: '📄'
  };

  function getIcon(caption) {
    const c = caption.toLowerCase();
    for (const [kw, icon] of Object.entries(ICONS)) {
      if (c.includes(kw)) return icon;
    }
    return '🔗';
  }

  function getDomain(url) {
    try { return new URL(url).hostname.replace('www.', ''); }
    catch { return url; }
  }

  /** Formats underscore/hyphen separated words into human-readable title */
  function formatCaption(caption) {
    return caption.replace(/[_-]/g, ' ');
  }

  let allLinks = [];

  function renderLinks(list) {
    if (!list.length) {
      resGrid.innerHTML = `
        <div class="res-empty" role="status">
          <div class="res-empty-icon">${allLinks.length ? '🔍' : '📋'}</div>
          <h3>${allLinks.length ? 'No results found' : 'No links yet'}</h3>
          <p>${allLinks.length ? 'Try a different search term.' : 'Resources will appear here soon!'}</p>
        </div>`;
      resCount.innerHTML = '<strong>0</strong> resources';
      return;
    }

    resCount.innerHTML = `<strong>${list.length}</strong> link${list.length !== 1 ? 's' : ''}`;
    resGrid.innerHTML = list.map((item, i) => {
      const displayCaption = formatCaption(item.caption);
      return `
        <a class="res-item" href="${item.url}" target="_blank" rel="noopener noreferrer"
          style="animation-delay:${i * 0.03}s"
          aria-label="${displayCaption} — opens in new tab">
          <span class="res-item-num">${i + 1}</span>
          <span class="res-item-icon" aria-hidden="true">${getIcon(displayCaption)}</span>
          <span class="res-item-caption">${displayCaption}</span>
          <span class="res-item-domain">${getDomain(item.url)}</span>
          <span class="res-item-arrow" aria-hidden="true">→</span>
        </a>`;
    }).join('');
  }

  resSearch.addEventListener('input', function () {
    const q = this.value.toLowerCase().trim();
    renderLinks(q
      ? allLinks.filter(l =>
          l.caption.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q)
        )
      : allLinks
    );
  });

  if (typeof LINKS_DATA !== 'undefined' && Array.isArray(LINKS_DATA)) {
    allLinks = LINKS_DATA;
    renderLinks(allLinks);
  } else {
    resGrid.innerHTML = `
      <div class="res-empty" role="alert">
        <div class="res-empty-icon">⚠️</div>
        <h3>Could not load resources</h3>
        <p>Check that <strong>links.js</strong> exists in the same folder.</p>
      </div>`;
    resCount.textContent = 'Error';
  }
})();
