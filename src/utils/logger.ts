const isDev = __DEV__

export const logger = {
  log: (...args: any[]) => isDev && console.log(...args),
  warn: (...args: any[]) => isDev && console.warn(...args),
  error: (...args: any[]) => { if(isDev) console.error(...args) /* else Sentry.captureException */ },
}
