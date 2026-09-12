/**
 * Порядок робіт у стосі = порядок додавання.
 *
 * Робота, яку додали першою, стоїть вгорі; кожна наступна — нижче.
 * Список тримає цей порядок на статичному сайті (git/Netlify не зберігають
 * час створення файлів, тож сортувати «за датою» ненадійно).
 *
 * Додати роботу: покласти папку в `src/assets/works/<Назва>/` і
 * **дописати її назву в кінець цього списку** → з'явиться знизу.
 */
export const WORKS_ORDER: string[] = [
  'Robbie Williams',
  'Dua Lipa',
  'Zendaya',
  'Lenny Kravitz',
  'Valerii Zaluzhnyi',
  'Elon Musk',
  'Drew Barrymore',
  'Penelope Cruz',
  'ORDER-Racer',
  'ORDER-Guy',
  'ORDER-Girl with a baby',
  'ORDER-Boy',
  'ORDER-Couple',
];