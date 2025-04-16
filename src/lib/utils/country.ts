import countries from "../../../public/assets/flags/countries.json";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CountryCode = keyof typeof countries;

/**
 * Converte o nome completo de um país para seu código ISO
 * @param countryName Nome completo do país (ex: "Brazil")
 * @returns Código ISO do país (ex: "BR") ou "UN" se não encontrado
 */
export function getCountryCode(countryName: string): string {
  const entry = Object.entries(countries).find(
    ([, name]) => name.toLowerCase() === countryName.toLowerCase()
  );
  return entry ? entry[0] : "UN";
}

/**
 * Obtém o nome completo do país a partir do código ISO
 * @param code Código ISO do país (ex: "BR")
 * @returns Nome completo do país (ex: "Brazil") ou o código se não encontrado
 */
export function getCountryName(code: string): string {
  return (countries as Record<string, string>)[code] || code;
}
