/**
 * Лайтбокс — клієнтська логіка (етап 4).
 *
 * Підключається в `Lightbox.astro` через `<script>` і працює тільки в браузері.
 * Дані робіт (назва + список фото) приходять із `<script type="application/json">`
 * у компоненті — порядок збігається з порядком екранів.
 *
 * Виконує:
 *  - відкриття за індексом роботи: тригер `[data-open-lightbox]` (рамка картки),
 *    індекс — `data-work-index`; фото = головне + галерея (без порожніх);
 *  - перегляд фото з лічильником «поточне / всього» (формат — зі словника);
 *  - навігацію ←/→ та кнопками (зациклена), плавну появу фото після завантаження;
 *  - закриття: Esc, кнопка «×», клік поза зображенням;
 *  - блокування скролу сторінки (клас `scroll-locked` на `<html>`);
 *  - фокус: на відкритті — на кнопку закриття; trap у межах лайтбокса;
 *    на закритті — повернення на картку, з якої відкрили.
 */
interface LightboxWork {
  name: string;
  photos: string[];
}

/** Елементи лайтбокса (відомо, що присутні — після перевірки в `init`). */
interface LightboxEls {
  root: HTMLElement;
  img: HTMLImageElement;
  nameEl: HTMLElement;
  counterEl: HTMLElement;
  closeBtn: HTMLButtonElement;
}

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-lightbox]');
  const dataEl = document.querySelector<HTMLElement>('[data-lightbox-data]');
  if (!root || !dataEl) return;

  const works = JSON.parse(dataEl.textContent ?? '[]') as LightboxWork[];

  const img = root.querySelector<HTMLImageElement>('[data-lightbox-img]');
  const nameEl = root.querySelector<HTMLElement>('[data-lightbox-name]');
  const counterEl = root.querySelector<HTMLElement>('[data-lightbox-counter]');
  const closeBtn = root.querySelector<HTMLButtonElement>('[data-lightbox-close]');
  if (!img || !nameEl || !counterEl || !closeBtn) return;

  const els: LightboxEls = { root, img, nameEl, counterEl, closeBtn };
  const counterFormat = els.root.dataset.counterFormat ?? '{current} / {total}';

  let openIndex = -1; // індекс роботи в `works` (порядок екранів)
  let photoIndex = 0; // індекс поточного фото
  let trigger: HTMLElement | null = null; // картка, з якої відкрили лайтбокс

  function currentPhotos(): string[] {
    return works[openIndex]?.photos ?? [];
  }

  /** Показує поточне фото: src + alt + підпис «назва · лічильник». */
  function render(): void {
    const work = works[openIndex];
    const photos = currentPhotos();
    if (!work || photos.length === 0) return;

    const src = photos[photoIndex];
    els.img.classList.remove('is-loaded');
    els.img.onload = () => els.img.classList.add('is-loaded');
    els.img.src = src;
    if (els.img.complete) els.img.classList.add('is-loaded'); // кешоване фото — одразу

    els.img.alt = work.name;
    els.nameEl.textContent = work.name;
    els.counterEl.textContent = counterFormat
      .replace('{current}', String(photoIndex + 1))
      .replace('{total}', String(photos.length));
  }

  /** Відкриває лайтбокс із роботою `index`; `source` — картка для повернення фокусу. */
  function open(index: number, source: HTMLElement | null = null): void {
    if (openIndex !== -1) return; // вже відкрито
    const work = works[index];
    if (!work || work.photos.length === 0) return;

    openIndex = index;
    photoIndex = 0;
    trigger = source ?? (document.activeElement as HTMLElement);
    render();
    els.root.classList.add('is-open');
    els.root.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('scroll-locked');
    els.closeBtn.focus();
  }

  /** Закриває лайтбокс і повертає фокус на картку. */
  function close(): void {
    if (openIndex === -1) return;
    openIndex = -1;
    els.root.classList.remove('is-open');
    els.root.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('scroll-locked');
    trigger?.focus();
    trigger = null;
  }

  /** Наступне/попереднє фото (зациклене). */
  function step(delta: 1 | -1): void {
    const photos = currentPhotos();
    if (photos.length === 0) return;
    photoIndex = (photoIndex + delta + photos.length) % photos.length;
    render();
  }

  /** Tab не виходить за межі лайтбокса (між «×», «←», «→»). */
  function trapFocus(event: KeyboardEvent): void {
    const focusables = Array.from(
      els.root.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])'),
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // ─── Відкриття: рамка картки (клік / Enter / Space) ─────────────────────

  document.addEventListener('click', (event) => {
    const el = closestTrigger(event.target);
    if (!el) return;
    open(Number(el.dataset.workIndex), el);
  });

  document.addEventListener('keydown', (event) => {
    const el = closestTrigger(event.target);
    if (!el) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open(Number(el.dataset.workIndex), el);
    }
  });

  /** Найближчий тригер `[data-open-lightbox]` або null (безпечно для будь-якого target). */
  function closestTrigger(target: EventTarget | null): HTMLElement | null {
    return target instanceof Element ? target.closest<HTMLElement>('[data-open-lightbox]') : null;
  }

  // ─── Керування всередині лайтбокса ──────────────────────────────────────

  els.root.addEventListener('click', (event) => {
    const el = event.target as HTMLElement;
    if (el === els.root) {
      close(); // клік поза зображенням (по підкладці)
    } else if (el.closest('[data-lightbox-close]')) {
      close();
    } else if (el.closest('[data-lightbox-prev]')) {
      step(-1);
    } else if (el.closest('[data-lightbox-next]')) {
      step(1);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (openIndex === -1) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    } else if (event.key === 'Tab') {
      trapFocus(event);
    }
  });

  // Страховка focus trap: фокус не повинен піти за межі лайтбокса.
  document.addEventListener('focusin', (event) => {
    if (openIndex !== -1 && !els.root.contains(event.target as Node)) {
      els.closeBtn.focus();
    }
  });
}

init();

// Файл — ES-модуль (без експортів, але з `export {}`), щоб топ-рівневий `init`
// не «конфліктував» з таким самим у `order-form.ts` під час `tsc --noEmit`.
export {};