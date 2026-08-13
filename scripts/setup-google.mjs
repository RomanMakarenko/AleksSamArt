#!/usr/bin/env node
/**
 * `npm run setup:google` — отримує GOOGLE_REFRESH_TOKEN для доступу до Google Drive
 * (читання робіт із публічної папки). Запускається ОДИН раз після того, як у `.env`
 * задано `GOOGLE_CLIENT_ID` і `GOOGLE_CLIENT_SECRET`.
 *
 * Перед запуском у Google Cloud Console:
 *   1. OAuth consent screen → статус **Production** (інакше refresh token живе 7 днів),
 *      scope: `https://www.googleapis.com/auth/drive.readonly`.
 *   2. Credentials → Create OAuth client ID (Desktop app) → додайте redirect URI:
 *      `http://localhost:8787`.
 *   3. Вставте client id/secret у `.env`.
 *
 * Що робить скрипт:
 *   - відкриває сторінку згоди Google у браузері;
 *   - ловить код авторизації на локальному сервері (localhost:8787);
 *   - обмінює код на токени і ДОПИСУЄ `GOOGLE_REFRESH_TOKEN` у `.env`
 *     (не чіпаючи решту змінних).
 */

import { createServer } from 'node:http';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

// Порт/redirect URI можна перевизначити: `--port 3000` або env `GOOGLE_REDIRECT_URI`.
// Має ЗБІГАТИСЯ з «Authorized redirect URIs» у Google Cloud Console (без трейлінг-слеша).
const PORT_ARG = Number(process.argv.find((a) => /^\d+$/.test(a)));
const PORT = Number.isInteger(PORT_ARG) && PORT_ARG > 0 ? PORT_ARG : 8787;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}`;
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(rootDir, '.env');

// ─── .env: читання та оновлення ──────────────────────────────────────────

function loadEnvValues() {
  const values = {};
  if (!existsSync(envPath)) return values;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match) values[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return values;
}

/** Замінює/додає рядок `KEY=value`, зберігаючи коментарі та порядок. */
function upsertEnvKey(content, key, value) {
  const lines = content.split('\n');
  let found = false;
  const out = lines.map((line) => {
    if (!found && line.trim().startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) out.push(`${key}=${value}`);
  return out.join('\n');
}

// ─── Браузер ─────────────────────────────────────────────────────────────

function openBrowser(url) {
  const commands = {
    darwin: ['open', [url]],
    win32: ['cmd', ['/c', 'start', url]],
    default: ['xdg-open', [url]],
  };
  const [cmd, args] = commands[process.platform] || commands.default;
  try {
    spawn(cmd, args, { stdio: 'ignore' });
  } catch {
    console.log('Відкрийте URL у браузері вручну:\n  ' + url);
  }
}

// ─── OAuth-обмін ─────────────────────────────────────────────────────────

/** Запускає локальний сервер і чекає redirect з `?code=...`. */
function waitForAuthCode(authUrl) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, REDIRECT_URI);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Помилка авторизації: ${error}\nМожна закрити вкладку.`);
        server.close();
        reject(new Error(`Google повернув помилку: ${error}`));
        return;
      }
      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h3>Готово! Токен записано у .env — вкладку можна закрити.</h3>');
        server.close();
        resolvePromise(code);
        return;
      }
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Немає коду авторизації в URL.');
    });

    server.on('error', (err) => {
      reject(new Error(`Не вдалося запустити сервер на порту ${PORT}: ${err.message}`));
    });
    server.listen(PORT, () => {
      console.log(`Очікую redirect на ${REDIRECT_URI}…`);
      openBrowser(authUrl);
    });

    // Таймаут: якщо користувач не авторизувався за 2 хвилини.
    const timer = setTimeout(() => {
      server.close();
      reject(new Error('Таймаут: авторизацію не завершено за 2 хвилини.'));
    }, 120_000);
    timer.unref();
  });
}

// ─── Головний потік ──────────────────────────────────────────────────────

async function main() {
  const env = loadEnvValues();
  const clientId = env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';

  if (!clientId || !clientSecret) {
    console.error('❌ У .env не задано GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.');
    console.error('');
    console.error('Як налаштувати (Google Cloud Console):');
    console.error('  1. APIs & Services → OAuth consent screen → статус **Production**.');
    console.error('     Scope: ' + SCOPES);
    console.error('  2. Credentials → Create OAuth client ID (Desktop app).');
    console.error('  3. Додайте redirect URI: ' + REDIRECT_URI);
    console.error('  4. Вставте в .env:');
    console.error('     GOOGLE_CLIENT_ID=...');
    console.error('     GOOGLE_CLIENT_SECRET=...');
    process.exit(1);
  }

  const authUrl =
    AUTH_URL +
    '?' +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES,
      access_type: 'offline',
      prompt: 'consent', // гарантує видачу refresh_token при кожній авторизації
      include_granted_scopes: 'true',
    }).toString();

  const code = await waitForAuthCode(authUrl);

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();

  if (!res.ok || !data.refresh_token) {
    console.error('❌ Не вдалося обміняти код на токени:', res.status, JSON.stringify(data));
    console.error('Підказка: перевірте client id/secret і що redirect URI збігається з ' + REDIRECT_URI + '.');
    process.exit(1);
  }

  const content = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  writeFileSync(envPath, upsertEnvKey(content, 'GOOGLE_REFRESH_TOKEN', data.refresh_token), 'utf8');

  console.log('✅ GOOGLE_REFRESH_TOKEN записано у .env');
  console.log('');
  console.log('Наступний крок — скопіюйте токен у Netlify (Site settings → Environment variables):');
  console.log('  GOOGLE_REFRESH_TOKEN=' + data.refresh_token);
  console.log('');
  console.log('Також задайте в Netlify: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET і');
  console.log('GOOGLE_DRIVE_FOLDER_ID (ID кореневої папки з роботами).');
}

main().catch((err) => {
  console.error('❌ ' + err.message);
  process.exit(1);
});