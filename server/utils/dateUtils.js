// Calculates exact milliseconds based on duration unit and value
exports.getDurationMs = (plan) => {
  if (plan.durationUnit === 'minutes') return plan.durationValue * 60 * 1000;
  if (plan.durationUnit === 'hours') return plan.durationValue * 60 * 60 * 1000;
  if (plan.durationUnit === 'days') return plan.durationValue * 24 * 60 * 60 * 1000;
  if (plan.durationUnit === 'months') return plan.durationValue * 30 * 24 * 60 * 60 * 1000;
  if (plan.durationUnit === 'years') return plan.durationValue * 365 * 24 * 60 * 60 * 1000;
  return (plan.durationDays || 30) * 24 * 60 * 60 * 1000; // fallback
};
