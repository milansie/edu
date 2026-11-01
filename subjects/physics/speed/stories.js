/**
 * Hrdinové slovních úloh: `name` (podmět), `go` a `moved` (tvar slovesa „jel“ a „ujel“ pro větu o pohybu),
 * `kmh` rozsah běžné rychlosti v km/h, `lengths` a `times` jednotky, ve kterých je příběh věcně uvěřitelný,
 * `maxTime` nejdelší uvěřitelná doba pohybu v sekundách a `vehicle` příznak dopravního prostředku
 * (jízdní řád).
 */
export const STORIES = [
  { name: 'Automobil', go: 'jel', moved: 'ujel', kmh: [30, 130], lengths: ['km', 'm'], times: ['s', 'min', 'h'], maxTime: 36000, vehicle: true },
  { name: 'Autobus', go: 'jel', moved: 'ujel', kmh: [30, 90], lengths: ['km', 'm'], times: ['s', 'min', 'h'], maxTime: 28800, vehicle: true },
  { name: 'Vlak', go: 'jel', moved: 'ujel', kmh: [40, 200], lengths: ['km', 'm'], times: ['s', 'min', 'h'], maxTime: 28800, vehicle: true },
  { name: 'Cyklista', go: 'jel', moved: 'ujel', kmh: [10, 35], lengths: ['km', 'm'], times: ['s', 'min', 'h'], maxTime: 10800, vehicle: true },
  { name: 'Žák na koloběžce', go: 'jel', moved: 'ujel', kmh: [8, 15], lengths: ['km', 'm'], times: ['s', 'min', 'h'], maxTime: 3600 },
  { name: 'Chodec', go: 'šel', moved: 'ušel', kmh: [3, 6], lengths: ['km', 'm'], times: ['s', 'min', 'h'], maxTime: 14400 },
  { name: 'Vlaštovka', go: 'letěla', moved: 'uletěla', kmh: [30, 70], lengths: ['km', 'm'], times: ['s', 'min', 'h'], maxTime: 3600 },
  { name: 'Gepard', go: 'běžel', moved: 'uběhl', kmh: [60, 110], lengths: ['km', 'm'], times: ['s', 'min'], maxTime: 120 },
];
