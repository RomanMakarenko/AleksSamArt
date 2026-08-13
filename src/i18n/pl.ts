import type { Dictionary } from './dictionary';

export const pl: Dictionary = {
  meta: {
    description:
      'Portfolio artysty AleksSamArt: zamów obraz na wymiar lub kup gotowe dzieło.',
  },
  hero: {
    tagline: 'Portfolio artysty AleksSamArt',
    subtitle: 'Zamów indywidualny obraz lub kup gotowe dzieło.',
  },
  langSwitcher: {
    label: 'Język',
  },
  footer: {
    rights: 'Wszelkie prawa zastrzeżone',
  },
  work: {
    orderButton: 'Zamów',
    buyButton: 'Kup',
    soldBadge: 'Sprzedane',
  },
  dots: {
    label: 'Nawigacja po pracach',
  },
  lightbox: {
    close: 'Zamknij',
    prev: 'Poprzednie zdjęcie',
    next: 'Następne zdjęcie',
    open: 'Otwórz zdjęcia: {work}',
    counter: '{current} / {total}',
  },
  form: {
    orderTitle: 'Zamów obraz',
    buyTitle: 'Kup dzieło',
    name: 'Imię',
    email: 'E-mail',
    size: 'Rozmiar',
    comment: 'Komentarz',
    submitOrder: 'Wyślij zamówienie',
    buyWithPrice: 'Kup za {price}',
    success:
      'Dziękujemy! Twoje zamówienie zostało wysłane. Skontaktujemy się z Tobą wkrótce.',
    error: 'Nie udało się wysłać formularza. Spróbuj ponownie.',
    required: 'Wypełnij obowiązkowe pola: imię i e-mail.',
  },
};