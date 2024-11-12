import { FC, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  isActive: boolean;
}

const Fade: FC<Props> = ({ children, isActive }) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: '-100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: '100%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Fade;
