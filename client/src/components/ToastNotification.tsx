import { AnimatePresence, motion } from 'framer-motion';

type ToastProps = {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
};

const ToastNotification = ({ message, type, visible }: ToastProps) => {
  let icon;
  let colorClass;

  switch (type) {
    case 'success':
      icon = <i className="fas fa-check-circle"></i>;
      colorClass = 'text-[#0FFF50]';
      break;
    case 'error':
      icon = <i className="fas fa-exclamation-circle"></i>;
      colorClass = 'text-red-500';
      break;
    case 'info':
      icon = <i className="fas fa-info-circle"></i>;
      colorClass = 'text-[#00EEFF]';
      break;
    default:
      icon = <i className="fas fa-check-circle"></i>;
      colorClass = 'text-[#0FFF50]';
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="toast"
          className="fixed bottom-4 right-4 px-6 py-4 rounded-lg bg-[#1E1E1E] border border-[#3A3A3A] shadow-lg z-50"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center">
            <div id="toast-icon" className={`mr-3 ${colorClass}`}>
              {icon}
            </div>
            <div id="toast-content">{message}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification;
