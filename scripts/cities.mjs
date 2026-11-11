// Approximate city-centre coordinates (to ~0.1 degree) used only for the "near me" distance filter.
// An event whose city is not in this list simply has no distance and is left out of near-me results.
export const CITIES = {
  'san francisco': [37.77, -122.42], 'sf': [37.77, -122.42], 'oakland': [37.8, -122.27], 'berkeley': [37.87, -122.27],
  'palo alto': [37.44, -122.14], 'stanford': [37.43, -122.17], 'mountain view': [37.39, -122.08], 'san jose': [37.34, -121.89],
  'sunnyvale': [37.37, -122.04], 'santa clara': [37.35, -121.96], 'los angeles': [34.05, -118.24], 'san diego': [32.72, -117.16],
  'irvine': [33.68, -117.83], 'santa barbara': [34.42, -119.7], 'sacramento': [38.58, -121.49], 'seattle': [47.61, -122.33],
  'redmond': [47.67, -122.12], 'bellevue': [47.61, -122.2], 'portland': [45.52, -122.68], 'las vegas': [36.17, -115.14],
  'phoenix': [33.45, -112.07], 'tempe': [33.43, -111.94], 'tucson': [32.22, -110.97], 'salt lake city': [40.76, -111.89],
  'denver': [39.74, -104.99], 'boulder': [40.01, -105.27], 'fort collins': [40.59, -105.08], 'colorado springs': [38.83, -104.82],
  'golden': [39.76, -105.22], 'longmont': [40.17, -105.1], 'albuquerque': [35.08, -106.65], 'austin': [30.27, -97.74],
  'dallas': [32.78, -96.8], 'houston': [29.76, -95.37], 'san antonio': [29.42, -98.49], 'college station': [30.63, -96.33],
  'kansas city': [39.1, -94.58], 'st. louis': [38.63, -90.2], 'saint louis': [38.63, -90.2], 'minneapolis': [44.98, -93.27],
  'madison': [43.07, -89.4], 'milwaukee': [43.04, -87.91], 'chicago': [41.88, -87.63], 'urbana': [40.11, -88.21],
  'champaign': [40.12, -88.24], 'west lafayette': [40.43, -86.91], 'indianapolis': [39.77, -86.16], 'detroit': [42.33, -83.05],
  'ann arbor': [42.28, -83.74], 'columbus': [39.96, -83.0], 'cleveland': [41.5, -81.69], 'cincinnati': [39.1, -84.51],
  'kent': [41.15, -81.36], 'pittsburgh': [40.44, -80.0], 'philadelphia': [39.95, -75.17], 'new york': [40.71, -74.01],
  'new york city': [40.71, -74.01], 'nyc': [40.71, -74.01], 'brooklyn': [40.68, -73.94], 'princeton': [40.35, -74.66],
  'newark': [40.74, -74.17], 'new haven': [41.31, -72.93], 'providence': [41.82, -71.41], 'boston': [42.36, -71.06],
  'cambridge': [42.37, -71.11], 'worcester': [42.26, -71.8], 'washington': [38.91, -77.04], 'washington dc': [38.91, -77.04],
  'washington, d.c.': [38.91, -77.04], 'baltimore': [39.29, -76.61], 'college park': [38.99, -76.94], 'richmond': [37.54, -77.44],
  'charlottesville': [38.03, -78.48], 'raleigh': [35.78, -78.64], 'durham': [35.99, -78.9], 'chapel hill': [35.91, -79.06],
  'charlotte': [35.23, -80.84], 'atlanta': [33.75, -84.39], 'nashville': [36.16, -86.78], 'orlando': [28.54, -81.38],
  'tampa': [27.95, -82.46], 'miami': [25.76, -80.19], 'gainesville': [29.65, -82.32], 'honolulu': [21.31, -157.86],
  'toronto': [43.65, -79.38], 'waterloo': [43.46, -80.52], 'ottawa': [45.42, -75.7], 'montreal': [45.5, -73.57],
  'vancouver': [49.28, -123.12], 'calgary': [51.05, -114.07], 'mexico city': [19.43, -99.13], 'sao paulo': [-23.55, -46.63],
  'são paulo': [-23.55, -46.63], 'buenos aires': [-34.6, -58.38], 'bogota': [4.71, -74.07], 'london': [51.51, -0.13],
  'cambridge, uk': [52.21, 0.12], 'oxford': [51.75, -1.26], 'manchester': [53.48, -2.24], 'edinburgh': [55.95, -3.19],
  'dublin': [53.35, -6.26], 'paris': [48.86, 2.35], 'amsterdam': [52.37, 4.9], 'brussels': [50.85, 4.35],
  'berlin': [52.52, 13.41], 'munich': [48.14, 11.58], 'hamburg': [53.55, 9.99], 'zurich': [47.37, 8.54],
  'vienna': [48.21, 16.37], 'prague': [50.08, 14.44], 'warsaw': [52.23, 21.01], 'stockholm': [59.33, 18.07],
  'copenhagen': [55.68, 12.57], 'oslo': [59.91, 10.75], 'helsinki': [60.17, 24.94], 'madrid': [40.42, -3.7],
  'barcelona': [41.39, 2.17], 'lisbon': [38.72, -9.14], 'milan': [45.46, 9.19], 'rome': [41.9, 12.5],
  'athens': [37.98, 23.73], 'istanbul': [41.01, 28.98], 'tel aviv': [32.09, 34.78], 'dubai': [25.2, 55.27],
  'riyadh': [24.71, 46.68], 'cairo': [30.04, 31.24], 'lagos': [6.52, 3.38], 'nairobi': [-1.29, 36.82],
  'cape town': [-33.92, 18.42], 'johannesburg': [-26.2, 28.05], 'mumbai': [19.08, 72.88], 'delhi': [28.61, 77.21],
  'new delhi': [28.61, 77.21], 'bangalore': [12.97, 77.59], 'bengaluru': [12.97, 77.59], 'hyderabad': [17.39, 78.49],
  'chennai': [13.08, 80.27], 'pune': [18.52, 73.86], 'kolkata': [22.57, 88.36], 'ahmedabad': [23.02, 72.57],
  'bhopal': [23.26, 77.41], 'jaipur': [26.91, 75.79], 'karachi': [24.86, 67.0], 'lahore': [31.55, 74.34],
  'dhaka': [23.81, 90.41], 'kathmandu': [27.72, 85.32], 'colombo': [6.93, 79.86], 'singapore': [1.35, 103.82],
  'kuala lumpur': [3.14, 101.69], 'jakarta': [-6.21, 106.85], 'bangkok': [13.76, 100.5], 'ho chi minh city': [10.82, 106.63],
  'hanoi': [21.03, 105.85], 'manila': [14.6, 120.98], 'hong kong': [22.32, 114.17], 'shenzhen': [22.54, 114.06],
  'shanghai': [31.23, 121.47], 'beijing': [39.9, 116.41], 'taipei': [25.03, 121.57], 'seoul': [37.57, 126.98],
  'tokyo': [35.68, 139.69], 'osaka': [34.69, 135.5], 'sydney': [-33.87, 151.21], 'melbourne': [-37.81, 144.96],
  'brisbane': [-27.47, 153.03], 'auckland': [-36.85, 174.76],
};

export function geocode(city) {
  if (!city) return null;
  const k = String(city).toLowerCase().trim();
  return CITIES[k] || CITIES[k.split(',')[0].trim()] || null;
}
