import { useState, useEffect } from "react";

interface CountdownResult {
  hours: number;
  minutes: number;
  seconds: number;
  isFinished: boolean;
  isStarted: boolean;
  formattedTime: string;
  endTime: Date;
}

export function useCountdown(
  startTime: string,
  countdownMinutes: number
): CountdownResult {
  const [timeLeft, setTimeLeft] = useState<CountdownResult>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isFinished: false,
    isStarted: false,
    formattedTime: "00:00:00",
    endTime: new Date(),
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      // Converter para UTC para garantir consistência
      const start = new Date(startTime);
      const now = new Date();

      // Calcular o tempo de término (início + minutos de contagem)
      const end = new Date(start.getTime() + countdownMinutes * 60 * 1000);

      // Verificar se o leilão já começou
      const hasStarted = now >= start;

      // Verificar se o leilão já terminou
      const hasFinished = now >= end;

      // Se o leilão ainda não começou, mostrar contagem para início
      if (!hasStarted) {
        const diff = start.getTime() - now.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return {
          hours,
          minutes,
          seconds,
          isFinished: false,
          isStarted: false,
          formattedTime: `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
          endTime: end,
        };
      }

      // Se o leilão já terminou
      if (hasFinished) {
        return {
          hours: 0,
          minutes: 0,
          seconds: 0,
          isFinished: true,
          isStarted: true,
          formattedTime: "00:00:00",
          endTime: end,
        };
      }

      // Se o leilão está em andamento, mostrar contagem para término
      const diff = end.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return {
        hours,
        minutes,
        seconds,
        isFinished: false,
        isStarted: true,
        formattedTime: `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
        endTime: end,
      };
    };

    // Atualizar imediatamente
    setTimeLeft(calculateTimeLeft());

    // Atualizar a cada segundo
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, countdownMinutes]);

  return timeLeft;
}
