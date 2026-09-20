/**
 * Одноразовий контекст повернення з інформації про рамку до галереї.
 * Дані зберігаються лише в поточній вкладці й не містять полів форми.
 */

export type ReturnMode = 'order' | 'buy';
export type ReturnPricingRegion = 'ua' | 'international';

export interface OrderReturnState {
  version: 1;
  token: string;
  galleryPath: string;
  workId: string;
  mode: ReturnMode;
  sizeId: string;
  pricingRegion: ReturnPricingRegion;
  createdAt: number;
}

export const RETURN_PARAM = 'orderReturn';
const STORAGE_KEY = 'alekssamart:order-return';
const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/;
const MAX_AGE_MS = 15 * 60 * 1000;

export function createReturnToken(): string {
  try {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch {
    // Some older or restricted browsers expose crypto without randomUUID.
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function isValidReturnToken(value: string | null): value is string {
  return value !== null && TOKEN_RE.test(value);
}

export function saveOrderReturn(state: OrderReturnState): boolean {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearOrderReturn(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be disabled by browser privacy settings.
  }
}

export function readOrderReturn(token: string): OrderReturnState | null {
  if (!isValidReturnToken(token)) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!isValidState(value) || value.token !== token) return null;
    if (Date.now() - value.createdAt > MAX_AGE_MS) return null;
    return value;
  } catch {
    return null;
  }
}

function isValidState(value: unknown): value is OrderReturnState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<OrderReturnState>;
  return (
    state.version === 1 &&
    typeof state.token === 'string' &&
    isValidReturnToken(state.token) &&
    typeof state.galleryPath === 'string' &&
    state.galleryPath.startsWith('/') &&
    !state.galleryPath.startsWith('//') &&
    typeof state.workId === 'string' &&
    state.workId.length > 0 &&
    state.workId.length <= 300 &&
    (state.mode === 'order' || state.mode === 'buy') &&
    typeof state.sizeId === 'string' &&
    state.sizeId.length <= 40 &&
    (state.pricingRegion === 'ua' || state.pricingRegion === 'international') &&
    typeof state.createdAt === 'number' &&
    Number.isFinite(state.createdAt)
  );
}

export function addReturnToken(url: string, token: string): string {
  if (!isValidReturnToken(token)) return url;
  try {
    const target = new URL(url, window.location.href);
    target.searchParams.set(RETURN_PARAM, token);
    return target.toString();
  } catch {
    return url;
  }
}

export function removeReturnToken(url: string): string {
  try {
    const target = new URL(url, window.location.href);
    target.searchParams.delete(RETURN_PARAM);
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return url;
  }
}

export function currentPathWithoutReturnToken(): string {
  return removeReturnToken(`${window.location.pathname}${window.location.search}${window.location.hash}`);
}

export function currentReturnToken(): string | null {
  try {
    return new URL(window.location.href).searchParams.get(RETURN_PARAM);
  } catch {
    return null;
  }
}
