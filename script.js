const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const spans = navToggle.querySelectorAll('span');
  if (navLinks.classList.contains('open')) {
    spans[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(4px, -4px)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.querySelectorAll('span').forEach(s => {
      s.style.transform = ''; s.style.opacity = '';
    });
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });

document.querySelectorAll('.feature, .contact-form, .section-header').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// ── Contact form submission ──────────────────────────────
const WORKER_URL = 'https://ambient-contact-form.ambient-digital.workers.dev';

const form = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');
const status = document.getElementById('form-status');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  status.textContent = '';
  status.className = 'form-status';

  const data = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    subject: form.subject.value.trim(),
    message: form.message.value.trim(),
  };

  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();

    if (res.ok) {
      status.textContent = 'Message sent successfully. We\'ll get back to you soon.';
      status.className = 'form-status success';
      form.reset();
    } else {
      status.textContent = result.error || 'Something went wrong. Please try again.';
      status.className = 'form-status error';
    }
  } catch {
    status.textContent = 'Network error. Please try again or email us directly.';
    status.className = 'form-status error';
  }

  submitBtn.disabled = false;
  submitBtn.textContent = 'Send Message';
});
