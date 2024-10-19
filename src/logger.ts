import { createLogger as winstonCreateLogger, transports, format, Logger } from "winston";

function createColorConsoleTransport() {
  return new transports.Console({
    format: format.combine(
      format.colorize({ all: true })
    )
  });
}

export function createLogger(debug: boolean, filename?: string): Logger {
  const level = debug ? 'debug' : 'info';
  const logTransports = [];
  const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
  );

  if (filename) {
    logTransports.push(new transports.File({ filename }));
  } else {
    logTransports.push(createColorConsoleTransport());
  }

  return winstonCreateLogger({
    level,
    format: logFormat,
    transports: logTransports,
  });
}

export const errorlog = winstonCreateLogger({
  level: 'error',
  transports: [
    createColorConsoleTransport(),
  ],
  format: format.combine(
    format.printf(info => `[${info.level.toUpperCase()}]: ${info.message}`)
  ),
});
