import { isAxiosError } from 'axios';
import type { ApiFailure } from '../types/api';

const NETWORK_ERROR = 'Server menen baylanıs joq. Internetti tekserip, qaytadan urınıp kóriń';
const UNKNOWN_ERROR = 'Kútilmegen qátelik júz berdi';

export const getErrorMessage = (error: unknown): string => {
  if (isAxiosError<ApiFailure>(error)) {
    if (!error.response) return NETWORK_ERROR;
    return error.response.data?.message || UNKNOWN_ERROR;
  }
  if (error instanceof Error && error.message) return error.message;
  return UNKNOWN_ERROR;
};
