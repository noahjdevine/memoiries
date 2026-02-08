type LogMeta = Record<string, unknown>;

const formatMeta = (meta?: LogMeta) => (meta ? ` ${JSON.stringify(meta)}` : '');

export const logger = {
  info: (message: string, meta?: LogMeta) => {
    console.log(`[Memoiries] ${message}${formatMeta(meta)}`);
  },
  warn: (message: string, meta?: LogMeta) => {
    console.warn(`[Memoiries] ${message}${formatMeta(meta)}`);
  },
  error: (message: string, meta?: LogMeta) => {
    console.error(`[Memoiries] ${message}${formatMeta(meta)}`);
  },
};
