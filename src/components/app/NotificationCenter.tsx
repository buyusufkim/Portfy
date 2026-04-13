import { useEffect } from 'react';
import { PersonalTask, GamifiedTask } from '../../types';

interface NotificationCenterProps {
  personalTasks: PersonalTask[];
  gamifiedTasks: GamifiedTask[];
  onNotify: (task: PersonalTask | GamifiedTask, type: 'personal' | 'gamified') => void;
}

export const NotificationCenter = ({ 
  personalTasks, 
  gamifiedTasks, 
  onNotify 
}: NotificationCenterProps) => {
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      
      // Check personal tasks
      personalTasks.forEach(task => {
        if (task.reminder_time && !task.notified && !task.is_completed) {
          const reminderDate = new Date(task.reminder_time);
          if (reminderDate <= now) {
            onNotify(task, 'personal');
          }
        }
      });

      // Check gamified tasks
      gamifiedTasks.forEach(task => {
        if (task.reminder_time && !task.notified && !task.is_completed) {
          const reminderDate = new Date(task.reminder_time);
          if (reminderDate <= now) {
            onNotify(task, 'gamified');
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [personalTasks, gamifiedTasks, onNotify]);

  return null;
};
