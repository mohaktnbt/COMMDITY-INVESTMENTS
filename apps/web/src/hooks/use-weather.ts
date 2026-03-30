import { useQuery } from '@tanstack/react-query';

const API_BASE = '/api/v1';

interface WeatherData {
  region: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  condition: string;
  forecast: WeatherForecast[];
  updatedAt: string;
}

interface WeatherForecast {
  date: string;
  tempHigh: number;
  tempLow: number;
  rainfall: number;
  condition: string;
}

interface UseWeatherParams {
  region: string;
  enabled?: boolean;
}

async function fetchWeather(region: string): Promise<WeatherData> {
  const res = await fetch(`${API_BASE}/weather/${encodeURIComponent(region)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch weather for ${region}: ${res.statusText}`);
  }
  return res.json();
}

export function useWeather({ region, enabled = true }: UseWeatherParams) {
  return useQuery<WeatherData>({
    queryKey: ['weather', region],
    queryFn: () => fetchWeather(region),
    enabled: enabled && !!region,
    staleTime: 10 * 60_000,
  });
}
