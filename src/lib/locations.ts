export const provinces = {
  Western: {
    Colombo: [
      'Colombo',
      'Dehiwala-Mount Lavinia',
      'Maharagama',
      'Moratuwa',
      'Sri Jayawardenepura Kotte',
    ],
    Gampaha: ['Gampaha', 'Negombo', 'Kelaniya', 'Wattala'],
    Kalutara: ['Kalutara', 'Panadura', 'Horana'],
  },
  Central: {
    Kandy: ['Kandy', 'Peradeniya', 'Gampola'],
    Matale: ['Matale', 'Dambulla'],
    'Nuwara Eliya': ['Nuwara Eliya', 'Hatton'],
  },
  Southern: {
    Galle: ['Galle', 'Ambalangoda', 'Hikkaduwa'],
    Matara: ['Matara', 'Weligama'],
    Hambantota: ['Hambantota', 'Tangalle'],
  },
  Northern: {
    Jaffna: ['Jaffna', 'Point Pedro'],
    Kilinochchi: ['Kilinochchi'],
    Mannar: ['Mannar'],
    Mullaitivu: ['Mullaitivu'],
    Vavuniya: ['Vavuniya'],
  },
  Eastern: {
    Batticaloa: ['Batticaloa'],
    Ampara: ['Ampara', 'Kalmunai'],
    Trincomalee: ['Trincomalee', 'Kinniya'],
  },
  'North Western': { Kurunegala: ['Kurunegala', 'Kuliyapitiya'], Puttalam: ['Puttalam', 'Chilaw'] },
  'North Central': { Anuradhapura: ['Anuradhapura'], Polonnaruwa: ['Polonnaruwa'] },
  Uva: { Badulla: ['Badulla', 'Bandarawela', 'Ella'], Monaragala: ['Monaragala', 'Wellawaya'] },
  Sabaragamuwa: { Ratnapura: ['Ratnapura', 'Balangoda'], Kegalle: ['Kegalle', 'Mawanella'] },
} as const;
export const districts = Object.values(provinces).flatMap((p) => Object.keys(p));
export function citiesFor(district: string): readonly string[] {
  return (
    Object.values(provinces)
      .flatMap((p) => Object.entries(p))
      .find(([d]) => d === district)?.[1] ?? []
  );
}
export const isLocation = (district: string, city: string) =>
  districts.includes(district) && citiesFor(district).includes(city);
export const isLaunchDistrict = (district: string) => district === 'Colombo';
