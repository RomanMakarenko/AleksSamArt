import type { Dictionary } from './dictionary';

export const en: Dictionary = {
  meta: {
    description:
      'Portfolio of artist AleksSamArt: order a custom painting or buy an existing artwork.',
  },
  hero: {
    tagline: 'Portfolio of artist AleksSamArt',
    subtitle: 'Order a custom painting or buy an existing artwork.',
  },
  langSwitcher: {
    label: 'Language',
  },
  footer: {
    rights: 'All rights reserved',
  },
  work: {
    orderButton: 'Order',
    buyButton: 'Buy',
    soldBadge: 'Sold',
  },
  dots: {
    label: 'Works navigation',
  },
  lightbox: {
    close: 'Close',
    prev: 'Previous photo',
    next: 'Next photo',
    open: 'Open photos: {work}',
    counter: '{current} / {total}',
  },
  form: {
    orderTitle: 'Order a painting',
    buyTitle: 'Buy an artwork',
    name: 'Name',
    email: 'Email',
    size: 'Size',
    comment: 'Comment',
    submitOrder: 'Send order',
    buyWithPrice: 'Buy for {price}',
    success:
      'Thank you! Your order has been sent. We will get in touch with you soon.',
    error: 'Failed to send the form. Please try again.',
    required: 'Please fill in the required fields: name and email.',
  },
};