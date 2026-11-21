const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutos

interface AttemptRecord {
  count: number;
  lockedUntil: number | null;
}

const globalForLockout = globalThis as unknown as {
  __metaLoginLockout?: Map<string, AttemptRecord>;
};

function getMap(): Map<string, AttemptRecord> {
  if (!globalForLockout.__metaLoginLockout) {
    globalForLockout.__metaLoginLockout = new Map();
  }
  return globalForLockout.__metaLoginLockout;
}

export function checkLoginLockout(key: string): {
  locked: boolean;
  remainingSeconds: number;
} {
  const map = getMap();
  const record = map.get(key.toLowerCase());
  if (!record || !record.lockedUntil) {
    return { locked: false, remainingSeconds: 0 };
  }

  const diff = record.lockedUntil - Date.now();
  if (diff <= 0) {
    map.delete(key.toLowerCase());
    return { locked: false, remainingSeconds: 0 };
  }

  return { locked: true, remainingSeconds: Math.ceil(diff / 1000) };
}

export function registerFailedLoginAttempt(key: string): {
  locked: boolean;
  attemptsLeft: number;
  remainingSeconds: number;
} {
  const map = getMap();
  const norm = key.toLowerCase();
  const current = map.get(norm) ?? { count: 0, lockedUntil: null };
  current.count += 1;

  if (current.count >= MAX_ATTEMPTS) {
    current.lockedUntil = Date.now() + LOCKOUT_MS;
    map.set(norm, current);
    return {
      locked: true,
      attemptsLeft: 0,
      remainingSeconds: Math.ceil(LOCKOUT_MS / 1000),
    };
  }

  map.set(norm, current);
  return {
    locked: false,
    attemptsLeft: MAX_ATTEMPTS - current.count,
    remainingSeconds: 0,
  };
}

export function clearLoginAttempts(key: string): void {
  getMap().delete(key.toLowerCase());
}
