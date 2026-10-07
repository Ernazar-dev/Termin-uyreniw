import rateLimit from 'express-rate-limit';

const limitMessage = (message: string) => ({ success: false, message });

/** Outer safety net for every request, including static uploads. */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage('Sorawlar sanı kóp. Birazdan qaytalań'),
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage('Sorawlar sanı kóp. Birazdan qaytalań'),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage('Kiriw urınıwları kóp. 15 minuttan keyin qaytalań'),
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage('Járdemshige sorawlar kóp. Bir minuttan keyin qaytalań'),
});

export const submitLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage('Juwap jiberiwler sanı kóp. 5 minuttan keyin qaytalań'),
});
