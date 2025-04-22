import { Club, Player, Bid, Auction } from "@/types";

/**
 * Verifica se o salário projetado ultrapassa o teto salarial (apenas para aviso)
 */
export const checkSalaryCapWarning = (
  club: Club,
  player: Player,
  bidAmount: number
) => {
  const projectedSalary = calculateProjectedSalary(player, bidAmount);
  const currentSalaryTotal = calculateCurrentSalaryTotal(club);
  const salaryCap = club.salaryCap;

  return {
    exceeds: currentSalaryTotal + projectedSalary > salaryCap,
    projectedTotal: currentSalaryTotal + projectedSalary,
    difference: currentSalaryTotal + projectedSalary - salaryCap,
  };
};

/**
 * Valida se o clube tem saldo suficiente para o lance
 */
export const validateBalance = (
  club: Club,
  bidAmount: number,
  currentBids: number
) => {
  console.log(
    `
    club: ${club.name}
    bidAmount: ${bidAmount}
    currentBids: ${currentBids}
    `
  );
  const totalRequired = bidAmount * 1; // Considera lances anteriores
  const buffer = club.balance * 0.2; // 20% de buffer para outras operações
  return club.balance - buffer >= totalRequired;
};

/**
 * Calcula o salário projetado do jogador baseado no valor do lance
 */
export const calculateProjectedSalary = (player: Player, bidAmount: number) => {
  // O salário é calculado dividindo o valor do lance pelo multiplicador de mercado
  return bidAmount / player.market_value_multiplier;
};

/**
 * Calcula o total de salários atuais do clube
 */
export const calculateCurrentSalaryTotal = (club: Club) => {
  return club.players.reduce(
    (total, player) => total + player.contract.salary,
    0
  );
};

/**
 * Calcula o valor de mercado do jogador
 */
export const calculateMarketValue = (player: Player) => {
  // Valor base é o salário atual * multiplicador de mercado
  const baseValue = player.contract.salary * player.market_value_multiplier;

  // Ajusta baseado no overall e potencial
  const overallMultiplier = 1 + (player.overall - 70) * 0.02; // +2% por ponto acima de 70
  const potentialMultiplier = 1 + (player.potential - player.overall) * 0.03; // +3% por ponto de potencial acima do overall

  return baseValue * overallMultiplier * potentialMultiplier;
};

/**
 * Valida se o lance está dentro dos limites de valor de mercado
 */
export const validateMarketValue = (player: Player, bidAmount: number) => {
  const marketValue = calculateMarketValue(player);
  const maxAllowedValue = marketValue * 1.5; // 50% acima do valor de mercado
  const minAllowedValue = marketValue * 0.7; // 30% abaixo do valor de mercado

  return bidAmount >= minAllowedValue && bidAmount <= maxAllowedValue;
};

/**
 * Calcula o próximo valor de lance possível
 */
export const calculateNextBidAmount = (
  currentBid: number,
  bidCount: number
) => {
  const baseIncrement = 100000;
  const incrementMultiplier = Math.min(1 + bidCount * 0.1, 2); // Aumenta 10% por lance, até 100%
  return currentBid + baseIncrement * incrementMultiplier;
};

/**
 * Valida se o clube pode dar múltiplos lances
 */
export const validateMultipleBids = (
  club: Club,
  bids: Bid[],
  newBidAmount: number
) => {
  const totalBids = bids.reduce((sum, bid) => sum + bid.bid_amount, 0);
  const projectedTotal = totalBids + newBidAmount;
  const maxAllowedBids = club.balance * 0.7; // 70% do saldo total

  return projectedTotal <= maxAllowedBids;
};

/**
 * Calcula o incremento médio entre lances
 */
export const calculateAverageBidIncrement = (bids: Bid[]) => {
  if (bids.length < 2) return 0;

  const increments = bids
    .slice(1)
    .map((bid, index) => bid.bid_amount - bids[index].bid_amount);

  return increments.reduce((sum, inc) => sum + inc, 0) / increments.length;
};

/**
 * Calcula a frequência de lances (lances por minuto)
 */
export const calculateBidFrequency = (bids: Bid[]) => {
  if (bids.length < 2) return 0;

  const timeSpan =
    new Date(bids[bids.length - 1].created_at).getTime() -
    new Date(bids[0].created_at).getTime();
  const minutes = timeSpan / (1000 * 60);

  return bids.length / minutes;
};

/**
 * Calcula a volatilidade de preços (desvio padrão dos incrementos)
 */
export const calculatePriceVolatility = (bids: Bid[]) => {
  if (bids.length < 2) return 0;

  const increments = bids
    .slice(1)
    .map((bid, index) => bid.bid_amount - bids[index].bid_amount);

  const mean =
    increments.reduce((sum, inc) => sum + inc, 0) / increments.length;
  const squaredDiffs = increments.map((inc) => Math.pow(inc - mean, 2));
  const variance =
    squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;

  return Math.sqrt(variance);
};

/**
 * Analisa o histórico do leilão
 */
export const analyzeAuctionHistory = (auction: Auction) => {
  return {
    totalBids: auction.bids.length,
    uniqueBidders: new Set(auction.bids.map((bid) => bid.club_id)).size,
    averageBidIncrement: calculateAverageBidIncrement(auction.bids),
    bidFrequency: calculateBidFrequency(auction.bids),
    priceVolatility: calculatePriceVolatility(auction.bids),
  };
};
