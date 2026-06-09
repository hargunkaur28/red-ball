const BlacklistedToken = require('../models/BlacklistedToken');

// Adds a token to the persistent blacklist. expSeconds is the JWT exp claim value.
const add = async (token, expSeconds) => {
  try {
    const expiresAt = new Date(expSeconds * 1000);
    await BlacklistedToken.create({ token, expiresAt });
  } catch (err) {
    // Duplicate key = already blacklisted; ignore
    if (err.code !== 11000) console.error('Blacklist add error:', err.message);
  }
};

// Returns true if the token is on the blacklist.
const has = async (token) => {
  try {
    const found = await BlacklistedToken.exists({ token });
    return !!found;
  } catch {
    return false;
  }
};

module.exports = { add, has };
