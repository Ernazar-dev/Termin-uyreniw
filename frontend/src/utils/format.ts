import dayjs from 'dayjs';
import { API_ORIGIN } from '../api/axios';
import { SCORE_THRESHOLDS } from './constants';

export const formatDate = (value: string) => dayjs(value).format('DD.MM.YYYY HH:mm');
export const formatDateShort = (value: string) => dayjs(value).format('DD.MM.YYYY');

export const formatPercent = (value: number | null | undefined) =>
  value == null ? '—' : `${Number.isInteger(value) ? value : value.toFixed(1)}%`;

export const getScoreStatus = (percentage: number): 'success' | 'warning' | 'error' => {
  if (percentage >= SCORE_THRESHOLDS.good) return 'success';
  if (percentage >= SCORE_THRESHOLDS.medium) return 'warning';
  return 'error';
};

/** Uploaded images are stored as `/uploads/...` and served by the API server. */
export const resolveImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path}`;
};

export const chapterLabel = (chapter: { title: string; class: { name: string } }) =>
  `${chapter.class.name} · ${chapter.title}`;
