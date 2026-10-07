import type { NextFunction, Request, Response } from 'express';

const TTL_MS = 60 * 1000;
const MAX_ENTRIES = 500;

interface Entry {
  expires: number;
  body: unknown;
}

const store = new Map<string, Entry>();

/**
 * Class and chapter lists carry counts of students, terms, games and tests, so a write anywhere in the API
 * can make them stale. Clears the cache both when a write arrives and after it has finished, so a read
 * that happens in between cannot re-cache old data.
 */
export const invalidateCatalogOnWrite = (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    store.clear();
    res.on('finish', () => store.clear());
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
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      store.clear();
      return next();
    }
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
