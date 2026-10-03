import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ─────────────────────────────────────────────────────────────────────────────
// Biblioteca de entradas: cada una tiene un "from", un "ease" y una duración.
// Se combinan en secuencias para que ningún elemento entre igual que el anterior.
// ─────────────────────────────────────────────────────────────────────────────
type Entrance = {
  from: gsap.TweenVars;
  ease: string;
  duration: number;
};

const ENTRANCES: Record<string, Entrance> = {
  // Sube desde abajo con un pequeño rebote al final
  up: {
    from: { y: 160, scale: 0.92, opacity: 0 },
    ease: 'back.out(1.5)',
    duration: 1,
  },
  // Entra desde la derecha, ligeramente girada
  right: {
    from: { x: 180, rotation: 4, opacity: 0 },
    ease: 'power4.out',
    duration: 1.05,
  },
  // Entra desde la izquierda, girada al otro lado
  left: {
    from: { x: -180, rotation: -4, opacity: 0 },
    ease: 'power4.out',
    duration: 1.05,
  },
  // Aparece desde pequeña con efecto elástico
  zoom: {
    from: { scale: 0.55, y: 40, opacity: 0 },
    ease: 'elastic.out(1, 0.75)',
    duration: 1.4,
  },
  // Se abre como una tapa (3D) desde arriba
  flip: {
    from: {
      rotationX: -75,
      y: 60,
      opacity: 0,
      transformPerspective: 900,
      transformOrigin: 'top center',
    },
    ease: 'power3.out',
    duration: 1.1,
  },
  // Cae desde arriba
  down: {
    from: { y: -120, scale: 0.94, opacity: 0 },
    ease: 'bounce.out',
    duration: 1.2,
  },
};

// Orden en que se van alternando las tarjetas
const SEQUENCE = ['up', 'right', 'left', 'zoom', 'flip', 'right', 'left', 'up'];

function reveal(el: HTMLElement, name: string, delay = 0) {
  const e = ENTRANCES[name];
  gsap.fromTo(
    el,
    e.from,
    {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      rotationX: 0,
      opacity: 1,
      duration: e.duration,
      delay,
      ease: e.ease,
      clearProps: 'transform,opacity',
    }
  );
}

