import axios from 'axios';

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      const message = data.message;
      if (typeof message === 'string' && message) return message;
      if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
        return message.join('. ');
      }
    }
  }
  return error instanceof Error && error.message ? error.message : fallback;
};
