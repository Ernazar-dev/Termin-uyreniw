import rateLimit from 'express-rate-limit';

const limitMessage = (message: string) => ({ success: false, message });

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
