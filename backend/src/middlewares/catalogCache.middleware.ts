import type { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';

const TTL_MS = 60 * 1000;
const MAX_ENTRIES = 500;

interface Entry {
  expires: number;
  body: unknown;
}

const store = new Map<string, Entry>();

/**
 * Class and chapter lists carry counts of students, terms, games and tests, so a teacher's write anywhere
 * in the API can make them stale. Clearing after the response also drops anything a concurrent read cached.
 * Only successful teacher writes clear it: otherwise anonymous junk POSTs could flush the cache on every
 * request and push all catalog reads onto the database. Student self-registration may show stale counts
 * for at most TTL_MS.
 */
export const invalidateCatalogOnWrite = (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    res.on('finish', () => {
      if (res.statusCode < 400 && req.user?.role === Role.TEACHER) store.clear();
    });
  }
  next();
};

/**
 * In-memory cache for read-only catalog responses (classes, chapters, term lists) that are identical
 * for every visitor. Any write through the same middleware clears it, so teachers see their edits at once.
 * `Cache-Control: no-cache` lets browsers revalidate with the ETag instead of re-downloading.
 */
export const catalogCache =
  (shouldCache: (req: Request) => boolean = () => true) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (!shouldCache(req)) return next();

    const key = req.originalUrl;
    const hit = store.get(key);
    res.setHeader('Cache-Control', 'no-cache');

    if (hit && hit.expires > Date.now()) {
      return res.status(200).json(hit.body);
    }

    const json = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode === 200) {
        if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value as string);
        store.set(key, { expires: Date.now() + TTL_MS, body });
      }
      return json(body);
    };
    return next();
  };
