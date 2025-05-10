import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Toggle } from "./components/ui/toggle";
import { Play, Pause, RefreshCw, Moon } from "lucide-react";

export default function PomodoroTimer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(10);
  const [nextBreakTime, setNextBreakTime] = useState(0);

  const countdownAudioRef = useRef<HTMLAudioElement | null>(null);
  const rainAudioRef = useRef<HTMLAudioElement | null>(null);

  // Generate random time between 3-5 minutes in seconds
  const generateRandomBreakTime = useCallback(() => {
    return Math.floor(Math.random() * (300 - 180 + 1) + 180); // 180-300 seconds (3-5 minutes)
  }, []);

  // Format time as mm:ss
  const formatTime = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds / 60) % 60);
    const seconds = timeInSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Toggle timer
  const toggleTimer = () => {
    if (!isRunning && !isBreak) {
      // If starting for the first time or after reset, set next break time
      if (seconds === 0) {
        setNextBreakTime(generateRandomBreakTime());
      }
    }
    setIsRunning(!isRunning);
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setSeconds(0);
    setBreakTimeLeft(10);
    setNextBreakTime(0);
    if (rainAudioRef.current) {
      rainAudioRef.current.pause();
      rainAudioRef.current.currentTime = 0;
    }
  };

  // Gradually increase volume
  const fadeInAudio = (audio: HTMLAudioElement, duration: number) => {
    let volume = 0;
    const step = 1 / ((duration * 1000) / 50); // Adjust volume every 50ms
    const interval = setInterval(() => {
      if (volume >= 1) {
        clearInterval(interval);
      } else {
        volume = Math.min(volume + step, 1);
        audio.volume = volume;
      }
    }, 50);
  };

  // Handle timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => {
          const newSeconds = prevSeconds + 1;

          // Play countdown audio 4 seconds before the break
          if (
            !isBreak &&
            nextBreakTime > 0 &&
            newSeconds === nextBreakTime - 4
          ) {
            if (countdownAudioRef.current) {
              countdownAudioRef.current.volume = 0.1;
              countdownAudioRef.current.play();
            }
            if (rainAudioRef.current) {
              rainAudioRef.current.volume = 0; // Start with volume 0
              rainAudioRef.current.play();
              fadeInAudio(rainAudioRef.current, 4); // Gradually increase volume over 4 seconds
            }
          }

          // Check if it's time for a break
          if (!isBreak && newSeconds >= nextBreakTime && nextBreakTime > 0) {
            setIsBreak(true);
            setBreakTimeLeft(10); // Start the 10-second break
          }

          return newSeconds;
        });

        // Handle break countdown
        if (isBreak) {
          setBreakTimeLeft((prevTime) => {
            if (prevTime <= 1) {
              // Break is over
              setIsBreak(false);
              setNextBreakTime(seconds + generateRandomBreakTime());
              if (rainAudioRef.current) {
                rainAudioRef.current.pause();
                rainAudioRef.current.currentTime = 0;
              }
              return 10; // Reset break time
            }
            return prevTime - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isBreak, nextBreakTime, seconds, generateRandomBreakTime]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8EEDF] p-4 dark:bg-[#3b322d] dark:text-[#f3eee9]">
      <Card className="w-full max-w-md p-6 !border-none dark:bg-[#564b45]">
        <Toggle onClick={() => toggleTheme()} className="w-5 fixed ">
          <Moon />
        </Toggle>
        <div className="flex flex-col items-center space-y-8">
          {/* Timer Display */}
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-light">Pomodoro Timer</h1>
            <div
              className="text-6xl font-light tabular-nums"
              aria-live="polite"
            >
              {formatTime(seconds)}
            </div>
          </div>

          {/* Break Notification */}
          {isBreak && (
            <div className="absolute inset-0 flex items-center justify-center bg-amber-100/80 text-amber-900 dark:bg-amber-900/80 dark:text-amber-100">
              <div className="text-center">
                <h2 className="text-3xl font-semibold">Break Time!</h2>
                <p className="mt-2 text-lg">
                  Relax for {breakTimeLeft} seconds
                </p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex space-x-4">
            <Button
              onClick={toggleTimer}
              disabled={isBreak}
              variant="outline"
              size="lg"
              className="h-12 w-12 rounded-full p-0"
            >
              {isRunning ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
              <span className="sr-only">{isRunning ? "Pause" : "Start"}</span>
            </Button>
            <Button
              onClick={resetTimer}
              variant="outline"
              size="lg"
              className="h-12 w-12 rounded-full p-0"
            >
              <RefreshCw className="h-5 w-5" />
              <span className="sr-only">Reset</span>
            </Button>
            {/* Test Audio Button */}
            {/* <Button
              onClick={() => {
                if (countdownAudioRef.current) {
                  countdownAudioRef.current.volume = 0.2
                  countdownAudioRef.current.play();
                }
                if (rainAudioRef.current) {
                  rainAudioRef.current.volume = 0; // Start with volume 0
                  rainAudioRef.current.play();
                  fadeInAudio(rainAudioRef.current, 4); // Gradually increase volume over 4 seconds
                }
              }}
              variant="outline"
              size="lg"
              className="h-12 w-12 rounded-full p-0"
            >
              <span className="sr-only">Test Audio</span>
              🎵
            </Button> */}
          </div>
        </div>
      </Card>

      {/* Audio Elements */}
      <audio ref={countdownAudioRef} src="/sounds/countdown.mp3" />
      <audio ref={rainAudioRef} src="/sounds/rain_15s.mp3" loop />
    </div>
  );
}
