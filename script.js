/* ── MOBILE MENU ── */
const toggle   = document.getElementById('menuToggle');
const closeBtn = document.getElementById('menuClose');
const menu     = document.getElementById('mobileMenu');
const links    = document.querySelectorAll('.mobile-link');

toggle.addEventListener('click', () => menu.classList.add('open'));
closeBtn.addEventListener('click', () => menu.classList.remove('open'));
links.forEach(l => l.addEventListener('click', () => menu.classList.remove('open')));

/* ── COUNTER ANIMATION ── */
function animateCounter(el) {
  const target = +el.dataset.target;
  const duration = 1200;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    el.textContent = Math.round(ease * target);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ── INTERSECTION OBSERVER ── */
const observerOptions = { threshold: 0.15 };

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
document.querySelectorAll('.stat__num').forEach(el => counterObserver.observe(el));

/* ── NAV ACTIVE STATE ── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + entry.target.id
          ? 'var(--text)'
          : '';
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));
