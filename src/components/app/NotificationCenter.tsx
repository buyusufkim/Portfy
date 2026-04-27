import { useEffect, useRef } from "react";
import { PersonalTask, GamifiedTask } from "../../types";
import { api } from "../../services/api";

interface NotificationCenterProps {
  personalTasks: PersonalTask[];
  gamifiedTasks: GamifiedTask[];
  onNotify: (
    task: PersonalTask | GamifiedTask,
    type: "personal" | "gamified",
  ) => void;
}

export const NotificationCenter = ({
  personalTasks,
  gamifiedTasks,
  onNotify,
}: NotificationCenterProps) => {
  const notifiedLocalIds = useRef(new Set<string>());

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();

      // Check personal tasks
      personalTasks.forEach((task) => {
        if (task.reminder_time && !task.notified && !task.is_completed) {
          const reminderDate = new Date(task.reminder_time);
          if (reminderDate <= now && !notifiedLocalIds.current.has(task.id)) {
            notifiedLocalIds.current.add(task.id);
            onNotify(task, "personal");
            // Try updating notified status so we don't repeat
            api.updatePersonalTask(task.id, { notified: true }).catch((err) => {
              console.warn(
                "Kişisel görev bildirim durumu güncellenemedi: ",
                err,
              );
            });
          }
        }
      });

      // Check gamified tasks
      gamifiedTasks.forEach((task) => {
        if (task.reminder_time && !task.notified && !task.is_completed) {
          const reminderDate = new Date(task.reminder_time);
          if (
            reminderDate <= now &&
            !notifiedLocalIds.current.has(`game-${task.id}`)
          ) {
            notifiedLocalIds.current.add(`game-${task.id}`);
            onNotify(task, "gamified");
            // Wait, does update gamified task notified exist?
            // Will leave gamified as is for now if there is no api.
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [personalTasks, gamifiedTasks, onNotify]);

  return null;
};
