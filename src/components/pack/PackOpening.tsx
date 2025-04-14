import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface Player {
  id: string;
  name: string;
  position: string;
  overall: number;
  nationality: string;
  club_id: string;
}

interface PackOpeningProps {
  players: Player[];
  onComplete: () => void;
}

export function PackOpening({ players, onComplete }: PackOpeningProps) {
  // Ordenar jogadores por overall (decrescente) e pegar apenas os 3 melhores
  const topPlayers = [...players]
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 3);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    if (currentIndex >= topPlayers.length) {
      setTimeout(() => {
        onComplete();
      }, 1000);
      return;
    }

    if (showCard) {
      const timer = setTimeout(() => {
        setShowCard(false);
        setCurrentIndex((prev) => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, topPlayers.length, showCard, onComplete]);

  const handleClick = () => {
    if (isRevealing) return;
    setIsRevealing(true);

    // Efeito de "roleta" rápida antes de revelar
    let count = 0;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % topPlayers.length);
      count++;
      if (count > 20) {
        clearInterval(interval);
        setShowCard(true);
        setIsRevealing(false);
      }
    }, 50);
  };

  if (currentIndex >= topPlayers.length) {
    return null;
  }

  const player = topPlayers[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <AnimatePresence>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative perspective-1000"
        >
          <div className="w-72 h-96 transform-style-preserve-3d">
            {/* Frente do card (pacote fechado) */}
            <Card
              className={`absolute w-full h-full flex flex-col items-center justify-center cursor-pointer backface-hidden transition-transform duration-700 ${
                showCard ? "rotate-y-180" : ""
              }`}
              onClick={handleClick}
            >
              <motion.div
                animate={{ rotate: isRevealing ? 360 : 0 }}
                transition={{
                  duration: 1,
                  repeat: isRevealing ? Infinity : 0,
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative"
                >
                  <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-4xl">⚽</span>
                  </div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm text-muted-foreground">
                    Clique para revelar
                  </div>
                </motion.div>
              </motion.div>
            </Card>

            {/* Verso do card (jogador revelado) */}
            <Card
              className={`absolute w-full h-full flex flex-col items-center justify-center p-4 backface-hidden rotate-y-180 transition-transform duration-700 ${
                showCard ? "rotate-y-0" : "rotate-y-180"
              }`}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={
                  showCard
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.5 }
                }
                className="flex flex-col items-center justify-center"
              >
                <div className="text-2xl font-bold mb-2">{player.name}</div>
                <div className="flex gap-2 mb-4">
                  <Badge variant="outline">{player.position}</Badge>
                  <Badge
                    variant="secondary"
                    className={
                      player.overall >= 80
                        ? "bg-yellow-500 text-black"
                        : player.overall >= 75
                        ? "bg-purple-500 text-white"
                        : ""
                    }
                  >
                    {player.overall}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {player.nationality}
                </div>
              </motion.div>
            </Card>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
