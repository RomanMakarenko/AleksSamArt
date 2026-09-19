/**
 * Модальна форма «Замовити»/«Купити» — клієнтська логіка (етап 5).
 *
 * Підключається в `OrderForm.astro` через `<script>` і працює тільки в браузері.
 * Переклади та параметри (валюта, заголовки, тексти кнопок/помилок) приходять
 * із `data-*` атрибутів модального вікна — як `data-counter-format` у лайтбоксі.
 *
 * Виконує:
 *  - відкриття за кнопками `[data-order-button]` / `[data-buy-button]`; назва
 *    роботи читається з картки `[data-work-card]` (`data-work-name`);
 *  - два потоки:
 *    • **«Замовити»** — формат і кількість людей → ціна автоматично; «Свій розмір» →
 *      ціна договірна; поле фото — обов'язкове для замовлення та точної ціни;
 *    • **«Купити»** — купівля готової роботи: ціна з `data-buy-price` або
 *      `data-portrait-price`, без вибору розміру та фото;
 *  - автопідстановку назви роботи, ціни, заголовка та тексту кнопки сабміту;
 *  - AJAX-надсилання через **Netlify Forms** (fetch із FormData, включаючи фото);
 *  - валідацію обов'язкових полів (ім'я, email) з повідомленням зі словника;
 *  - перевірку email за структурою (регекс `EMAIL_RE`) після введення та на сабміті;
 *  - стан «надіслано» (форма замінюється підтвердженням) та обробку помилки;
 *  - закриття: Esc, кнопка «×», клік поза діалогом; блокування скролу;
 *  - фокус: на відкритті — на кнопку закриття; trap у межах модалки;
 *    на закритті — повернення на кнопку, з якої відкрили.
 */

/** Режим форми: індивідуальне замовлення або купівля готової роботи. */
type Mode = 'order' | 'buy';

