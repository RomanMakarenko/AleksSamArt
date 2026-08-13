/**
 * Модальна форма «Замовити»/«Купити» — клієнтська логіка (етап 5).
 *
 * Підключається в `OrderForm.astro` через `<script>` і працює тільки в браузері.
 * Переклади та параметри (валюта, заголовки, тексти кнопок/помилок) приходять
 * із `data-*` атрибутів модального вікна — як `data-counter-format` у лайтбоксі.
 *
 * Виконує:
 *  - відкриття за кнопками `[data-order-button]` / `[data-buy-button]`; назва
 *    та ціна роботи читаються з картки `[data-work-card]` (`data-work-name`,
 *    `data-work-price`);
 *  - два потоки:
 *    • **«Замовити»** — розмір (A4/A3/A2) → ціна автоматично; «Свій розмір» →
 *      ціна договірна; поле фото — обов'язкове для замовлення та точної ціни;
 *    • **«Купити»** — фіксована ціна за твір (з `ARTWORK_PRICES`), без розміру;
 *  - автопідстановку назви роботи, ціни, заголовка та тексту кнопки сабміту;
 *  - AJAX-надсилання через **Netlify Forms** (fetch із FormData, включаючи фото);
 *  - валідацію обов'язкових полів (ім'я, email) з повідомленням зі словника;
 *  - стан «надіслано» (форма замінюється підтвердженням) та обробку помилки;
 *  - закриття: Esc, кнопка «×», клік поза діалогом; блокування скролу;
 *  - фокус: на відкритті — на кнопку закриття; trap у межах модалки;
 *    на закритті — повернення на кнопку, з якої відкрили.
 */

/** Режим форми: індивідуальне замовлення або купівля готової роботи. */
type Mode = 'order' | 'buy';

