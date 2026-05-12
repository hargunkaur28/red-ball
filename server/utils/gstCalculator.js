/**
 * Calculate GST amounts
 * @param {number} amount - Base amount
 * @param {number} gstPercent - GST percentage (default 18)
 * @returns {{ amount, gstAmount, gstPercent, totalAmount }}
 */
const calculateGST = (amount, gstPercent = 18) => {
  const gstAmount = Math.round((amount * gstPercent) / 100 * 100) / 100;
  const totalAmount = Math.round((amount + gstAmount) * 100) / 100;
  return {
    amount,
    gstAmount,
    gstPercent,
    totalAmount,
  };
};

module.exports = { calculateGST };