// Oculta el elemento hasta que su trigger se dispare (evita parpadeos)
function hideUntilReveal(el: HTMLElement) {
  gsap.set(el, { opacity: 0 });
}

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

  // ── 0. Stage Deck — cada sección entra distinto ──────────────────────────
  // La sección que llega (next) y la que se queda atrás (prev) tienen su
  // propia coreografía, atada al scroll (scrub). Se alternan en ciclo.
  //   Hero → Experience : sube desde abajo (con empujón extra)
  //   Experience → Projects : entra desde la derecha
  //   Projects → Education  : entra desde la izquierda
  //   Education → Contact   : zoom con giro
  const STAGE_TRANSITIONS: {
    name: string;
    next: gsap.TweenVars; // estado inicial de la sección que llega
    prev: gsap.TweenVars; // estado final de la sección que se queda atrás
  }[] = [
    {
      name: 'up',
      next: { y: 220, rotation: 0 },
      prev: { scale: 0.9, filter: 'brightness(0.5)' },
    },
    {
      name: 'right',
      next: { xPercent: 100, rotation: 4 },
      prev: { xPercent: -14, scale: 0.93, filter: 'brightness(0.5)' },
    },
    {
      name: 'left',
      next: { xPercent: -100, rotation: -4 },
      prev: { xPercent: 14, scale: 0.93, filter: 'brightness(0.5)' },
    },
    {
      name: 'zoom',
      next: { scale: 0.6, rotation: -6, y: 120 },
      prev: { scale: 1.12, filter: 'brightness(0.35)' },
    },
  ];

  const stages = gsap.utils.toArray<HTMLElement>('.stage-layer');

  stages.forEach((stage, i) => {
    stage.style.zIndex = `${(i + 1) * 10}`;

    if (i < stages.length - 1) {
      const nextStage = stages[i + 1];
      const t = STAGE_TRANSITIONS[i % STAGE_TRANSITIONS.length];

      // Pin: la sección actual se queda fija mientras la siguiente la tapa
      ScrollTrigger.create({
        trigger: stage,
        start: () => (stage.offsetHeight > window.innerHeight ? 'bottom bottom' : 'top top'),
        endTrigger: nextStage,
        end: () => (nextStage.offsetHeight > window.innerHeight ? 'bottom bottom' : 'top top'),
        pin: true,
        pinSpacing: false,
        invalidateOnRefresh: true,
      });

      // La que llega: parte de un estado "raro" y se asienta en su sitio
      gsap.fromTo(
        nextStage,
        { xPercent: 0, y: 0, scale: 1, rotation: 0, ...t.next },
        {
          xPercent: 0,
          y: 0,
          scale: 1,
          rotation: 0,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: nextStage,
            start: 'top bottom',
            end: 'top top',
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        }
      );

      // La que se queda atrás: se hunde, se oscurece y se desplaza un poco
      gsap.set(stage, { transformOrigin: 'center top' });
      gsap.fromTo(
        stage,
        { xPercent: 0, scale: 1, filter: 'brightness(1)' },
        {
          ...t.prev,
          ease: 'none',
          immediateRender: false,
          scrollTrigger: {
            trigger: nextStage,
            start: 'top bottom',
            end: 'top top',
            scrub: 1,
            invalidateOnRefresh: true,
          },
        }
      );
    }
  });

  // ── 1. Hero: cada pieza entra desde una dirección distinta ───────────────
  gsap
    .timeline({ defaults: { ease: 'power3.out' } })
    .from('.hero-badge', { opacity: 0, y: -40, scale: 0.8, duration: 0.7, ease: 'back.out(2)' })
    .to(
      '.hero-title .mask-reveal-inner',
      { y: '0%', stagger: 0.14, duration: 1, ease: 'power4.out' },
      '-=0.4'
    )
    .from('.hero-desc', { opacity: 0, x: -80, duration: 0.8 }, '-=0.6')
    .from(
      '.hero-cta a',
      { opacity: 0, y: 60, scale: 0.8, stagger: 0.12, duration: 0.7, ease: 'back.out(1.8)' },
      '-=0.5'
    )
    .from(
      '.hero-console',
      { opacity: 0, x: 140, rotation: 3, scale: 0.9, duration: 1.1, ease: 'power4.out' },
      '-=0.9'
    );

  // ── 2. Section dividers draw left-to-right ────────────────────────────────
  document.querySelectorAll<HTMLElement>('.section-divider').forEach((divider) => {
    gsap.to(divider, {
      scaleX: 1,
      duration: 1.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: divider, start: 'top 90%', once: true },
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
        scrollTrigger: { trigger: sec, start: 'top 85%', once: true },
      });
    }
  });

  // ── 4. Parallax watermark numbers scrub (bidirectional) ───────────────────
  document.querySelectorAll<HTMLElement>('.stage-watermark').forEach((mark) => {
    const section = mark.closest('section');
    if (!section) return;
    gsap.to(mark, {
      y: -90,
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

  // ── 5. Experience cards — secuencia: abajo → derecha → izquierda → zoom… ─
  document.querySelectorAll<HTMLElement>('.experience-card').forEach((card, i) => {
    const name = SEQUENCE[i % SEQUENCE.length];
    hideUntilReveal(card);
    ScrollTrigger.create({
      trigger: card,
      start: 'top 88%',
      once: true,
      onEnter: () => reveal(card, name),
    });
  });

  // ── 6. Bento Grid (Projects) — las tarjetas de una misma fila entran ─────
  //     desde direcciones distintas y escalonadas (batch)
  const bentoCards = gsap.utils.toArray<HTMLElement>('[data-bento-card]');
  bentoCards.forEach(hideUntilReveal);

  ScrollTrigger.batch(bentoCards, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => {
      (batch as HTMLElement[]).forEach((card, k) => {
        const globalIndex = bentoCards.indexOf(card);
        const name = SEQUENCE[(globalIndex + 1) % SEQUENCE.length];
        reveal(card, name, k * 0.14);
      });
    },
  });

  // Hover lift — desktop only
  if (window.matchMedia('(hover: hover)').matches) {
    bentoCards.forEach((card) => {
      card.addEventListener('mouseenter', () =>
        gsap.to(card, { y: -6, scale: 1.015, duration: 0.28, ease: 'power2.out', overwrite: 'auto' })
      );
      card.addEventListener('mouseleave', () =>
        gsap.to(card, { y: 0, scale: 1, duration: 0.38, ease: 'power3.out', overwrite: 'auto' })
      );
    });
  }

  // ── 7. Education — tarjeta sube, pilares: izquierda, flip, derecha ───────
  const eduCard = document.querySelector<HTMLElement>('#education .craft-card');
  if (eduCard) {
    hideUntilReveal(eduCard);
    ScrollTrigger.create({
      trigger: eduCard,
      start: 'top 88%',
      once: true,
      onEnter: () => reveal(eduCard, 'up'),
    });
  }

  const eduPillars = document.querySelectorAll<HTMLElement>('#education .grid > div');
  if (eduPillars.length >= 3) {
    const pillarNames = ['left', 'flip', 'right'];
    eduPillars.forEach((pillar, i) => {
      hideUntilReveal(pillar);
      ScrollTrigger.create({
        trigger: eduCard || '#education',
        start: 'top 80%',
        once: true,
        onEnter: () => reveal(pillar, pillarNames[i % pillarNames.length], 0.15 + i * 0.15),
      });
    });
  }

  // ── 8. Contact — columna izquierda desde la izquierda, consola desde la ──
  //     derecha, con un pequeño desfase para que se sienta una "pinza"
  const contactLeft = document.querySelector<HTMLElement>('#contact .md\\:col-span-7');
  const contactRight = document.querySelector<HTMLElement>('#contact .md\\:col-span-5');
  const contactTrigger = document.querySelector<HTMLElement>('#contact .contact-card');

  if (contactTrigger) {
    if (contactLeft) {
      hideUntilReveal(contactLeft);
      ScrollTrigger.create({
        trigger: contactTrigger,
        start: 'top 82%',
        once: true,
        onEnter: () => reveal(contactLeft, 'left'),
      });
    }
    if (contactRight) {
      hideUntilReveal(contactRight);
      ScrollTrigger.create({
        trigger: contactTrigger,
        start: 'top 82%',
        once: true,
        onEnter: () => reveal(contactRight, 'right', 0.2),
      });
    }
  }

  // ── 9. Stage navigator — active tracking con IntersectionObserver ────────
  const stageItems = document.querySelectorAll<HTMLElement>('.stage-nav-item');

  const setActiveStage = (activeIndex: number) => {
    stageItems.forEach((item, idx) => {
      const num = item.querySelector('.stage-num') as HTMLElement | null;
      const dot = item.querySelector('.stage-indicator-dot') as HTMLElement | null;
      const label = item.querySelector('.stage-label') as HTMLElement | null;
      const on = idx === activeIndex;

      item.classList.toggle('active', on);
      if (num) gsap.to(num, { color: on ? '#38bdf8' : '#52525b', duration: 0.2, overwrite: 'auto' });
      if (dot)
        gsap.to(dot, {
          scale: on ? 1.6 : 1,
          backgroundColor: on ? '#38bdf8' : '#27272a',
          borderColor: on ? '#e0f2fe' : 'rgba(255,255,255,0.1)',
          duration: 0.2,
          overwrite: 'auto',
        });
      if (label)
        gsap.to(label, {
          opacity: on ? 1 : 0.6,
          color: on ? '#ffffff' : '#71717a',
          x: on ? -3 : 0,
          duration: 0.2,
          overwrite: 'auto',
        });
    });
  };

  const sectionIds = ['hero', 'experience', 'projects', 'education', 'contact'];
  const sectionEls = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean) as HTMLElement[];

  const io = new IntersectionObserver(
    (entries) => {
      let best: { index: number; ratio: number } | null = null;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = sectionEls.indexOf(entry.target as HTMLElement);
          if (index !== -1 && (!best || entry.intersectionRatio > best.ratio)) {
            best = { index, ratio: entry.intersectionRatio };
          }
        }
      });
      if (best) setActiveStage((best as { index: number; ratio: number }).index);
    },
    {
      rootMargin: '-30% 0px -30% 0px',
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    }
  );

  sectionEls.forEach((el) => io.observe(el));
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