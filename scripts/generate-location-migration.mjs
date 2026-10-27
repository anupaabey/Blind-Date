// Maintainer helper: review the generated migration before applying to existing databases.
import { writeFileSync } from 'node:fs';
import { provinces } from '../src/lib/locations.ts';
import { questions } from '../src/lib/questions.ts';
const centers = {
  Colombo: [6.9271, 79.8612],
  Gampaha: [7.0873, 79.999],
  Kalutara: [6.5854, 79.9607],
  Kandy: [7.2906, 80.6337],
  Matale: [7.4675, 80.6234],
  'Nuwara Eliya': [6.9497, 80.7891],
  Galle: [6.0329, 80.2168],
  Matara: [5.9549, 80.555],
  Hambantota: [6.1246, 81.1185],
  Jaffna: [9.6615, 80.0255],
  Kilinochchi: [9.3803, 80.377],
  Mannar: [8.981, 79.9044],
  Mullaitivu: [9.2671, 80.8142],
  Vavuniya: [8.7514, 80.4971],
  Batticaloa: [7.7102, 81.6924],
  Ampara: [7.2912, 81.6724],
  Trincomalee: [8.5874, 81.2152],
  Kurunegala: [7.4863, 80.3623],
  Puttalam: [8.0362, 79.8283],
  Anuradhapura: [8.3114, 80.4037],
  Polonnaruwa: [7.9403, 81.0188],
  Badulla: [6.9934, 81.055],
  Monaragala: [6.8728, 81.3507],
  Ratnapura: [6.7056, 80.3847],
  Kegalle: [7.2513, 80.3464],
};
const towns = {
  'Dehiwala-Mount Lavinia': [6.8301, 79.8801],
  Maharagama: [6.848, 79.9265],
  Moratuwa: [6.773, 79.8816],
  'Sri Jayawardenepura Kotte': [6.8941, 79.9025],
  Negombo: [7.2083, 79.8358],
  Kelaniya: [6.9553, 79.922],
  Wattala: [6.9907, 79.8912],
  Panadura: [6.7132, 79.9026],
  Horana: [6.7159, 80.0626],
  Peradeniya: [7.2699, 80.5938],
  Gampola: [7.1644, 80.5767],
  Dambulla: [7.8742, 80.6511],
  Hatton: [6.8916, 80.5955],
  Ambalangoda: [6.2355, 80.0538],
  Hikkaduwa: [6.1395, 80.1063],
  Weligama: [5.972, 80.4297],
  Tangalle: [6.024, 80.7941],
  'Point Pedro': [9.8167, 80.2333],
  Kalmunai: [7.409, 81.8347],
  Kinniya: [8.497, 81.179],
  Kuliyapitiya: [7.4688, 80.0401],
  Chilaw: [7.5758, 79.7953],
  Bandarawela: [6.829, 80.99],
  Ella: [6.8667, 81.0466],
  Wellawaya: [6.7369, 81.1028],
  Balangoda: [6.649, 80.7058],
  Mawanella: [7.2519, 80.444],
};
const q = (s) => `'${s.replaceAll("'", "''")}'`;
let sql =
  '-- Reviewed Sri Lankan town allowlist; coordinates are approximate town centres, not residential locations.\n';
for (const [province, ds] of Object.entries(provinces)) {
  sql += `insert into public.provinces values(${q(province)});\n`;
  for (const [district, cities] of Object.entries(ds)) {
    sql += `insert into public.districts values(${q(district)},${q(province)},${district === 'Colombo'});\n`;
    for (const city of cities) {
      const c = towns[city] ?? centers[city];
      if (!c) throw Error(city);
      sql += `insert into public.cities values(${q(district)},${q(city)},${c[0]},${c[1]});\n`;
    }
  }
}
questions.forEach(([cat, prompt], i) => {
  sql += `insert into public.questionnaire_questions values(${i + 1},${q(cat)},${q(prompt)});\n`;
});
sql += `insert into public.date_packages values
('standard','Standard Date',2500,'Compatibility matching, mutual invitation and booking coordination. Food, drinks and venue charges are additional.',true),
('curated','Curated Date',4500,'Personalized matching, venue coordination and an icebreaker activity. Food, drinks and venue charges are additional.',true),
('premium','Premium Mystery Date',7500,'Personalized matchmaking, premium venue coordination and custom date planning. Food, drinks and venue charges are additional.',true);\n`;
writeFileSync('supabase/migrations/202610270002_reference_data.sql', sql);
