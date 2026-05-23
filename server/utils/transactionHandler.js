const mongoose = require('mongoose');

const runTransaction = async (workFn) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await workFn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    // Fallback if standalone MongoDB doesn't support replica set transactions
    const isStandaloneErr =
      error.message.includes('replica set') ||
      error.codeName === 'TransactionSystemFailed' ||
      error.message.includes('transaction');
    if (isStandaloneErr) {
      console.warn('⚠️ Standalone MongoDB detected. Falling back to non-transactional execution.');
      return await workFn(null);
    }
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = { runTransaction };
