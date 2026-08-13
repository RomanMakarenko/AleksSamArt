/**
 * «Стек карток» — клієнтська анімація головного екрана (етап 3).
 *
 * Підключається в `Home.astro` через `<script>` і працює тільки в браузері.
 * Виконує:
 *  - повноекранний скрол «1 екран = 1 робота» (реалізує CSS `scroll-snap` у global.css);
 *  - ефект «стосу карток»: картка в'їжджає зі стосу (нахил + масштаб + тінь),
 *    а на виході «осідає» назад — GSAP + ScrollTrigger із `scrub`;
 *  - паралакс інтро-екрана (затемнення + підйом при скролі);
 *  - фон-колаж інтро: «плавання» розкиданих фото + паралакс (setupScatter);
 *  - бічний індикатор: активна точка = поточна робота (рахунок від геометрії
 *    кожен кадр скролу — стійко до resize), клік по точці = перехід до роботи;
 *  - `prefers-reduced-motion`: анімації вимикаються, навігація лишається.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const gallery = document.querySelector<HTMLElement>('[data-gallery]');
if (gallery) {
  init(gallery);
}

function init(gallery: HTMLElement): void {
  const screens = Array.from(gallery.querySelectorAll<HTMLElement>('[data-work-screen]'));
  if (screens.length === 0) return;

  // Перерахувати позиції після того, як зображення стабілізують layout
  // (lazy-load змінює висоти). Не реагувати на show/hide URL-бару мобільного.
  ScrollTrigger.config({ ignoreMobileResize: true });
  window.addEventListener('load', () => ScrollTrigger.refresh());

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) {
    setupCardStack(gallery, screens);
    setupScatter(gallery);
  }

  setupDots(screens);
}

/** GSAP: картка «піднімається зі стосу» → рівно у фокус → «осідає» назад. */
function setupCardStack(gallery: HTMLElement, screens: HTMLElement[]): void {
  // Інтро-екран: легкий паралакс — від'їжджає і гасне під час скролу.
  const hero = gallery.querySelector<HTMLElement>('[data-hero]');
  if (hero) {
    gsap.to(hero, {
      yPercent: -18,
      opacity: 0.25,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  }

  for (const screen of screens) {
    const card = screen.querySelector<HTMLElement>('[data-card]');
    if (!card) continue;

    // Діапазон: від появи екрана знизу (top bottom) до повного проходу (bottom top).
    // У точці спокою (top top, progress 0.5) картка — рівна, у фокусі.
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: screen,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });

    // В'їзд (0 → 0.5): картка піднімається зі стосу — нахил, менший масштаб,
    // м'яка тінь → рівно, повний розмір, глибока тінь «на вершині стосу».
    tl.fromTo(
      card,
      {
        yPercent: 14,
        rotation: 3.5,
        scale: 0.92,
        boxShadow: '0 12px 30px 0 rgba(0,0,0,0.25)',
      },
      {
        yPercent: 0,
        rotation: 0,
        scale: 1,
        boxShadow: '0 30px 80px 0 rgba(0,0,0,0.5)',
        duration: 0.5,
        ease: 'none',
      },
      0,
    );
    // Вихід (0.5 → 1): картка «осідає» назад на стос.
    tl.to(
      card,
      {
        yPercent: -9,
        rotation: -3,
        scale: 0.96,
        boxShadow: '0 12px 30px 0 rgba(0,0,0,0.25)',
        duration: 0.5,
        ease: 'none',
      },
      0.5,
    );

    // «Стіс» позаду — легкий паралакс: рівняється, коли картка стає активною.
    const stack = screen.querySelector<HTMLElement>('[data-stack]');
    if (stack) {
      tl.fromTo(
        stack,
        { scale: 1.06, rotation: 1.5 },
        { scale: 1, rotation: 0, duration: 0.5, ease: 'none' },
        0,
      ).to(
        stack,
        { scale: 1.04, rotation: -1.5, duration: 0.5, ease: 'none' },
        0.5,
      );
    }
  }
}

/**
 * Фон-колаж інтро-екрана (`[data-scatter]`): легке «плавання» кожного фото
 * навколо своєї позиції (різний темп/амплітуда) + паралакс усього розсипу,
 * поки інтро їде вгору при скролі. Базова позиція/нахил — у CSS/inline.
 */
function setupScatter(gallery: HTMLElement): void {
  const scatter = gallery.querySelector<HTMLElement>('[data-scatter]');
  const items = Array.from(scatter?.querySelectorAll<HTMLElement>('[data-scatter-item]') ?? []);
  if (!scatter || items.length === 0) return;

  // Паралакс: усе полотно трохи зсувається, поки інтро скролиться вгору.
  const hero = gallery.querySelector<HTMLElement>('[data-hero]');
  if (hero) {
    gsap.fromTo(
      scatter,
      { yPercent: 3 },
      {
        yPercent: -5,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      },
    );
  }

  // «Плаввання»: кожне фото дрейфує навколо позиції зі своїм темпом і фазою.
  items.forEach((item, i) => {
    const baseRot = Number(item.dataset.rot ?? 0);
    const driftX = 5 + (i % 4) * 2;
    const driftY = 8 + (i % 5) * 3;
    const duration = 6 + (i % 6) * 1.5;

    gsap.fromTo(
      item,
      { rotation: baseRot - 1.5, x: -driftX, y: -driftY },
      {
        rotation: baseRot + 1.5,
        x: driftX,
        y: driftY,
        duration,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: (i % 6) * 0.5,
      },
    );
  });
}

/** Точки: активна за геометрією на scroll/resize; клік = плавний перехід. */
function setupDots(screens: HTMLElement[]): void {
  const nav = document.querySelector<HTMLElement>('[data-dots]');
  const dots = Array.from(nav?.querySelectorAll<HTMLButtonElement>('[data-dot]') ?? []);
  if (!nav || dots.length === 0) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  nav.addEventListener('click', (event) => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-dot]');
    const index = Number(btn?.dataset.dot ?? -1);
    const screen = screens[index];
    if (!screen) return;
    screen.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  });

  let activeIndex = -1;
  let ticking = false;

  function updateActive(): void {
    ticking = false;
    const mid = window.innerHeight / 2;
    let next = -1;
    for (let i = 0; i < screens.length; i++) {
      const rect = screens[i].getBoundingClientRect();
      if (rect.top <= mid && rect.bottom > mid) {
        next = i;
        break;
      }
    }
    if (next === activeIndex) return;
    activeIndex = next;
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === next));
  }

  function requestUpdate(): void {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateActive);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  requestUpdate();
}