/**
 * Регекс структури email: local@domain.tld.
 * Локальна частина — літери/цифри/крапка/підкреслення/%/+-; домен — з крапкою;
 * TLD — латиниця, 2+ літери.
 */
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
  const sizePriceValues = Array.from(form.querySelectorAll<HTMLElement>('[data-size-price-value]'));
  const priceValue = form.querySelector<HTMLElement>('[data-order-price-value]')!;
  const formatValue = form.querySelector<HTMLElement>('[data-order-format]')!;
  const priceRow = form.querySelector<HTMLElement>('[data-order-price-row]')!;
  const sizesBlock = form.querySelector<HTMLElement>('[data-order-sizes]')!;
  const photoBlock = form.querySelector<HTMLElement>('[data-order-photo]')!;
  const photoInput = form.querySelector<HTMLInputElement>('[data-order-photo-input]')!;
  const timingNote = modal.querySelector<HTMLElement>('[data-order-timing]')!;
  const emailInput = form.querySelector<HTMLInputElement>('input[name="email"]')!;
  const workInput = form.querySelector<HTMLInputElement>('[data-order-work]')!;
  const modeInput = form.querySelector<HTMLInputElement>('[data-order-mode]')!;
  const priceInput = form.querySelector<HTMLInputElement>('[data-order-price]')!;
  const currencyInput = form.querySelector<HTMLInputElement>('[data-order-currency]')!;
  const regionInput = form.querySelector<HTMLInputElement>('[data-order-region]')!;
  const titleEl = modal.querySelector<HTMLElement>('[data-order-title-text]')!;
  const submitBtn = form.querySelector<HTMLButtonElement>('[data-order-submit]')!;
  const errorEl = form.querySelector<HTMLElement>('[data-order-error]')!;
  const successPanel = modal.querySelector<HTMLElement>('[data-order-success]')!;
  const successText = modal.querySelector<HTMLElement>('[data-order-success-text]')!;
  const closeBtn = modal.querySelector<HTMLButtonElement>('[data-order-close]')!;

  // Переклади/параметри з атрибутів модалки (будь-який може бути порожнім).
  const d = modal.dataset;
  const currencies = {
    ua: d.currencyUa ?? 'UAH',
    international: d.currencyInternational ?? 'EUR',
  } as const;
  const artworkCurrency = d.artworkCurrency ?? 'EUR';
  const orderTitle = d.orderTitle ?? '';
  const buyTitle = d.buyTitle ?? '';
  const submitOrder = d.submitOrder ?? '';
  const buyWithPrice = d.buyWithPrice ?? '';
  const success = d.success ?? '';
  const error = d.error ?? '';
  const required = d.required ?? '';
  const emailInvalid = d.emailInvalid ?? '';
  const negotiable = d.negotiable ?? '';
  const artworkFormat = d.artworkFormat ?? '';
  // Стандартна ціна купівлі («Купити») — з `data-portrait-price`.
  let pricingRegion: 'ua' | 'international' = 'international';

  let mode: Mode | null = null; // null — форма закрита
  let trigger: HTMLElement | null = null; // кнопка, з якої відкрили
  let buyPrice: number | null = null;
  let buyFormat = '';

  /** Форматує ціну з валютою: «100 EUR» або «2000 UAH». */
  function formatPrice(price: number, currency: string): string {
    return `${price} ${currency}`.trim();
  }

  function browserPricingRegion(): 'ua' | 'international' {
    // Ручний вибір української мови має пріоритет над мовами браузера.
    // Це важливо, зокрема, для користувача з російською мовою браузера,
    // який обрав українську локаль на сайті.
    const selectedLanguage = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith('lang='))
      ?.slice('lang='.length);
    if (selectedLanguage === 'uk') return 'ua';

    const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
    return languages.some((language) => {
      const tag = (language || '').toLowerCase();
      return tag === 'uk' || tag.startsWith('uk-') || /[-_]ua(?:[-_]|$)/.test(tag);
    })
      ? 'ua'
      : 'international';
  }

  function currencyForMode(): string {
    return mode === 'buy' ? artworkCurrency : currencies[pricingRegion];
  }

  /** Ціна вибраного розміру; null для «Свого розміру» (ціна договірна). */
  function selectedSizePrice(): number | null {
    const checked = sizeInputs.find((input) => input.checked);
    if (!checked) return null;
    if (checked.dataset.sizeCustom !== undefined) return null;
    const key = pricingRegion === 'ua' ? 'priceUa' : 'priceInternational';
    const price = Number(checked.dataset[key]);
    return Number.isFinite(price) ? price : null;
  }

  function renderSizePrices(): void {
    const key = pricingRegion === 'ua' ? 'priceUa' : 'priceInternational';
    sizeInputs.forEach((input, index) => {
      const value = Number(input.dataset[key]);
      if (Number.isFinite(value) && sizePriceValues[index]) {
        sizePriceValues[index].textContent = formatPrice(value, currencies[pricingRegion]);
      }
    });
  }

  /** Оновлює рядок ціни та текст кнопки сабміту за поточним станом. */
  function renderPrice(): void {
    renderSizePrices();
    if (mode === 'buy') {
      const price = formatPrice(buyPrice ?? 0, artworkCurrency);
      priceValue.textContent = price;
      formatValue.textContent = artworkFormat.replace('{format}', buyFormat);
      submitBtn.textContent = buyWithPrice.replace('{price}', price);
      return;
    }
    const price = selectedSizePrice();
    priceValue.textContent = price === null ? negotiable : formatPrice(price, currencies[pricingRegion]);
    formatValue.textContent = '';
    submitBtn.textContent = submitOrder;
  }

  /** Відкриває форму в режимі `next` для роботи `workName`; `price` — для «Купити». */
  function open(next: Mode, workName: string, price: number | null, format = ''): void {
    if (mode !== null) return; // вже відкрита
    mode = next;
    trigger = document.activeElement as HTMLElement;
    buyPrice = price;
    buyFormat = format;
    pricingRegion = browserPricingRegion();

    titleEl.textContent = next === 'order' ? orderTitle : buyTitle;

    // Режим-залежні блоки: для «Купити» не потрібні ні вибір розміру, ні фото
    // (disabled — щоб поля не потрапили в FormData). Рядок ціни лишається:
    // купівля — ціна з конфігу готових робіт.
    const isBuy = next === 'buy';
    sizesBlock.hidden = isBuy;
    sizeInputs.forEach((input) => (input.disabled = isBuy));
    photoBlock.hidden = isBuy;
    photoInput.disabled = isBuy;
    timingNote.hidden = isBuy;
    priceRow.hidden = false;

    // Скидання до початкового стану (перший розмір відмічено в HTML).
    form.reset();
    // form.reset() також очищує hidden-поля, тому повертаємо контекст заявки.
    workInput.value = workName;
    modeInput.value = next;
    priceInput.value = '';
    currencyInput.value = currencyForMode();
    regionInput.value = next === 'buy' ? 'international' : pricingRegion;
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
      const buyButton = target.closest<HTMLElement>('[data-buy-button]');
      const price = buyButton?.dataset.buyPrice ? Number(buyButton.dataset.buyPrice) : null;
      const format = buyButton?.dataset.buyFormat ?? '';
      if (price !== null && Number.isFinite(price)) open('buy', workName, price, format);
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

  // Перевірка email за структурою (регекс) після введення: коли користувач
  // залишає поле (blur) — показуємо помилку, якщо значення не відповідає регексу.
  emailInput.addEventListener('blur', () => {
    const email = emailInput.value.trim();
    if (email && !EMAIL_RE.test(email)) showError(emailInvalid);
  });

  // Коли користувач виправляє email і формат стає валідним — прибираємо помилку.
  emailInput.addEventListener('input', () => {
    if (EMAIL_RE.test(emailInput.value.trim())) errorEl.hidden = true;
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
    if (!EMAIL_RE.test(email)) {
      showError(emailInvalid);
      emailEl.focus();
      return;
    }

    // Приховані поля ціни/валюти — під поточний стан.
    priceInput.value = mode === 'buy' ? String(buyPrice ?? '') : String(selectedSizePrice() ?? '');
    currencyInput.value = currencyForMode();
    regionInput.value = mode === 'buy' ? 'international' : pricingRegion;

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