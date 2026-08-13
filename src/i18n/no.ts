import type { Dictionary } from './dictionary';

export const no: Dictionary = {
  meta: {
    description:
      'Portefølje til kunstneren AleksSamArt: bestille et maleri på bestilling eller kjøpe et ferdig verk.',
  },
  hero: {
    tagline: 'Portefølje til kunstneren AleksSamArt',
    subtitle: 'Bestill et personlig maleri eller kjøp et ferdig verk.',
  },
  langSwitcher: {
    label: 'Språk',
  },
  footer: {
    rights: 'Alle rettigheter forbeholdt',
  },
  work: {
    orderButton: 'Bestill',
    buyButton: 'Kjøp',
    soldBadge: 'Solgt',
  },
  dots: {
    label: 'Navigasjon mellom verkene',
  },
  lightbox: {
    close: 'Lukk',
    prev: 'Forrige bilde',
    next: 'Neste bilde',
    open: 'Åpne bilder: {work}',
    counter: '{current} / {total}',
  },
  form: {
    orderTitle: 'Bestill et maleri',
    buyTitle: 'Kjøp et kunstverk',
    name: 'Navn',
    email: 'E-post',
    size: 'Størrelse',
    comment: 'Kommentar',
    submitOrder: 'Send bestilling',
    buyWithPrice: 'Kjøp for {price}',
    success:
      'Takk! Bestillingen din er sendt. Vi kontakter deg i nær fremtid.',
    error: 'Kunne ikke sende skjemaet. Prøv igjen.',
    required: 'Fyll ut de obligatoriske feltene: navn og e-post.',
  },
};