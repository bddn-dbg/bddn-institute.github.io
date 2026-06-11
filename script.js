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

const WHATSAPP_NUMBER = '919955889177'; // Country code + number, no +

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

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return false;
}

// ── GALLERY DATA & LIGHTBOX (Feature 1) ──────────────────────

const GALLERY_IMAGES = [
  { src: "images/gallery-classroom.png", caption: "BDDN Classroom Session" },
  { src: "images/gallery-computer-lab.png", caption: "Fully Equipped Computer Lab" },
  { src: "images/gallery-entrance.png", caption: "Welcome to BDDN Darbhanga" },
  { src: "images/gallery-inauguration.png", caption: "BDDN Inauguration Ceremony" },
  { src: "images/gallery-powerbi.png", caption: "Data Visualization & Power BI Training" },
  { src: "images/gallery-training.png", caption: "Hands-on Student Training Session" },
  { src: "images/gallery-workstations.png", caption: "Modern Practice Workstations" }
];

let currentLightboxIndex = 0;

function initGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  grid.innerHTML = GALLERY_IMAGES.map((img, idx) => `
    <div class="gallery-card" onclick="openLightbox(${idx})" role="listitem" tabindex="0" aria-label="${img.caption}">
      <img src="${img.src}" alt="${img.caption}" loading="lazy" />
      <div class="gallery-overlay">
        <div class="gallery-caption">${img.caption}</div>
      </div>
    </div>
  `).join('');

  // Keyboard accessibility for cards
  grid.querySelectorAll('.gallery-card').forEach((card, idx) => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(idx);
      }
    });
  });
}

function openLightbox(index) {
  currentLightboxIndex = index;
  const lightbox = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  const caption = document.getElementById('lightboxCaption');

  if (!lightbox || !img || !caption) return;

  const data = GALLERY_IMAGES[index];
  img.src = data.src;
  img.alt = data.caption;
  caption.textContent = data.caption;

  lightbox.setAttribute('aria-hidden', 'false');
  lightbox.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  const closeBtn = document.getElementById('lightboxClose');
  if (closeBtn) closeBtn.focus();
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.style.display = 'none';
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

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
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
      <div class="video-thumbnail-container" onclick="playVideo(this, '${video.id}')" aria-label="Play video: ${video.title}" tabindex="0">
        <img src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg" alt="${video.title} thumbnail" loading="lazy" />
        <div class="video-play-btn" role="button" aria-label="Play">▶</div>
      </div>
      <div class="video-info">
        <h3 class="video-title">${video.title}</h3>
        <p class="video-desc">${video.description}</p>
      </div>
    </div>
  `).join('');

  // Keyboard accessibility for play video
  grid.querySelectorAll('.video-thumbnail-container').forEach(container => {
    container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        container.click();
      }
    });
  });
}

function playVideo(container, videoId) {
  container.innerHTML = `
    <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
    </iframe>
  `;
}

// ── DOCUMENT INITIALIZATION & EVENT REGISTERING ───────────────

document.addEventListener('DOMContentLoaded', () => {
  initGallery();
  initVideos();

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

