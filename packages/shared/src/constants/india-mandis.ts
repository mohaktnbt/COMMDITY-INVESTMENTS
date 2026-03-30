import type { MandiLocation } from '../types/geo.js';

/**
 * Top Indian mandi (agricultural market) locations with coordinates.
 * Source: data.gov.in + Agmarknet
 */
export const INDIA_MANDIS: MandiLocation[] = [
  // Maharashtra
  { state: 'Maharashtra', district: 'Mumbai', market: 'Vashi (New Mumbai)', code: 'MH-MUM-VASHI', lat: 19.0760, lng: 72.9987 },
  { state: 'Maharashtra', district: 'Pune', market: 'Pune (Gultekdi)', code: 'MH-PUN-GULT', lat: 18.5036, lng: 73.8568 },
  { state: 'Maharashtra', district: 'Nashik', market: 'Nashik', code: 'MH-NSK-NASH', lat: 19.9975, lng: 73.7898 },
  { state: 'Maharashtra', district: 'Nagpur', market: 'Nagpur', code: 'MH-NAG-NAGP', lat: 21.1458, lng: 79.0882 },
  { state: 'Maharashtra', district: 'Aurangabad', market: 'Aurangabad', code: 'MH-AUR-AURA', lat: 19.8762, lng: 75.3433 },
  { state: 'Maharashtra', district: 'Solapur', market: 'Solapur', code: 'MH-SOL-SOLA', lat: 17.6599, lng: 75.9064 },
  { state: 'Maharashtra', district: 'Latur', market: 'Latur', code: 'MH-LAT-LATU', lat: 18.3968, lng: 76.5604 },
  { state: 'Maharashtra', district: 'Kolhapur', market: 'Kolhapur', code: 'MH-KOL-KOLH', lat: 16.7050, lng: 74.2433 },

  // Madhya Pradesh
  { state: 'Madhya Pradesh', district: 'Indore', market: 'Indore', code: 'MP-IND-INDO', lat: 22.7196, lng: 75.8577 },
  { state: 'Madhya Pradesh', district: 'Bhopal', market: 'Bhopal', code: 'MP-BHO-BHOP', lat: 23.2599, lng: 77.4126 },
  { state: 'Madhya Pradesh', district: 'Dewas', market: 'Dewas', code: 'MP-DEW-DEWA', lat: 22.9623, lng: 76.0508 },
  { state: 'Madhya Pradesh', district: 'Ujjain', market: 'Ujjain', code: 'MP-UJJ-UJJA', lat: 23.1765, lng: 75.7885 },
  { state: 'Madhya Pradesh', district: 'Neemuch', market: 'Neemuch', code: 'MP-NEE-NEEM', lat: 24.4728, lng: 74.8690 },
  { state: 'Madhya Pradesh', district: 'Mandsaur', market: 'Mandsaur', code: 'MP-MAN-MAND', lat: 24.0714, lng: 75.0700 },

  // Rajasthan
  { state: 'Rajasthan', district: 'Jaipur', market: 'Jaipur', code: 'RJ-JAI-JAIP', lat: 26.9124, lng: 75.7873 },
  { state: 'Rajasthan', district: 'Jodhpur', market: 'Jodhpur', code: 'RJ-JOD-JODH', lat: 26.2389, lng: 73.0243 },
  { state: 'Rajasthan', district: 'Kota', market: 'Kota', code: 'RJ-KOT-KOTA', lat: 25.2138, lng: 75.8648 },
  { state: 'Rajasthan', district: 'Alwar', market: 'Alwar', code: 'RJ-ALW-ALWA', lat: 27.5530, lng: 76.6346 },
  { state: 'Rajasthan', district: 'Bikaner', market: 'Bikaner', code: 'RJ-BIK-BIKA', lat: 28.0229, lng: 73.3119 },
  { state: 'Rajasthan', district: 'Udaipur', market: 'Udaipur', code: 'RJ-UDA-UDAI', lat: 24.5854, lng: 73.7125 },
  { state: 'Rajasthan', district: 'Nagaur', market: 'Nagaur', code: 'RJ-NAG-NAGA', lat: 27.2024, lng: 73.7350 },
  { state: 'Rajasthan', district: 'Ajmer', market: 'Ajmer', code: 'RJ-AJM-AJME', lat: 26.4499, lng: 74.6399 },

  // Gujarat
  { state: 'Gujarat', district: 'Ahmedabad', market: 'Ahmedabad', code: 'GJ-AHM-AHME', lat: 23.0225, lng: 72.5714 },
  { state: 'Gujarat', district: 'Rajkot', market: 'Rajkot', code: 'GJ-RAJ-RAJK', lat: 22.3039, lng: 70.8022 },
  { state: 'Gujarat', district: 'Surat', market: 'Surat', code: 'GJ-SUR-SURA', lat: 21.1702, lng: 72.8311 },
  { state: 'Gujarat', district: 'Vadodara', market: 'Vadodara', code: 'GJ-VAD-VADO', lat: 22.3072, lng: 73.1812 },
  { state: 'Gujarat', district: 'Junagadh', market: 'Junagadh', code: 'GJ-JUN-JUNA', lat: 21.5222, lng: 70.4579 },
  { state: 'Gujarat', district: 'Gondal', market: 'Gondal', code: 'GJ-GON-GOND', lat: 21.9600, lng: 70.7953 },
  { state: 'Gujarat', district: 'Unjha', market: 'Unjha', code: 'GJ-UNJ-UNJH', lat: 23.8013, lng: 72.3938 },

  // Uttar Pradesh
  { state: 'Uttar Pradesh', district: 'Lucknow', market: 'Lucknow', code: 'UP-LUC-LUCK', lat: 26.8467, lng: 80.9462 },
  { state: 'Uttar Pradesh', district: 'Kanpur', market: 'Kanpur', code: 'UP-KAN-KANP', lat: 26.4499, lng: 80.3319 },
  { state: 'Uttar Pradesh', district: 'Agra', market: 'Agra', code: 'UP-AGR-AGRA', lat: 27.1767, lng: 78.0081 },
  { state: 'Uttar Pradesh', district: 'Varanasi', market: 'Varanasi', code: 'UP-VAR-VARA', lat: 25.3176, lng: 82.9739 },
  { state: 'Uttar Pradesh', district: 'Allahabad', market: 'Prayagraj', code: 'UP-ALL-PRAY', lat: 25.4358, lng: 81.8463 },
  { state: 'Uttar Pradesh', district: 'Meerut', market: 'Meerut', code: 'UP-MEE-MEER', lat: 28.9845, lng: 77.7064 },
  { state: 'Uttar Pradesh', district: 'Bareilly', market: 'Bareilly', code: 'UP-BAR-BARE', lat: 28.3670, lng: 79.4304 },

  // Punjab & Haryana
  { state: 'Punjab', district: 'Ludhiana', market: 'Ludhiana', code: 'PB-LUD-LUDH', lat: 30.9010, lng: 75.8573 },
  { state: 'Punjab', district: 'Amritsar', market: 'Amritsar', code: 'PB-AMR-AMRI', lat: 31.6340, lng: 74.8723 },
  { state: 'Punjab', district: 'Jalandhar', market: 'Jalandhar', code: 'PB-JAL-JALA', lat: 31.3260, lng: 75.5762 },
  { state: 'Punjab', district: 'Bathinda', market: 'Bathinda', code: 'PB-BAT-BATH', lat: 30.2110, lng: 74.9455 },
  { state: 'Punjab', district: 'Khanna', market: 'Khanna', code: 'PB-KHA-KHAN', lat: 30.6993, lng: 76.2221 },
  { state: 'Haryana', district: 'Karnal', market: 'Karnal', code: 'HR-KAR-KARN', lat: 29.6857, lng: 76.9905 },
  { state: 'Haryana', district: 'Hisar', market: 'Hisar', code: 'HR-HIS-HISA', lat: 29.1492, lng: 75.7217 },
  { state: 'Haryana', district: 'Sirsa', market: 'Sirsa', code: 'HR-SIR-SIRS', lat: 29.5349, lng: 75.0280 },

  // Karnataka
  { state: 'Karnataka', district: 'Bangalore', market: 'Bangalore (Yeshwantpur)', code: 'KA-BAN-YESH', lat: 13.0285, lng: 77.5339 },
  { state: 'Karnataka', district: 'Hubli', market: 'Hubli', code: 'KA-HUB-HUBL', lat: 15.3647, lng: 75.1240 },
  { state: 'Karnataka', district: 'Davangere', market: 'Davangere', code: 'KA-DAV-DAVA', lat: 14.4644, lng: 75.9218 },
  { state: 'Karnataka', district: 'Belgaum', market: 'Belgaum', code: 'KA-BEL-BELG', lat: 15.8497, lng: 74.4977 },
  { state: 'Karnataka', district: 'Mysore', market: 'Mysore', code: 'KA-MYS-MYSO', lat: 12.2958, lng: 76.6394 },

  // Tamil Nadu
  { state: 'Tamil Nadu', district: 'Chennai', market: 'Koyambedu', code: 'TN-CHE-KOYA', lat: 13.0691, lng: 80.1946 },
  { state: 'Tamil Nadu', district: 'Coimbatore', market: 'Coimbatore', code: 'TN-COI-COIM', lat: 11.0168, lng: 76.9558 },
  { state: 'Tamil Nadu', district: 'Madurai', market: 'Madurai', code: 'TN-MAD-MADU', lat: 9.9252, lng: 78.1198 },
  { state: 'Tamil Nadu', district: 'Salem', market: 'Salem', code: 'TN-SAL-SALE', lat: 11.6643, lng: 78.1460 },
  { state: 'Tamil Nadu', district: 'Erode', market: 'Erode', code: 'TN-ERO-EROD', lat: 11.3410, lng: 77.7172 },

  // Andhra Pradesh & Telangana
  { state: 'Telangana', district: 'Hyderabad', market: 'Bowenpally', code: 'TG-HYD-BOWE', lat: 17.4639, lng: 78.4738 },
  { state: 'Andhra Pradesh', district: 'Vijayawada', market: 'Vijayawada', code: 'AP-VIJ-VIJA', lat: 16.5062, lng: 80.6480 },
  { state: 'Andhra Pradesh', district: 'Guntur', market: 'Guntur', code: 'AP-GUN-GUNT', lat: 16.3067, lng: 80.4365 },
  { state: 'Andhra Pradesh', district: 'Kurnool', market: 'Kurnool', code: 'AP-KUR-KURN', lat: 15.8281, lng: 78.0373 },

  // West Bengal
  { state: 'West Bengal', district: 'Kolkata', market: 'Kolkata (Posta)', code: 'WB-KOL-POST', lat: 22.5868, lng: 88.3499 },
  { state: 'West Bengal', district: 'Siliguri', market: 'Siliguri', code: 'WB-SIL-SILI', lat: 26.7271, lng: 88.3953 },
  { state: 'West Bengal', district: 'Burdwan', market: 'Burdwan', code: 'WB-BUR-BURD', lat: 23.2324, lng: 87.8615 },

  // Bihar & Jharkhand
  { state: 'Bihar', district: 'Patna', market: 'Patna', code: 'BR-PAT-PATN', lat: 25.6093, lng: 85.1376 },
  { state: 'Bihar', district: 'Muzaffarpur', market: 'Muzaffarpur', code: 'BR-MUZ-MUZA', lat: 26.1209, lng: 85.3647 },
  { state: 'Jharkhand', district: 'Ranchi', market: 'Ranchi', code: 'JH-RAN-RANC', lat: 23.3441, lng: 85.3096 },

  // Kerala
  { state: 'Kerala', district: 'Kochi', market: 'Ernakulam', code: 'KL-KOC-ERNA', lat: 9.9816, lng: 76.2999 },
  { state: 'Kerala', district: 'Thrissur', market: 'Thrissur', code: 'KL-THR-THRI', lat: 10.5276, lng: 76.2144 },
  { state: 'Kerala', district: 'Kozhikode', market: 'Kozhikode', code: 'KL-KOZ-KOZH', lat: 11.2588, lng: 75.7804 },

  // Odisha
  { state: 'Odisha', district: 'Bhubaneswar', market: 'Bhubaneswar', code: 'OD-BHU-BHUB', lat: 20.2961, lng: 85.8245 },
  { state: 'Odisha', district: 'Cuttack', market: 'Cuttack', code: 'OD-CUT-CUTT', lat: 20.4625, lng: 85.8828 },

  // Assam
  { state: 'Assam', district: 'Guwahati', market: 'Guwahati (Fancy Bazar)', code: 'AS-GUW-FANC', lat: 26.1876, lng: 91.7461 },

  // Chhattisgarh
  { state: 'Chhattisgarh', district: 'Raipur', market: 'Raipur', code: 'CG-RAI-RAIP', lat: 21.2514, lng: 81.6296 },
  { state: 'Chhattisgarh', district: 'Durg', market: 'Durg', code: 'CG-DUR-DURG', lat: 21.1904, lng: 81.2849 },
];

export const MANDI_BY_CODE = new Map(INDIA_MANDIS.map(m => [m.code, m]));
export const MANDIS_BY_STATE = INDIA_MANDIS.reduce((acc, m) => {
  if (!acc[m.state]) acc[m.state] = [];
  acc[m.state].push(m);
  return acc;
}, {} as Record<string, MandiLocation[]>);
