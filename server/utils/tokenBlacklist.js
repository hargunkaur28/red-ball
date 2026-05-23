const blacklist = new Set();

const add = (token, expSeconds) => {
  blacklist.add(token);
  const msUntilExpiry = expSeconds * 1000 - Date.now();
  if (msUntilExpiry > 0) {
    setTimeout(() => blacklist.delete(token), msUntilExpiry);
  }
};

const has = (token) => blacklist.has(token);

module.exports = { add, has };
