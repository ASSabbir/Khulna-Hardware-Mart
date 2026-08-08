// FILE: server/utils/withTransaction.js (NEW) — fixes "Write conflict during plan execution" by auto-retrying transient transaction errors
const mongoose = require("mongoose");

const RETRYABLE_CODES = [112, 251]; // WriteConflict, NoSuchTransaction

async function withTransaction(fn, maxRetries = 6) {
  const session = await mongoose.startSession();
  try {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      session.startTransaction();
      try {
        const result = await fn(session);
        await session.commitTransaction();
        return result;
      } catch (error) {
        await session.abortTransaction().catch(() => {});
        const isRetryable =
          RETRYABLE_CODES.includes(error.code) ||
          (error.errorLabels && error.errorLabels.includes("TransientTransactionError")) ||
          (error.message && error.message.includes("Write conflict"));
        if (isRetryable && attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, 40 * (attempt + 1)));
          continue;
        }
        throw error;
      }
    }
  } finally {
    session.endSession();
  }
}

module.exports = { withTransaction };