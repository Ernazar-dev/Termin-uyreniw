import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { UPLOADS_DIR, UPLOADS_URL_PREFIX } from './config/constants';
import { env, isProduction } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { apiLimiter, globalLimiter } from './middlewares/rateLimit.middleware';
import { apiRouter } from './routes';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  const allowedOrigins = env.CLIENT_URL.split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  // A wildcard origin together with credentials would let any site call the API as the user.
  const allowAnyOrigin = !isProduction && allowedOrigins.includes('*');

  const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowAnyOrigin) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  };

  // Cheap flood protection first: every route below (including /uploads) is rate limited per IP.
  // The API is never meant to be indexed, so there is no public robots.txt listing anything.
  app.use((_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    next();
  });
  app.use(globalLimiter);
  app.use(compression());

  // Root health check for Render / monitoring services
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
  });
  app.get('/', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'kaa-terms-backend' });
  });

  // Uploaded images and test sheets are shown by the frontend from another origin (PDFs inside a frame),
  // so this route gets relaxed framing rules; everything else keeps the strict defaults below.
  app.use(
    UPLOADS_URL_PREFIX,
    cors(corsOptions),
    helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, frameguard: false, contentSecurityPolicy: false }),
    express.static(UPLOADS_DIR, { maxAge: '7d', index: false }),
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      xContentTypeOptions: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Handles both /api/... and direct /... requests (in case client omitted /api in VITE_API_URL)
  app.use('/api', apiLimiter, apiRouter);
  app.use(apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
