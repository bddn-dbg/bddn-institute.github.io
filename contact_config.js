/**
 * BDDN Central Contact Configuration
 * Single source of truth for all contact details on the website.
 */
const BDDN_CONTACT = {
  phone: "+91 9296989177",
  phoneRaw: "919296989177", // Without '+' or spaces
  whatsapp: "919296989177",
  email: "info@bddn.in",
  address: "Mohalla- Bhagwan Das Road, Khanka Chowk, Near Panacea Medicare Research Center, Darbhanga, Bihar – 846004",
  addressHTML: "Mohalla- Bhagwan Das Road, Khanka Chowk<br>Near Panacea Medicare Research Center<br>Darbhanga, Bihar – 846004",
  addressStreet: "MOHALLA- BHAGWAN DAS ROAD, KHANKA CHOWK NEAR PANACEA MEDICARE RESEARCH CENTER",
  addressLocality: "Darbhanga",
  addressRegion: "Bihar",
  addressPostalCode: "846004",
  googleMapsLink: "https://maps.app.goo.gl/75WadcaiwfkMsJ6AA",
  linkedinSMNadeem: "https://www.linkedin.com/in/sm-nadeem-bddn/",
  linkedinImranIqbal: "https://www.linkedin.com/in/md-imran-iqbal/"
};

// Make config globally accessible
window.BDDN_CONTACT = BDDN_CONTACT;

(function () {
  function updateDOM() {
    // 1. Text elements update
    document.querySelectorAll('[data-contact-text]').forEach(el => {
      const key = el.getAttribute('data-contact-text');
      if (key === 'addressHTML') {
        el.innerHTML = BDDN_CONTACT[key];
      } else if (BDDN_CONTACT[key]) {
        el.textContent = BDDN_CONTACT[key];
      }
    });

    // 2. Link updates (tel, mailto, maps, LinkedIn)
    document.querySelectorAll('[data-contact-href]').forEach(el => {
      const key = el.getAttribute('data-contact-href');
      if (key === 'phone') {
        el.href = `tel:+${BDDN_CONTACT.phoneRaw}`;
      } else if (key === 'email') {
        el.href = `mailto:${BDDN_CONTACT.email}`;
      } else if (key === 'whatsapp') {
        const currentHref = el.getAttribute('href');
        if (currentHref && currentHref.includes('wa.me/')) {
          el.href = currentHref.replace(/(wa\.me\/)(\+?\d+)/, `$1${BDDN_CONTACT.whatsapp}`);
        } else {
          el.href = `https://wa.me/${BDDN_CONTACT.whatsapp}`;
        }
      } else if (BDDN_CONTACT[key]) {
        el.href = BDDN_CONTACT[key];
      }
    });

    // 3. Fallback Auto-Scanner (processes any standard contact patterns to guarantee coverage)
    document.querySelectorAll('a').forEach(el => {
      const href = el.getAttribute('href');
      if (!href) return;

      if (href.startsWith('tel:') && !el.hasAttribute('data-contact-href')) {
        el.href = `tel:+${BDDN_CONTACT.phoneRaw}`;
      } else if (href.startsWith('mailto:') && !el.hasAttribute('data-contact-href')) {
        el.href = `mailto:${BDDN_CONTACT.email}`;
      } else if (href.includes('wa.me/') && !el.hasAttribute('data-contact-href')) {
        el.href = href.replace(/(wa\.me\/)(\+?\d+)/, `$1${BDDN_CONTACT.whatsapp}`);
      } else if ((href.includes('maps.app.goo.gl') || href.includes('google.com/maps')) && !el.hasAttribute('data-contact-href')) {
        el.href = BDDN_CONTACT.googleMapsLink;
      } else if (href.includes('linkedin.com/in/sm-nadeem-bddn') && !el.hasAttribute('data-contact-href')) {
        el.href = BDDN_CONTACT.linkedinSMNadeem;
      } else if (href.includes('linkedin.com/in/md-imran-iqbal') && !el.hasAttribute('data-contact-href')) {
        el.href = BDDN_CONTACT.linkedinImranIqbal;
      }
    });

    // 4. Update Schema.org JSON-LD Structured Data
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        let updated = false;

        if (data['@type'] === 'EducationalOrganization' || data['@type'] === 'LocalBusiness' || data['@type'] === 'Organization') {
          if (data.telephone) {
            data.telephone = `+${BDDN_CONTACT.phoneRaw}`;
            updated = true;
          }
          if (data.email) {
            data.email = BDDN_CONTACT.email;
            updated = true;
          }
          if (data.address && data.address['@type'] === 'PostalAddress') {
            data.address.streetAddress = BDDN_CONTACT.addressStreet;
            data.address.addressLocality = BDDN_CONTACT.addressLocality;
            data.address.addressRegion = BDDN_CONTACT.addressRegion;
            data.address.postalCode = BDDN_CONTACT.addressPostalCode;
            updated = true;
          }
          if (data.hasMap) {
            data.hasMap = BDDN_CONTACT.googleMapsLink;
            updated = true;
          }
        }

        if (updated) {
          script.textContent = JSON.stringify(data, null, 2);
        }
      } catch (e) {
        // Safe check skip
      }
    });
  }

  // Execute synchronously if DOM is already parsed, otherwise on content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateDOM);
  } else {
    updateDOM();
  }
})();