function init(): void {
  // Runtime-guard: якщо розмітки немає — форма просто не підключається.
  const modalRoot = document.querySelector<HTMLElement>('[data-order-modal]');
  const formRoot = modalRoot?.querySelector<HTMLFormElement>('[data-order-form]');
  if (!modalRoot || !formRoot) return;

  // Не-null аліаси: hoisted-функції (open/close/trapFocus) «не бачать» звуження
  // після guard (функція-декларація може викликатись до нього), тому типи
  // звужуємо тут — далі modal/form уже гарантовано не-null.
  const modal = modalRoot;
  const form = formRoot;

  // Усі елементи гарантовані статичною розміткою `OrderForm.astro` — non-null.
  const sizeInputs = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="size"]'));
  const priceValue = form.querySelector<HTMLElement>('[data-order-price-value]')!;
  const priceRow = form.querySelector<HTMLElement>('[data-order-price-row]')!;
  const sizesBlock = form.querySelector<HTMLElement>('[data-order-sizes]')!;
  const photoBlock = form.querySelector<HTMLElement>('[data-order-photo]')!;
  const photoInput = form.querySelector<HTMLInputElement>('[data-order-photo-input]')!;
  const workInput = form.querySelector<HTMLInputElement>('[data-order-work]')!;
  const modeInput = form.querySelector<HTMLInputElement>('[data-order-mode]')!;
  const priceInput = form.querySelector<HTMLInputElement>('[data-order-price]')!;
  const titleEl = modal.querySelector<HTMLElement>('[data-order-title-text]')!;
  const workNameEl = modal.querySelector<HTMLElement>('[data-order-work-name]')!;
  const submitBtn = form.querySelector<HTMLButtonElement>('[data-order-submit]')!;
  const errorEl = form.querySelector<HTMLElement>('[data-order-error]')!;
  const successPanel = modal.querySelector<HTMLElement>('[data-order-success]')!;
  const successText = modal.querySelector<HTMLElement>('[data-order-success-text]')!;
  const closeBtn = modal.querySelector<HTMLButtonElement>('[data-order-close]')!;

  // Переклади/параметри з атрибутів модалки (будь-який може бути порожнім).
  const d = modal.dataset;
  const currency = d.currency ?? '';
  const orderTitle = d.orderTitle ?? '';
  const buyTitle = d.buyTitle ?? '';
  const submitOrder = d.submitOrder ?? '';
  const buyWithPrice = d.buyWithPrice ?? '';
  const success = d.success ?? '';
  const error = d.error ?? '';
  const required = d.required ?? '';
  const negotiable = d.negotiable ?? '';

  let mode: Mode | null = null; // null — форма закрита
  let trigger: HTMLElement | null = null; // кнопка, з якої відкрили
  let buyPrice: number | null = null;

  /** Форматує ціну з валютою: «100 USD». */
  function formatPrice(price: number): string {
    return `${price} ${currency}`.trim();
  }

  /** Ціна вибраного розміру; null для «Свого розміру» (ціна договірна). */
  function selectedSizePrice(): number | null {
    const checked = sizeInputs.find((input) => input.checked);
    if (!checked) return null;
    if (checked.dataset.sizeCustom !== undefined) return null;
    const price = Number(checked.dataset.sizePrice);
    return Number.isFinite(price) ? price : null;
  }

  /** Оновлює рядок ціни та текст кнопки сабміту за поточним станом. */
  function renderPrice(): void {
    if (mode === 'buy') {
      submitBtn.textContent = buyWithPrice.replace('{price}', formatPrice(buyPrice ?? 0));
      return;
    }
    const price = selectedSizePrice();
    priceValue.textContent = price === null ? negotiable : formatPrice(price);
    submitBtn.textContent = submitOrder;
  }

  /** Відкриває форму в режимі `next` для роботи `workName`; `price` — для «Купити». */
  function open(next: Mode, workName: string, price: number | null): void {
    if (mode !== null) return; // вже відкрита
    mode = next;
    trigger = document.activeElement as HTMLElement;
    buyPrice = price;

    titleEl.textContent = next === 'order' ? orderTitle : buyTitle;
    workNameEl.textContent = workName;
    workInput.value = workName;
    modeInput.value = next;
    priceInput.value = '';

    // Режим-залежні блоки: для «Купити» розмір і фото не потрібні
    // (disabled — щоб поля не потрапили в FormData).
    const isBuy = next === 'buy';
    sizesBlock.hidden = isBuy;
    photoBlock.hidden = isBuy;
    priceRow.hidden = isBuy;
    sizeInputs.forEach((input) => (input.disabled = isBuy));
    photoInput.disabled = isBuy;

    // Скидання до початкового стану (перший розмір відмічено в HTML).
    form.reset();
    errorEl.hidden = true;
    successPanel.hidden = true;
    form.hidden = false;
    renderPrice();

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('scroll-locked');
    closeBtn.focus();
  }

  /** Закриває форму і повертає фокус на кнопку, з якої відкрили. */
  function close(): void {
    if (mode === null) return;
    mode = null;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('scroll-locked');
    trigger?.focus();
    trigger = null;
  }

  /** Показує повідомлення про помилку (валідація або надсилання). */
  function showError(message: string): void {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  /** Чи елемент форми вимкнений (для focus trap) — `disabled` є лише в полів форм. */
  function isFormControlDisabled(el: HTMLElement): boolean {
    return 'disabled' in el && Boolean((el as HTMLInputElement).disabled);
  }

  /** Tab не виходить за межі модалки (видимі, не вимкнуті елементи). */
  function trapFocus(event: KeyboardEvent): void {
    const focusables = Array.from(
      modal.querySelectorAll<HTMLElement>('button, input, textarea, select, [href]'),
    ).filter((el) => !isFormControlDisabled(el) && el.offsetParent !== null);
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

  // ─── Відкриття: кнопки «Замовити» / «Купити» ────────────────────────────

  document.addEventListener('click', (event) => {
    const target = event.target as Element | null;
    const card = target?.closest<HTMLElement>('[data-work-card]');
    if (!target || !card) return;
    const workName = card.dataset.workName ?? '';
    if (target.closest('[data-order-button]')) {
      open('order', workName, null);
    } else if (target.closest('[data-buy-button]')) {
      const raw = card.dataset.workPrice ?? '';
      const price = raw ? Number(raw) : NaN;
      open('buy', workName, Number.isFinite(price) ? price : null);
    }
  });

  // ─── Керування всередині модалки ─────────────────────────────────────────

  modal.addEventListener('click', (event) => {
    const el = event.target as HTMLElement;
    if (el === modal) {
      close(); // клік по підкладці (поза діалогом)
    } else if (el.closest('[data-order-close]')) {
      close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (mode === null) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      trapFocus(event);
    }
  });

  // Страховка focus trap: фокус не повинен піти за межі модалки.
  document.addEventListener('focusin', (event) => {
    if (mode !== null && !modal.contains(event.target as Node)) {
      closeBtn.focus();
    }
  });

  // Розмір → ціна автоматично.
  form.addEventListener('change', (event) => {
    if ((event.target as HTMLInputElement).name === 'size') renderPrice();
  });

  // ─── Надсилання через Netlify Forms (AJAX) ──────────────────────────────

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const nameEl = form.elements.namedItem('name') as HTMLInputElement;
    const emailEl = form.elements.namedItem('email') as HTMLInputElement;
    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    if (!name || !email) {
      showError(required);
      nameEl.focus();
      return;
    }

    // Приховане поле ціни — під поточний стан (для «Свого розміру» — порожнє).
    priceInput.value = mode === 'buy' ? String(buyPrice ?? '') : String(selectedSizePrice() ?? '');

    errorEl.hidden = true;
    submitBtn.disabled = true;
    try {
      const data = new FormData(form);
      const response = await fetch(window.location.pathname, { method: 'POST', body: data });
      if (!response.ok) throw new Error(String(response.status));
      successText.textContent = success;
      form.hidden = true;
      successPanel.hidden = false;
      closeBtn.focus(); // фокус лишається в межах модалки (форма прихована)
    } catch {
      showError(error);
    } finally {
      submitBtn.disabled = false;
    }
  });
}

init();

// Файл — ES-модуль (без експортів, але з `export {}`), щоб топ-рівневий `init`
// не «конфліктував» із таким самим у `lightbox.ts` під час `tsc --noEmit`.
export {};