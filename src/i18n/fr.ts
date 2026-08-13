import type { Dictionary } from './dictionary';

export const fr: Dictionary = {
  meta: {
    description:
      'Portfolio de l’artiste AleksSamArt : commander un tableau sur mesure ou acheter une œuvre existante.',
  },
  hero: {
    tagline: 'Portfolio de l’artiste AleksSamArt',
    subtitle: 'Commander un tableau sur mesure ou acheter une œuvre existante.',
  },
  langSwitcher: {
    label: 'Langue',
  },
  footer: {
    rights: 'Tous droits réservés',
  },
  work: {
    orderButton: 'Commander',
    buyButton: 'Acheter',
    soldBadge: 'Vendu',
  },
  dots: {
    label: 'Navigation des œuvres',
  },
  lightbox: {
    close: 'Fermer',
    prev: 'Photo précédente',
    next: 'Photo suivante',
    open: 'Ouvrir les photos : {work}',
    counter: '{current} / {total}',
  },
  form: {
    orderTitle: 'Commander un tableau',
    buyTitle: 'Acheter une œuvre',
    name: 'Nom',
    email: 'E-mail',
    size: 'Format',
    comment: 'Commentaire',
    submitOrder: 'Envoyer la commande',
    buyWithPrice: 'Acheter pour {price}',
    success:
      'Merci ! Votre commande a été envoyée. Nous vous contacterons très vite.',
    error: 'Impossible d’envoyer le formulaire. Veuillez réessayer.',
    required: 'Veuillez remplir les champs obligatoires : nom et e-mail.',
  },
};