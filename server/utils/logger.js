const isDev = process.env.NODE_ENV !== 'production';

function formatMessage(level, message, meta) {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${ts}] [${level}] ${message}${metaStr}`;
}

function logInfo(message, meta) {
  console.log(formatMessage('INFO', message, meta));
}

function logWarn(message, meta) {
  console.warn(formatMessage('WARN', message, meta));
}

function logError(message, meta) {
  console.error(formatMessage('ERROR', message, meta));
}

module.exports = { logInfo, logWarn, logError };
