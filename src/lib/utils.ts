import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata um valor numérico grande com sufixos (K, M, B, etc)
 * @param value Valor a ser formatado
 * @param options Opções de formatação
 * @returns Valor formatado com sufixo
 */
export function formatLargeNumber(
  value: number,
  options: {
    showFull?: boolean; // Se true, mostra o valor completo ao passar o mouse
    locale?: string;
    currency?: string;
  } = {}
): string {
  const { showFull = true, locale = "pt-BR", currency = "BRL" } = options;

  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const absValue = Math.abs(value);
  let suffix = "";
  let divisor = 1;

  if (absValue >= 1_000_000_000) {
    suffix = "B";
    divisor = 1_000_000_000;
  } else if (absValue >= 1_000_000) {
    suffix = "M";
    divisor = 1_000_000;
  } else if (absValue >= 1_000) {
    suffix = "K";
    divisor = 1_000;
  }

  const formattedValue = formatter.format(value / divisor);
  const result = formattedValue.replace(/\s/g, "") + suffix;

  if (showFull) {
    return `<span title="${formatter.format(value)}">${result}</span>`;
  }

  return result;
}
