type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogFn = (message: string, context?: Record<string, unknown>) => void

type Logger = Record<LogLevel, LogFn>

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const payload = context ?? ''
  switch (level) {
    case 'debug':
    case 'info':
      if (process.env.NODE_ENV !== 'production') console.warn(`[${level}] ${message}`, payload)
      return
    case 'warn':
      console.warn(`[warn] ${message}`, payload)
      return
    case 'error':
      console.error(`[error] ${message}`, payload)
      return
  }
}

export const logger: Logger = {
  debug: (message, context) => emit('debug', message, context),
  info: (message, context) => emit('info', message, context),
  warn: (message, context) => emit('warn', message, context),
  error: (message, context) => emit('error', message, context),
}
