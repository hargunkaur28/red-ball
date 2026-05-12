import { motion } from 'framer-motion';

import { Mailbox } from 'lucide-react';

export default function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-[#111111] mb-2">{title}</h3>
      <p className="text-sm text-[#666666] text-center max-w-sm mb-4">{message}</p>
      {action}
    </motion.div>
  );
}
