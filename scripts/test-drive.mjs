// Юніт-тест логіки доступу до Google Drive (без мережі — fetch замоковано).
// Запуск: npm run test:drive  (потрібен Node ≥ 22.6: --experimental-strip-types)
import assert from 'node:assert/strict';
import {
  listWorks,
  parseWorkFiles,
  isSold,
  cleanWorkName,
  driveImageUrl,
  isMainFile,
  naturalCompare,
  DriveError,
} from '../src/lib/drive.ts';
import { getWorksForBuild, getWorksRuntime } from '../src/lib/works.ts';

const FOLDER = 'application/vnd.google-apps.folder';
let passed = 0;

function eq(actual, expected, msg) {
  assert.deepEqual(actual, expected, msg);
  passed++;
  console.log('  ✓ ' + msg);
}

function ok(cond, msg) {
  assert.ok(cond, msg);
  passed++;
  console.log('  ✓ ' + msg);
}

// ─── Імітація Google Drive API ───────────────────────────────────────────

/** База даних «Drive» для мока. Папки кореня вже відсортовані за назвою (як orderBy=name). */
const FILES_DB = {
  root: [
    { id: 'f-ave', name: 'Ave Maria', mimeType: FOLDER },
    { id: 'f-sold', name: 'SOLD-Kvitka', mimeType: FOLDER },
    { id: 'f-more', name: 'More', mimeType: FOLDER },
  ],
  'f-ave': [
    { id: 'img-01', name: '01-stage.jpg', mimeType: 'image/jpeg' },
    { id: 'img-00', name: '00-main.jpg', mimeType: 'image/jpeg' },
    { id: 'img-02', name: '02-angle.png', mimeType: 'image/png' },
    { id: 'readme', name: 'opis.txt', mimeType: 'text/plain' },
  ],
  'f-more': [
    { id: 'img-10', name: '10-far.jpg', mimeType: 'image/jpeg' },
    { id: 'img-2', name: '2-detail.jpg', mimeType: 'image/jpeg' },
  ],
  'f-sold': [{ id: 'img-s', name: '00-main.jpg', mimeType: 'image/jpeg' }],
};

async function mockFetch(input) {
  const url = String(input);

  if (url.includes('oauth2.googleapis.com/token')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ access_token: 'tok-123' }),
    };
  }

  if (url.includes('www.googleapis.com/drive/v3/files')) {
    const parsed = new URL(url);
    const q = parsed.searchParams.get('q') || '';
    let files = [];
    // Розрізняємо запит «папки кореня» (mimeType='...folder') і «файли роботи»
    // (mimeType!='...folder' — теж містить рядок folder, тому порівнюємо точно).
    if (q.includes(`mimeType='${FOLDER}'`)) {
      files = FILES_DB.root;
    } else {
      const parent = q.match(/'([^']+)' in parents/);
      files = FILES_DB[parent?.[1] || ''] || [];
    }
    return { ok: true, status: 200, json: async () => ({ files }) };
  }

  throw new Error('unexpected fetch URL: ' + url);
}

// ─── Тести ───────────────────────────────────────────────────────────────

console.log('Чисті функції:');
eq(driveImageUrl('abc123'), 'https://drive.google.com/uc?export=view&id=abc123', 'driveImageUrl формує uc?export=view URL');
ok(isSold('SOLD-Kvitka'), 'isSold true для SOLD-');
ok(!isSold('Ave Maria'), 'isSold false без префікса');
eq(cleanWorkName('SOLD-Kvitka'), 'Kvitka', 'cleanWorkName прибирає SOLD-');
eq(cleanWorkName('Ave Maria'), 'Ave Maria', 'cleanWorkName не міняє звичайні назви');
ok(isMainFile('00-main.jpg'), 'isMainFile true для 00-');
ok(!isMainFile('01-stage.jpg'), 'isMainFile false для 01-');
eq(['10', '2', '1'].sort(naturalCompare), ['1', '2', '10'], 'naturalCompare сортує числа як числа');

console.log('parseWorkFiles:');
const parsed = parseWorkFiles([
  { id: 'a', name: '01-stage.jpg', mimeType: 'image/jpeg' },
  { id: 'b', name: '00-main.jpg', mimeType: 'image/jpeg' },
  { id: 'c', name: '02-angle.png', mimeType: 'image/png' },
  { id: 'd', name: 'opis.txt', mimeType: 'text/plain' },
]);
eq(parsed.mainImage?.id, 'b', 'main = файл 00-*');
eq(parsed.gallery.map((f) => f.id), ['a', 'c'], 'галерея = решта зображень (без 00-, без txt)');

const fallback = parseWorkFiles([{ id: 'x', name: 'photo.jpg', mimeType: 'image/jpeg' }]);
eq(fallback.mainImage?.id, 'x', 'без 00-* main = перше зображення');
eq(fallback.gallery, [], '…і галерея порожня');

const empty = parseWorkFiles([]);
eq(empty.mainImage, null, 'без файлів main = null');
eq(empty.gallery, [], 'без файлів галерея порожня');

console.log('listWorks (fetch замоковано):');
const realFetch = globalThis.fetch;
globalThis.fetch = mockFetch;
let works;
try {
  works = await listWorks({
    clientId: 'cid',
    clientSecret: 'cs',
    refreshToken: 'rt',
    folderId: 'root',
  });
} finally {
  globalThis.fetch = realFetch;
}

eq(works.length, 2, 'SOLD-Kvitka виключено — лишилось 2 роботи');
eq(works.map((w) => w.name), ['Ave Maria', 'More'], 'порядок = порядок папок у корені');

const ave = works[0];
eq(ave.mainImage, 'https://drive.google.com/uc?export=view&id=img-00', 'mainImage = uc URL файлу 00-');
eq(ave.gallery, [
  'https://drive.google.com/uc?export=view&id=img-01',
  'https://drive.google.com/uc?export=view&id=img-02',
], 'gallery = додаткові фото (без txt)');

const more = works[1];
// У «More» немає 00-* → fallback: перше зображення стає main. Природне сортування
// ставить '2-detail.jpg' перед '10-far.jpg' (числа: 2 < 10) — отже main саме img-2.
eq(more.mainImage, 'https://drive.google.com/uc?export=view&id=img-2', 'fallback: без 00-* main = перше (природне сортування)');
eq(more.gallery, ['https://drive.google.com/uc?export=view&id=img-10'], 'галерея = решта після fallback-main');

console.log('Помилки:');
await assert.rejects(
  listWorks({ clientId: '', clientSecret: '', refreshToken: '', folderId: '' }),
  DriveError,
  'listWorks без конфігурації кидає DriveError',
);
passed++;

const buildWorks = await getWorksForBuild();
ok(buildWorks.length > 0, 'build-time fallback: без Drive → тестові роботи');
ok(buildWorks[0].mainImage?.startsWith('/test-works/'), '…з локальних тестових фото');

const runtimeWorks = await getWorksRuntime();
eq(
  runtimeWorks.map((w) => w.name),
  ['Ave Maria', 'Море', 'Захід сонця'],
  'runtime fallback: без Drive → тестові роботи (та сама форма, що з Drive)',
);

console.log(`\n✅ ${passed} перевірок пройдено.`);