import { Server } from "socket.io";
import { LogController } from "@controller/log.controller";
import { RoomController } from "@controller/room.controller"; // Used to end the test when time is up

interface TimerState {
  intervalId: NodeJS.Timeout;
  remainingSeconds: number;
  isPaused: boolean;
  roomId: string;
}

// This Map holds the state for all active timers, keyed by roomId.
// It is not exported, making it a private variable within this module.
const activeTimers = new Map<string, TimerState>();

export const timerController = {

  startTimer(io: Server, roomId: string, timeLimitInMinutes: number): void {
    if (activeTimers.has(roomId)) {
      LogController.LogEvent("TimerController", `Timer for room ${roomId} already exists. Stopping the old one before starting anew.`);
      this.stopTimer(roomId);
    }

    const remainingSeconds = timeLimitInMinutes * 60;

    const intervalId = setInterval(async () => {
      const timer = activeTimers.get(roomId);

      if (!timer) {
        clearInterval(intervalId);
        return;
      }
      
      if (timer.isPaused) {
        return; // Do nothing if paused
      }

      timer.remainingSeconds--;

      io.to(roomId).emit('timer_tick', { remainingSeconds: timer.remainingSeconds });

      if (timer.remainingSeconds <= 0) {
        LogController.LogEvent("TimerController", `Time is up for room ${roomId}.`);
        this.stopTimer(roomId);
        await RoomController.endTest(io, roomId);
      }
    }, 1000);

    const newTimer: TimerState = {
      intervalId,
      remainingSeconds,
      isPaused: false,
      roomId,
    };

    activeTimers.set(roomId, newTimer);
    LogController.LogEvent("TimerController", `Timer started for room ${roomId} with ${timeLimitInMinutes} minutes.`);
  },

  stopTimer(roomId: string): void {
    if (activeTimers.has(roomId)) {
      const timer = activeTimers.get(roomId)!;
      clearInterval(timer.intervalId);
      activeTimers.delete(roomId);
      LogController.LogEvent("TimerController", `Timer stopped for room ${roomId}.`);
    }
  },

  pauseTimer(roomId: string): void {
    if (activeTimers.has(roomId)) {
      const timer = activeTimers.get(roomId)!;
      timer.isPaused = true;
      LogController.LogEvent("TimerController", `Timer paused for room ${roomId}.`);
    }
  },

  resumeTimer(roomId: string): void {
    if (activeTimers.has(roomId)) {
      const timer = activeTimers.get(roomId)!;
      timer.isPaused = false;
      LogController.LogEvent("TimerController", `Timer resumed for room ${roomId}.`);
    }
  },

  addTime(io: Server, roomId: string, minutesToAdd: number): void {
    if (activeTimers.has(roomId)) {
      const timer = activeTimers.get(roomId)!;
      timer.remainingSeconds += minutesToAdd * 60;
      LogController.LogEvent("TimerController", `Added ${minutesToAdd} minutes to room ${roomId}.`);
      io.to(roomId).emit('timer_tick', { remainingSeconds: timer.remainingSeconds });
    }
  },

  subtractTime(io: Server, roomId: string, minutesToSubtract: number): void {
    if (activeTimers.has(roomId)) {
      const timer = activeTimers.get(roomId)!;
      timer.remainingSeconds = Math.max(0, timer.remainingSeconds - (minutesToSubtract * 60));
      LogController.LogEvent("TimerController", `Subtracted ${minutesToSubtract} minutes from room ${roomId}.`);
      io.to(roomId).emit('timer_tick', { remainingSeconds: timer.remainingSeconds });
    }
  },
};