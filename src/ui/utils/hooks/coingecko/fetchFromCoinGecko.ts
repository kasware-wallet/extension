export const fetchFromCoinGecko = async (currency: string, name: string): Promise<number> => {
  const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${name}&vs_currencies=${currency}`);

  if (!response.ok) {
    throw new Error('Failed to fetch price from CoinGecko API');
  }

  const data = await response.json();
  return data[name.toLowerCase()][currency.toLowerCase()];
};
