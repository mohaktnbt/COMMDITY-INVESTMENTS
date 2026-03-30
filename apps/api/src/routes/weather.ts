/**
 * Weather routes - weather data for agricultural regions.
 */
import { Router } from 'express';
import type { WeatherData } from '@commodity-monitor/shared';

export const weatherRouter = Router();

// Sample weather data by region
// TODO: Fetch from Open-Meteo API
const SAMPLE_WEATHER: Record<string, WeatherData> = {
  'punjab': {
    location: { lat: 31.1471, lng: 75.3412 },
    region: 'Punjab',
    temperature: 32.5,
    humidity: 65,
    rainfall: 12.4,
    rainfallDeviation: -8.2,
    condition: 'Partly Cloudy',
    timestamp: Date.now(),
  },
  'maharashtra': {
    location: { lat: 19.7515, lng: 75.7139 },
    region: 'Maharashtra',
    temperature: 35.1,
    humidity: 58,
    rainfall: 5.2,
    rainfallDeviation: -15.3,
    condition: 'Sunny',
    timestamp: Date.now(),
  },
  'madhya-pradesh': {
    location: { lat: 22.9734, lng: 78.6569 },
    region: 'Madhya Pradesh',
    temperature: 34.8,
    humidity: 52,
    rainfall: 8.1,
    rainfallDeviation: -5.7,
    condition: 'Clear',
    timestamp: Date.now(),
  },
  'rajasthan': {
    location: { lat: 27.0238, lng: 74.2179 },
    region: 'Rajasthan',
    temperature: 38.2,
    humidity: 30,
    rainfall: 1.2,
    rainfallDeviation: -22.1,
    condition: 'Sunny',
    timestamp: Date.now(),
  },
  'karnataka': {
    location: { lat: 15.3173, lng: 75.7139 },
    region: 'Karnataka',
    temperature: 30.4,
    humidity: 70,
    rainfall: 15.8,
    rainfallDeviation: 2.1,
    condition: 'Light Rain',
    timestamp: Date.now(),
  },
  'us-midwest': {
    location: { lat: 41.8781, lng: -87.6298 },
    region: 'US Midwest',
    temperature: 24.3,
    humidity: 72,
    rainfall: 18.5,
    rainfallDeviation: 3.2,
    condition: 'Overcast',
    timestamp: Date.now(),
  },
  'brazil-cerrado': {
    location: { lat: -15.7942, lng: -47.8825 },
    region: 'Brazil Cerrado',
    temperature: 28.7,
    humidity: 68,
    rainfall: 22.1,
    rainfallDeviation: -4.5,
    condition: 'Thunderstorms',
    timestamp: Date.now(),
  },
};

/**
 * GET /:region - Weather data for region.
 * TODO: Fetch from Open-Meteo API.
 */
weatherRouter.get('/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const regionKey = region.toLowerCase();

    // TODO: Fetch live data from Open-Meteo API
    // const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,precipitation`;
    // const response = await fetch(url);
    // const data = await response.json();

    const weather = SAMPLE_WEATHER[regionKey];
    if (!weather) {
      const availableRegions = Object.keys(SAMPLE_WEATHER);
      res.status(404).json({
        error: `Region '${region}' not found`,
        availableRegions,
      });
      return;
    }

    res.json({ data: weather });
  } catch (err) {
    console.error('Error fetching weather:', err);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});
