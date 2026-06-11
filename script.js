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
