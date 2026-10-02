import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initPortfolioAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Reduced-motion: reveal everything instantly ──────────────────────────
  if (prefersReducedMotion) {
    document.querySelectorAll<HTMLElement>('.mask-reveal-inner').forEach((el) => {
      el.style.transform = 'translateY(0%)';
    });
    document.querySelectorAll<HTMLElement>('.section-divider').forEach((divider) => {
      divider.style.transform = 'scaleX(1)';
    });
    return;
  }

  // ── 0. Stage Deck Pinning (Cards Stacking Effect) ─────────────────────────
  // Each stage acts as a large card stacking on top of the previous one.
  const stages = gsap.utils.toArray<HTMLElement>('.stage-layer');

  stages.forEach((stage, i) => {
    // Explicit z-index so incoming cards always layer on top
    stage.style.zIndex = `${(i + 1) * 10}`;

    if (i < stages.length - 1) {
      const nextStage = stages[i + 1];

      // Pin this stage while next stage scrolls over it
      ScrollTrigger.create({
        trigger: stage,
        start: () => {
          return stage.offsetHeight > window.innerHeight ? 'bottom bottom' : 'top top';
        },
        endTrigger: nextStage,
        end: () => {
          return nextStage.offsetHeight > window.innerHeight ? 'bottom bottom' : 'top top';
        },
        pin: true,
        pinSpacing: false,
        invalidateOnRefresh: true,
      });

      // Apple Card Depth effect: subtly scale down and dim the card underneath
      gsap.to(stage, {
        scale: 0.96,
        opacity: 0.55,
        ease: 'none',
        scrollTrigger: {
          trigger: nextStage,
          start: 'top bottom',
          end: () => {
            return nextStage.offsetHeight > window.innerHeight ? 'bottom bottom' : 'top top';
          },
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    }
  });

  // ── 1. Hero entrance timeline (Multi-directional: Top, Left, Right, Bottom)
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.hero-badge', { opacity: 0, y: -24, duration: 0.6 })
    .to(
      '.hero-title .mask-reveal-inner',
      { y: '0%', stagger: 0.12, duration: 0.9, ease: 'power4.out' },
      '-=0.35'
    )
    .from('.hero-desc', { opacity: 0, x: -40, duration: 0.7 }, '-=0.55')
    .from('.hero-cta a', { opacity: 0, y: 18, stagger: 0.1, duration: 0.45 }, '-=0.45')
    .from('.hero-console', { opacity: 0, x: 50, scale: 0.94, duration: 0.85, ease: 'power3.out' }, '-=0.6');

  // ── 2. Section dividers draw left-to-right ────────────────────────────────
  document.querySelectorAll<HTMLElement>('.section-divider').forEach((divider) => {
    gsap.to(divider, {
      scaleX: 1,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: divider,
        start: 'top 90%',
        once: true,
      },
    });
  });

  // ── 3. Heading mask reveals (non-hero sections) ───────────────────────────
  document.querySelectorAll<HTMLElement>('section:not(#hero)').forEach((sec) => {
    const inners = sec.querySelectorAll<HTMLElement>('.mask-reveal-inner');
    if (inners.length > 0) {
      gsap.to(inners, {
        y: '0%',
        duration: 0.9,
        ease: 'power4.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: sec,
          start: 'top 85%',
          once: true,
        },
      });
    }
  });

  // ── 4. Parallax watermark numbers scrub (bidirectional) ───────────────────
  document.querySelectorAll<HTMLElement>('.stage-watermark').forEach((mark) => {
    const section = mark.closest('section');
    if (!section) return;
    gsap.to(mark, {
      y: -70,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
        invalidateOnRefresh: true,
      },
    });
  });

  // ── 5. Experience cards — alternating side-entry (Left & Right) ──────────
  document.querySelectorAll<HTMLElement>('.experience-card').forEach((card, i) => {
    const fromLeft = i % 2 === 0;
    gsap.from(card, {
      x: fromLeft ? -90 : 90,
      opacity: 0,
      duration: 1.05,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
        once: true,
      },
    });
  });

  // ── 6. Bento Grid (Projects) — directional stagger (Left & Right alternating)
  document.querySelectorAll<HTMLElement>('[data-bento-card]').forEach((card, i) => {
    const fromLeft = i % 2 === 0;
    gsap.from(card, {
      x: fromLeft ? -50 : 50,
      y: 35,
      scale: 0.96,
      opacity: 0,
      duration: 0.85,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: card,
        start: 'top 88%',
        once: true,
      },
    });
  });

  // Hover lift — desktop only
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll<HTMLElement>('[data-bento-card]').forEach((card) => {
      card.addEventListener('mouseenter', () =>
        gsap.to(card, { y: -4, scale: 1.012, duration: 0.28, ease: 'power2.out', overwrite: 'auto' })
      );
      card.addEventListener('mouseleave', () =>
        gsap.to(card, { y: 0, scale: 1, duration: 0.38, ease: 'power3.out', overwrite: 'auto' })
      );
    });
  }

  // ── 7. Education (Academic Dossier) — 3-way directional entry (Left, Center, Right)
  const eduCard = document.querySelector<HTMLElement>('#education .craft-card');
  if (eduCard) {
    gsap.from(eduCard, {
      y: 45,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: eduCard,
        start: 'top 85%',
        once: true,
      },
    });
  }

  const eduPillars = document.querySelectorAll<HTMLElement>('#education .grid > div');
  if (eduPillars.length >= 3) {
    // Left pillar from left
    gsap.from(eduPillars[0], {
      x: -45,
      opacity: 0,
      duration: 0.85,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: eduCard || '#education', start: 'top 82%', once: true },
    });
    // Center pillar from bottom
    gsap.from(eduPillars[1], {
      y: 45,
      opacity: 0,
      duration: 0.85,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: eduCard || '#education', start: 'top 82%', once: true },
    });
    // Right pillar from right
    gsap.from(eduPillars[2], {
      x: 45,
      opacity: 0,
      duration: 0.85,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: eduCard || '#education', start: 'top 82%', once: true },
    });
  }

  // ── 8. Contact — Left column from Left, Telemetry Console from Right ──────
  const contactLeft = document.querySelector<HTMLElement>('#contact .md\\:col-span-7');
  const contactRight = document.querySelector<HTMLElement>('#contact .md\\:col-span-5');

  if (contactLeft) {
    gsap.from(contactLeft, {
      x: -60,
      opacity: 0,
      duration: 0.95,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: '#contact .contact-card',
        start: 'top 82%',
        once: true,
      },
    });
  }

  if (contactRight) {
    gsap.from(contactRight, {
      x: 60,
      opacity: 0,
      duration: 0.95,
      ease: 'power3.out',
      clearProps: 'transform,opacity',
      scrollTrigger: {
        trigger: '#contact .contact-card',
        start: 'top 82%',
        once: true,
      },
    });
  }

  // ── 9. Stage navigator — active section tracking (Bidirectional) ──────────
  const stageItems = document.querySelectorAll<HTMLElement>('.stage-nav-item');

  const setActiveStage = (activeIndex: number) => {
    stageItems.forEach((item, idx) => {
      const num = item.querySelector('.stage-num') as HTMLElement | null;
      const dot = item.querySelector('.stage-indicator-dot') as HTMLElement | null;
      const label = item.querySelector('.stage-label') as HTMLElement | null;

      if (idx === activeIndex) {
        item.classList.add('active');
        if (num) gsap.to(num, { color: '#38bdf8', duration: 0.25, overwrite: 'auto' });
        if (dot)
          gsap.to(dot, {
            scale: 1.6,
            backgroundColor: '#38bdf8',
            borderColor: '#e0f2fe',
            duration: 0.25,
            overwrite: 'auto',
          });
        if (label) gsap.to(label, { opacity: 1, color: '#ffffff', x: -3, duration: 0.25, overwrite: 'auto' });
      } else {
        item.classList.remove('active');
        if (num) gsap.to(num, { color: '#52525b', duration: 0.25, overwrite: 'auto' });
        if (dot)
          gsap.to(dot, {
            scale: 1,
            backgroundColor: '#27272a',
            borderColor: 'rgba(255,255,255,0.1)',
            duration: 0.25,
            overwrite: 'auto',
          });
        if (label) gsap.to(label, { opacity: 0.6, color: '#71717a', x: 0, duration: 0.25, overwrite: 'auto' });
      }
    });
  };

  const stagesList = [
    { id: 'hero', index: 0 },
    { id: 'experience', index: 1 },
    { id: 'projects', index: 2 },
    { id: 'education', index: 3 },
    { id: 'contact', index: 4 },
  ];

  stagesList.forEach(({ id, index }) => {
    ScrollTrigger.create({
      trigger: `#${id}`,
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter: () => setActiveStage(index),
      onEnterBack: () => setActiveStage(index),
    });
  });

  setActiveStage(0);

  // ── 10. Magnetic physics on CTA buttons ──────────────────────────────────
  document.querySelectorAll<HTMLElement>('.magnetic-btn').forEach((btn) => {
    btn.addEventListener('mousemove', (e: MouseEvent) => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, {
        x: (e.clientX - r.left - r.width / 2) * 0.18,
        y: (e.clientY - r.top - r.height / 2) * 0.18,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    });
    btn.addEventListener('mouseleave', () =>
      gsap.to(btn, { x: 0, y: 0, duration: 0.45, ease: 'power3.out', overwrite: 'auto' })
    );
  });

  // ── 11. Recalculate ScrollTrigger on load & font rendering ───────────────
  ScrollTrigger.refresh();
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
}
