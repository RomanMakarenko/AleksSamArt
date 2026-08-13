import type { Dictionary } from './dictionary';

export const sv: Dictionary = {
  meta: {
    description:
      'Portfolio av konstnären AleksSamArt: beställ en personlig tavla eller köp ett färdigt verk.',
  },
  hero: {
    tagline: 'Portfolio av konstnären AleksSamArt',
    subtitle: 'Beställ en personlig tavla eller köp ett färdigt verk.',
  },
  langSwitcher: {
    label: 'Språk',
  },
  footer: {
    rights: 'Alla rättigheter förbehållna',
  },
  work: {
    orderButton: 'Beställ',
    buyButton: 'Köp',
    soldBadge: 'Såld',
  },
  dots: {
    label: 'Navigering mellan verk',
  },
  lightbox: {
    close: 'Stäng',
    prev: 'Föregående foto',
    next: 'Nästa foto',
    open: 'Öppna foton: {work}',
    counter: '{current} / {total}',
  },
  form: {
    orderTitle: 'Beställ en tavla',
    buyTitle: 'Köp ett konstverk',
    name: 'Namn',
    email: 'E-post',
    size: 'Storlek',
    comment: 'Kommentar',
    submitOrder: 'Skicka beställning',
    buyWithPrice: 'Köp för {price}',
    success:
      'Tack! Din beställning har skickats. Vi kontaktar dig inom kort.',
    error: 'Det gick inte att skicka formuläret. Försök igen.',
    required: 'Fyll i de obligatoriska fälten: namn och e-post.',
  },
};