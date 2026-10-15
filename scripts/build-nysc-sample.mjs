import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.NYSC_DATA_DIR ?? resolve(here, '../../intellign/data');
const OUT = resolve(here, '../src/app/demo/nysc-deployment/data/sample-assignments.json');
const SEED = 42;
const N_GRADUATES = 40;
const N_FACILITIES = 60;

// Port of specialization_mapping, final values (v4 engine lines 74-110).
const ACCEPTS = {
  'General Practice': ['General Medicine', 'Dentistry', 'Pharmacology', 'Medical Laboratory Science', 'Community Health', 'Nursing', 'Medical Biochemistry', 'Medical Microbiology', 'Clinical Biochemistry', 'Haematology', 'Parasitology', 'Psychiatric Nursing', 'Medical Surgical Nursing', 'Public Health', 'Environmental Health', 'Health Promotion', 'Primary Health Care', 'Geriatric Nursing'],
  'Immunization': ['Community Health', 'Community Health Nursing', 'Nursing', 'Public Health'],
  'Maternal and Child Health': ['Maternal and Child Health', 'Midwifery', 'Paediatric Nursing'],
};

// Port of critical_disease_weights (v4 engine lines 114-125).
const DISEASE_WEIGHT = {
  'Lassa fever': 20, 'Drug-Resistant TB': 20, 'Meningitis': 18, 'Stroke': 18, 'Cancer': 17, 'Heart Disease': 16, 'Kidney Disease': 16, 'Leukemia': 16, 'Complicated HIV/AIDS': 15, 'Sickle Cell Disease': 15, 'Neurosurgery': 15, 'Cholera': 14, 'Severe Malaria': 13, 'Tuberculosis (TB)': 12, 'HIV/AIDS': 12, 'Hepatitis': 11, 'Preeclampsia': 11, 'Diabetes': 10, 'Hypertension': 10, 'Pneumonia': 10, 'Severe Malnutrition': 10, 'Complicated Labor': 9, 'Epilepsy': 8, 'Malaria': 7, 'Typhoid': 6, 'Respiratory Infections': 5, 'Diarrhea Diseases': 5, 'Anemia in Pregnancy': 5, 'Yellow Fever': 4, 'Measles': 4, 'Malnutrition': 4, 'Anemia': 3, 'Accidents': 3, 'Trauma': 3, 'Appendicitis': 2, 'Fibroids': 2, 'Hernia Repair': 1, 'Polio': 1, 'Tetanus': 1, 'Heart Surgery': 20, 'Cancer Surgery': 18,
};

export function parseCsv(text) {
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const num = (v, d = 0) => (Number.isFinite(Number(v)) && v !== '' ? Number(v) : d);

function facilityView(f) {
  const capacity = num(f.personnel_capacity, 10);
  const existing = num(f.no_of_doctors) + num(f.no_of_nurses) + num(f.no_of_pharmacists) + num(f.no_of_other_staff);
  const diseases = (f.prevalent_diseases ?? '').split(',').map((d) => d.trim()).filter(Boolean);
  const diseaseScore = diseases.reduce((s, d) => s + (DISEASE_WEIGHT[d] ?? 0), 0);
  return {
    name: f.facility_name, state: f.state, centre: f.centre_specialization, diseases: diseases.join(', '),
    openSlots: Math.max(0, capacity - existing), criticality: Math.max(0, capacity - existing) * 0.5 + diseaseScore,
  };
}

export function buildSample(graduateCsv, facilityCsv) {
  const rand = mulberry32(SEED);
  const grads = parseCsv(graduateCsv).filter((g) => g.id_number && g.specialization);
  const facilities = parseCsv(facilityCsv)
    .map(facilityView)
    .filter((f) => f.name && f.state && ACCEPTS[f.centre] && f.openSlots >= 1);
  const sortedGrads = grads.sort((a, b) => a.id_number.localeCompare(b.id_number));
  const pickedGrads = shuffled(sortedGrads, rand).slice(0, N_GRADUATES);
  const pool = shuffled(facilities, rand).slice(0, N_FACILITIES).map((f) => ({ ...f, remaining: f.openSlots }));

  return pickedGrads
    .sort((a, b) => a.id_number.localeCompare(b.id_number))
    .map((g, i) => {
      let best = null; let bestScore = -Infinity;
      for (const f of pool) {
        if (f.remaining < 1) continue;
        const score = (ACCEPTS[f.centre].includes(g.specialization) ? 50 : -100) + f.criticality;
        if (score > bestScore) { bestScore = score; best = f; }
      }
      if (!best) throw new Error(`no open facility slot for graduate ${g.id_number}; raise N_FACILITIES or change SEED`);
      const skillMatch = ACCEPTS[best.centre].includes(g.specialization);
      const openSlotsBefore = best.remaining;
      best.remaining -= 1;
      const need = skillMatch
        ? `${g.specialization} is accepted by a ${best.centre} facility`
        : `${g.specialization} is not on the ${best.centre} list; this facility's need and free slots ranked highest for this graduate`;
      return {
        assignmentId: String(i + 1), graduateId: g.id_number, specialization: g.specialization,
        facilityName: best.name, state: best.state, centreSpecialization: best.centre, diseases: best.diseases || 'not listed',
        skillMatch, openSlotsBefore, overCapacity: false,
        rationale: `${need}. ${openSlotsBefore} free slot${openSlotsBefore === 1 ? '' : 's'} before this placement. Disease burden: ${best.diseases || 'not listed'}.`,
      };
    });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const g = readFileSync(resolve(DATA_DIR, 'generated_nysc_healthcare_graduates.csv'), 'utf8');
  const f = readFileSync(resolve(DATA_DIR, 'primary_facilities.csv'), 'utf8');
  const rows = buildSample(g, f);
  writeFileSync(OUT, JSON.stringify(rows, null, 2) + '\n');
  console.log(`wrote ${rows.length} rows to ${OUT}; skill matches: ${rows.filter((r) => r.skillMatch).length}`);
}
