'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Notification {
  id: number;
  message: string;
  progress: number;
  type: 'success' | 'error';
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (message: string, type: 'success' | 'error') => {
    const newNotification = {
      id: Date.now(),
      message,
      progress: 100,
      type,
    };
    setNotifications((prev) => [...prev, newNotification]);
  };

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const triggerNotifications = () => {
    addNotification('Welcome to the notification system!', 'success');
    setTimeout(() => addNotification('This is another notification.', 'success'), 2000);
    setTimeout(() => addNotification('Oops! Something went wrong.', 'error'), 4000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prev) =>
        prev.map((notification) => {
          if (notification.progress <= 0) {
            removeNotification(notification.id);
            return notification;
          }
          return { ...notification, progress: notification.progress - 1 };
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, [removeNotification]);

  return (
    <div className="p-4">
      <Button onClick={triggerNotifications}>Show Notifications</Button>
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <Notification
              key={notification.id}
              message={notification.message}
              progress={notification.progress}
              type={notification.type}
              onClose={() => removeNotification(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Notification({
  message,
  progress,
  type,
  onClose,
}: {
  message: string;
  progress: number;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="w-64 rounded-lg bg-white p-4 shadow-lg relative overflow-hidden flex"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1" />
      <div className="flex-grow">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm text-gray-800">{message}</p>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          className={`absolute bottom-0 left-0 h-1 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
        />
      </div>
    </motion.div>
  );
}
