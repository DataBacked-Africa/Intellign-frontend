"use client";

/**
 * /demo — Full DS shell: sidebar + chat (narrows on canvas open) + sliding canvas panel.
 * Canvas has Monitor / Results / Assignments / Goals / Config / Datasets tabs.
 * Goals tab has full CRUD (add, edit weight/type/description, delete).
 * No backend required — all mock data.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, User, CheckCircle2, Database, Target, Zap, ChevronRight, Download,
    Sparkles, ChevronDown, Check, Edit3, X, Search, SquarePen, LogOut,
    PanelLeftClose, Minimize2, Plus, Trash2, Save, Cpu, Settings, Share2,
    TrendingUp, Play, BarChart2, ChevronLeft, ChevronUp, Menu,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import GoalDetailPanel from '@/components/AI-Components/GoalDetailPanel';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
    bone:      '#F4EFE7',
    boneDeep:  '#E8E0D2',
    boneDarker:'#DDD5C5',
    maroon:    '#5C1427',   // CTAs, active tabs, weight bars, badges — sparingly
    maroonDeep:'#3E0E1A',   // Display headlines only
    maroonRich:'#731931',
    maroonMid: '#8A1E3A',   // matches --brand-maroon-bright in the workspace
    ink:       '#14110F',
    neutral50: '#FAFAF8',
    neutral100:'#F2F1ED',
    neutral200:'#E5E3DC',
    neutral300:'#CDCBC2',
    neutral400:'#9E9C92',
    neutral500:'#6F6E66',
    neutral600:'#4A4945',
    neutral700:'#2E2D2A',
};

// ── Mock data ─────────────────────────────────────────────────────────────────

interface MockGoal {
    id: string;
    description: string;
    award_type: 'Reward' | 'Penalty';
    weight: number;
    logic_type: string;
    resource_columns: string[];
    target_columns: string[];
}

interface MockAssignment {
    assignment_id: string;
    resource: { id: string };
    target: { id: string };
    score: number;
    approval_status: 'approved' | 'pending' | 'rejected' | 'modified';
    notes: string | null;
}

interface Scenario {
    id: string;
    domain: string;        // sidebar label, e.g. "Healthcare"
    task: string;          // task type, e.g. "Assignment"
    solver: string;        // human label of routed solver
    title: string;         // context-bar problem name
    blurb: string;         // banner sub-line
    resourceLabel: string; // "graduates"
    targetLabel: string;   // "facilities"
    resourceCount: number;
    targetCount: number;
    userPrompt: string;    // chat seed (the user's opening message)
    goals: MockGoal[];
    assignments: MockAssignment[];
    resources: Record<string, string | number>[];
    targets: Record<string, string | number>[];
}

const SCENARIOS: Scenario[] = [
    {
        id: 'healthcare', domain: 'Healthcare', task: 'Assignment', solver: 'Genetic algorithm',
        title: 'NYSC Healthcare Deployment', blurb: '50 graduates → 20 facilities by specialization & disease burden',
        resourceLabel: 'graduates', targetLabel: 'facilities', resourceCount: 50, targetCount: 20,
        userPrompt: 'I need to deploy NYSC healthcare graduates to primary health facilities across Nigeria. Match their medical specializations to facility needs and prioritise facilities with critical disease burden.',
        goals: [
            { id: 'g1', description: 'Match medical specialization to facility needs.', award_type: 'Reward', weight: 45, logic_type: 'categorical_match', resource_columns: ['specialization'], target_columns: ['centre_specialization'] },
            { id: 'g2', description: 'Prioritise facilities with critical disease burden.', award_type: 'Reward', weight: 35, logic_type: 'weighted_scoring', resource_columns: [], target_columns: ['prevalent_diseases'] },
            { id: 'g3', description: 'Respect facility personnel capacity.', award_type: 'Penalty', weight: 20, logic_type: 'numeric_threshold', resource_columns: [], target_columns: ['personnel_capacity'] },
        ],
        assignments: [
            { assignment_id: '1', resource: { id: 'HW-0042' }, target: { id: 'FAC-LAG-12' }, score: 0.962, approval_status: 'approved', notes: 'Adaeze N. (RN, ICU) matched to Lagos PHC — ICU + emergency cover priority. Closest ICU-trained resource (5 km, in-state). No shift conflicts next week.' },
            { assignment_id: '2', resource: { id: 'HW-0118' }, target: { id: 'FAC-KAN-03' }, score: 0.941, approval_status: 'approved', notes: 'Yusuf I. (RN, Pediatrics) to Kano Cottage — same-state assignment, pediatric specialisation exact match.' },
            { assignment_id: '3', resource: { id: 'HW-0067' }, target: { id: 'FAC-ENU-08' }, score: 0.912, approval_status: 'pending', notes: 'Chiamaka O. (Midwife) to Enugu MCH — exact specialty fit. Score reduced: 3× deployments in last 30 days (load-balancing penalty).' },
            { assignment_id: '4', resource: { id: 'HW-0089' }, target: { id: 'FAC-ABU-21' }, score: 0.876, approval_status: 'modified', notes: null },
            { assignment_id: '5', resource: { id: 'HW-0014' }, target: { id: 'FAC-PHC-05' }, score: 0.854, approval_status: 'approved', notes: null },
            { assignment_id: '6', resource: { id: 'HW-0103' }, target: { id: 'FAC-IBA-02' }, score: 0.831, approval_status: 'pending', notes: null },
            { assignment_id: '7', resource: { id: 'HW-0029' }, target: { id: 'FAC-KAD-14' }, score: 0.791, approval_status: 'rejected', notes: null },
        ],
        resources: [
            { id: 'HW-0042', name: 'Adaeze N.', specialization: 'ICU / Emergency', qualification: 'RN (BSc)', deployed: 'Lagos' },
            { id: 'HW-0118', name: 'Yusuf I.', specialization: 'Pediatrics', qualification: 'RN', deployed: 'Kano' },
            { id: 'HW-0067', name: 'Chiamaka O.', specialization: 'Maternal health', qualification: 'Midwife', deployed: 'Enugu' },
            { id: 'HW-0089', name: 'Tunde A.', specialization: 'Community health', qualification: 'CHEW', deployed: 'FCT' },
            { id: 'HW-0014', name: 'Folake B.', specialization: 'Cardiology', qualification: 'RN (MSc)', deployed: 'Rivers' },
        ],
        targets: [
            { id: 'FAC-LAG-12', name: 'Ajeromi PHC, Lagos', need: 'ICU + emergency', diseases: 'Malaria, hypertension', capacity: 4 },
            { id: 'FAC-KAN-03', name: 'Kano Cottage Hospital', need: 'Pediatric + maternal', diseases: 'Measles, malnutrition', capacity: 6 },
            { id: 'FAC-ENU-08', name: 'Enugu MCH', need: 'Maternal health', diseases: 'Maternal anaemia', capacity: 3 },
            { id: 'FAC-ABU-21', name: 'FCT Field Clinic', need: 'Community health', diseases: 'HIV/AIDS, TB', capacity: 8 },
            { id: 'FAC-PHC-05', name: 'PH Health Centre', need: 'Cardio + general', diseases: 'Hypertension', capacity: 5 },
        ],
    },
    {
        id: 'logistics', domain: 'Logistics', task: 'Routing', solver: 'OR-Tools routing',
        title: 'Last-Mile Delivery Routing', blurb: '60 drivers → 240 stops minimising distance & honouring capacity',
        resourceLabel: 'drivers', targetLabel: 'zones', resourceCount: 60, targetCount: 18,
        userPrompt: 'Assign my delivery drivers to zones and sequence their stops. Minimise total distance, respect each van’s capacity, and keep every route under 8 hours.',
        goals: [
            { id: 'g1', description: 'Minimise total driving distance.', award_type: 'Reward', weight: 50, logic_type: 'distance_min', resource_columns: ['depot_x', 'depot_y'], target_columns: ['lat', 'lng'] },
            { id: 'g2', description: 'Stay within van load capacity.', award_type: 'Penalty', weight: 30, logic_type: 'numeric_threshold', resource_columns: ['capacity_kg'], target_columns: ['demand_kg'] },
            { id: 'g3', description: 'Keep each route under 8 hours.', award_type: 'Penalty', weight: 20, logic_type: 'time_window', resource_columns: [], target_columns: ['service_min'] },
        ],
        assignments: [
            { assignment_id: '1', resource: { id: 'DRV-07' }, target: { id: 'ZN-IKEJA' }, score: 0.971, approval_status: 'approved', notes: 'Driver 07 (van, 800 kg) → Ikeja cluster: 14 stops, 62 km, 6h10m. Tightest route, fully within capacity.' },
            { assignment_id: '2', resource: { id: 'DRV-12' }, target: { id: 'ZN-LEKKI' }, score: 0.948, approval_status: 'approved', notes: 'Driver 12 → Lekki corridor: 11 stops, 71 km. Bridge toll window respected.' },
            { assignment_id: '3', resource: { id: 'DRV-03' }, target: { id: 'ZN-YABA' }, score: 0.917, approval_status: 'pending', notes: 'Driver 03 → Yaba/Surulere: dense 18-stop route, near capacity (760/800 kg).' },
            { assignment_id: '4', resource: { id: 'DRV-21' }, target: { id: 'ZN-AJAH' }, score: 0.883, approval_status: 'approved', notes: null },
            { assignment_id: '5', resource: { id: 'DRV-09' }, target: { id: 'ZN-APAPA' }, score: 0.857, approval_status: 'modified', notes: null },
            { assignment_id: '6', resource: { id: 'DRV-15' }, target: { id: 'ZN-OSHODI' }, score: 0.822, approval_status: 'pending', notes: null },
        ],
        resources: [
            { id: 'DRV-07', name: 'Emeka U.', vehicle: 'Van', capacity_kg: 800, depot: 'Ikeja' },
            { id: 'DRV-12', name: 'Bola A.', vehicle: 'Van', capacity_kg: 800, depot: 'Lekki' },
            { id: 'DRV-03', name: 'Sani M.', vehicle: 'Truck', capacity_kg: 1200, depot: 'Yaba' },
            { id: 'DRV-21', name: 'Grace O.', vehicle: 'Bike', capacity_kg: 60, depot: 'Ajah' },
            { id: 'DRV-09', name: 'Peter K.', vehicle: 'Van', capacity_kg: 800, depot: 'Apapa' },
        ],
        targets: [
            { id: 'ZN-IKEJA', name: 'Ikeja cluster', stops: 14, demand_kg: 620, window: '08:00–16:00' },
            { id: 'ZN-LEKKI', name: 'Lekki corridor', stops: 11, demand_kg: 540, window: '09:00–17:00' },
            { id: 'ZN-YABA', name: 'Yaba / Surulere', stops: 18, demand_kg: 760, window: '08:00–15:00' },
            { id: 'ZN-AJAH', name: 'Ajah belt', stops: 9, demand_kg: 210, window: '10:00–18:00' },
            { id: 'ZN-APAPA', name: 'Apapa port zone', stops: 12, demand_kg: 690, window: '07:00–14:00' },
        ],
    },
    {
        id: 'education', domain: 'Education', task: 'Matching', solver: 'Genetic algorithm',
        title: 'Teacher Placement — Greater Accra', blurb: '120 teachers → 40 schools by subject, level & proximity',
        resourceLabel: 'teachers', targetLabel: 'schools', resourceCount: 120, targetCount: 40,
        userPrompt: 'Place newly posted teachers into schools. Match subject and grade level, balance class sizes, and minimise how far each teacher relocates.',
        goals: [
            { id: 'g1', description: 'Match subject + grade level to vacancy.', award_type: 'Reward', weight: 50, logic_type: 'categorical_match', resource_columns: ['subject', 'level'], target_columns: ['vacancy_subject', 'vacancy_level'] },
            { id: 'g2', description: 'Minimise relocation distance.', award_type: 'Reward', weight: 30, logic_type: 'distance_min', resource_columns: ['home_district'], target_columns: ['district'] },
            { id: 'g3', description: 'Balance pupil-teacher ratio.', award_type: 'Penalty', weight: 20, logic_type: 'numeric_threshold', resource_columns: [], target_columns: ['pupils'] },
        ],
        assignments: [
            { assignment_id: '1', resource: { id: 'TCH-204' }, target: { id: 'SCH-AC-11' }, score: 0.958, approval_status: 'approved', notes: 'Ama D. (Maths, JHS) → Accra Academy JHS: exact subject/level match, same district (0 relocation).' },
            { assignment_id: '2', resource: { id: 'TCH-118' }, target: { id: 'SCH-TM-04' }, score: 0.933, approval_status: 'approved', notes: 'Kojo M. (Science, SHS) → Tema Secondary: subject match, 12 km relocation.' },
            { assignment_id: '3', resource: { id: 'TCH-076' }, target: { id: 'SCH-AC-02' }, score: 0.905, approval_status: 'pending', notes: 'Efua B. (English, JHS) → Osu JHS: good fit; school slightly over ratio target.' },
            { assignment_id: '4', resource: { id: 'TCH-159' }, target: { id: 'SCH-GA-07' }, score: 0.871, approval_status: 'modified', notes: null },
            { assignment_id: '5', resource: { id: 'TCH-033' }, target: { id: 'SCH-AC-19' }, score: 0.842, approval_status: 'approved', notes: null },
            { assignment_id: '6', resource: { id: 'TCH-201' }, target: { id: 'SCH-TM-12' }, score: 0.808, approval_status: 'pending', notes: null },
        ],
        resources: [
            { id: 'TCH-204', name: 'Ama D.', subject: 'Mathematics', level: 'JHS', home: 'Accra Central' },
            { id: 'TCH-118', name: 'Kojo M.', subject: 'Science', level: 'SHS', home: 'Tema' },
            { id: 'TCH-076', name: 'Efua B.', subject: 'English', level: 'JHS', home: 'Osu' },
            { id: 'TCH-159', name: 'Yaw O.', subject: 'Social Studies', level: 'JHS', home: 'Madina' },
            { id: 'TCH-033', name: 'Akua S.', subject: 'ICT', level: 'SHS', home: 'Dansoman' },
        ],
        targets: [
            { id: 'SCH-AC-11', name: 'Accra Academy JHS', vacancy: 'Maths · JHS', district: 'Accra Central', pupils: 420 },
            { id: 'SCH-TM-04', name: 'Tema Secondary', vacancy: 'Science · SHS', district: 'Tema', pupils: 680 },
            { id: 'SCH-AC-02', name: 'Osu JHS', vacancy: 'English · JHS', district: 'Osu', pupils: 310 },
            { id: 'SCH-GA-07', name: 'Madina Cluster JHS', vacancy: 'Social · JHS', district: 'Madina', pupils: 390 },
            { id: 'SCH-AC-19', name: 'Dansoman SHS', vacancy: 'ICT · SHS', district: 'Dansoman', pupils: 540 },
        ],
    },
    {
        id: 'workforce', domain: 'Workforce', task: 'Scheduling', solver: 'Schedule solver',
        title: 'Hospital Nurse Roster — Week 32', blurb: '90 nurses → 7-day shift grid honouring skills & rest rules',
        resourceLabel: 'nurses', targetLabel: 'shifts', resourceCount: 90, targetCount: 42,
        userPrompt: 'Build next week’s nurse roster. Cover every shift with the right skill mix, cap each nurse at 5 shifts, and respect rest periods between nights and mornings.',
        goals: [
            { id: 'g1', description: 'Cover each shift’s required skill mix.', award_type: 'Reward', weight: 45, logic_type: 'categorical_match', resource_columns: ['skills'], target_columns: ['required_skills'] },
            { id: 'g2', description: 'Cap nurses at 5 shifts per week.', award_type: 'Penalty', weight: 30, logic_type: 'numeric_threshold', resource_columns: [], target_columns: [] },
            { id: 'g3', description: 'Enforce rest between night & morning.', award_type: 'Penalty', weight: 25, logic_type: 'time_window', resource_columns: ['last_shift'], target_columns: ['slot'] },
        ],
        assignments: [
            { assignment_id: '1', resource: { id: 'N-031' }, target: { id: 'MON-AM-ICU' }, score: 0.967, approval_status: 'approved', notes: 'Ngozi (ICU) → Mon AM ICU: skill exact, 1st of 4 shifts this week, 16h rest before.' },
            { assignment_id: '2', resource: { id: 'N-112' }, target: { id: 'MON-PM-ER' }, score: 0.944, approval_status: 'approved', notes: 'Ibrahim (ER) → Mon PM ER: covers trauma requirement.' },
            { assignment_id: '3', resource: { id: 'N-058' }, target: { id: 'TUE-NT-WARD' }, score: 0.918, approval_status: 'pending', notes: 'Funmi (General) → Tue night ward: ok, but 5th shift — at weekly cap.' },
            { assignment_id: '4', resource: { id: 'N-090' }, target: { id: 'WED-AM-MAT' }, score: 0.882, approval_status: 'modified', notes: null },
            { assignment_id: '5', resource: { id: 'N-014' }, target: { id: 'WED-PM-ICU' }, score: 0.86, approval_status: 'approved', notes: null },
            { assignment_id: '6', resource: { id: 'N-077' }, target: { id: 'THU-NT-ER' }, score: 0.825, approval_status: 'pending', notes: null },
        ],
        resources: [
            { id: 'N-031', name: 'Ngozi A.', skills: 'ICU, Triage', max_shifts: 5, contract: 'Full-time' },
            { id: 'N-112', name: 'Ibrahim S.', skills: 'ER, Trauma', max_shifts: 5, contract: 'Full-time' },
            { id: 'N-058', name: 'Funmi O.', skills: 'General', max_shifts: 4, contract: 'Part-time' },
            { id: 'N-090', name: 'Chidi E.', skills: 'Maternity', max_shifts: 5, contract: 'Full-time' },
            { id: 'N-014', name: 'Hauwa B.', skills: 'ICU, Cardio', max_shifts: 5, contract: 'Full-time' },
        ],
        targets: [
            { id: 'MON-AM-ICU', name: 'Mon · AM · ICU', required_skills: 'ICU', headcount: 3, slot: 'Morning' },
            { id: 'MON-PM-ER', name: 'Mon · PM · ER', required_skills: 'ER, Trauma', headcount: 4, slot: 'Afternoon' },
            { id: 'TUE-NT-WARD', name: 'Tue · Night · Ward', required_skills: 'General', headcount: 5, slot: 'Night' },
            { id: 'WED-AM-MAT', name: 'Wed · AM · Maternity', required_skills: 'Maternity', headcount: 2, slot: 'Morning' },
            { id: 'WED-PM-ICU', name: 'Wed · PM · ICU', required_skills: 'ICU, Cardio', headcount: 3, slot: 'Afternoon' },
        ],
    },
    {
        id: 'government', domain: 'Government / NGO', task: 'Assignment', solver: 'Greedy + GA refine',
        title: 'Field Enumerator Deployment', blurb: '300 enumerators → 75 communities by language & terrain access',
        resourceLabel: 'enumerators', targetLabel: 'communities', resourceCount: 300, targetCount: 75,
        userPrompt: 'Deploy census enumerators to communities. Match local language, account for terrain and travel access, and balance workload evenly across the team.',
        goals: [
            { id: 'g1', description: 'Match local language to community.', award_type: 'Reward', weight: 45, logic_type: 'categorical_match', resource_columns: ['languages'], target_columns: ['main_language'] },
            { id: 'g2', description: 'Prefer enumerators near reachable terrain.', award_type: 'Reward', weight: 30, logic_type: 'distance_min', resource_columns: ['base'], target_columns: ['access'] },
            { id: 'g3', description: 'Balance households per enumerator.', award_type: 'Penalty', weight: 25, logic_type: 'numeric_threshold', resource_columns: [], target_columns: ['households'] },
        ],
        assignments: [
            { assignment_id: '1', resource: { id: 'EN-1042' }, target: { id: 'CM-BORNO-7' }, score: 0.954, approval_status: 'approved', notes: 'Musa (Kanuri, Hausa) → Borno cluster 7: language match + nearest reachable base.' },
            { assignment_id: '2', resource: { id: 'EN-2210' }, target: { id: 'CM-KANO-3' }, score: 0.929, approval_status: 'approved', notes: 'Aisha (Hausa) → Kano ward 3: dense urban, language exact.' },
            { assignment_id: '3', resource: { id: 'EN-0871' }, target: { id: 'CM-RIVERS-9' }, score: 0.901, approval_status: 'pending', notes: 'Tamuno (Ijaw, English) → riverine community: terrain penalty (boat access only).' },
            { assignment_id: '4', resource: { id: 'EN-1530' }, target: { id: 'CM-OYO-2' }, score: 0.874, approval_status: 'modified', notes: null },
            { assignment_id: '5', resource: { id: 'EN-0345' }, target: { id: 'CM-BENUE-5' }, score: 0.848, approval_status: 'approved', notes: null },
            { assignment_id: '6', resource: { id: 'EN-1988' }, target: { id: 'CM-KADUNA-1' }, score: 0.812, approval_status: 'pending', notes: null },
        ],
        resources: [
            { id: 'EN-1042', name: 'Musa B.', languages: 'Kanuri, Hausa', base: 'Maiduguri', vehicle: 'Motorbike' },
            { id: 'EN-2210', name: 'Aisha L.', languages: 'Hausa', base: 'Kano', vehicle: 'On foot' },
            { id: 'EN-0871', name: 'Tamuno P.', languages: 'Ijaw, English', base: 'Port Harcourt', vehicle: 'Boat' },
            { id: 'EN-1530', name: 'Bisi A.', languages: 'Yoruba', base: 'Ibadan', vehicle: 'Car' },
            { id: 'EN-0345', name: 'Terna I.', languages: 'Tiv, English', base: 'Makurdi', vehicle: 'Motorbike' },
        ],
        targets: [
            { id: 'CM-BORNO-7', name: 'Borno cluster 7', main_language: 'Kanuri', access: 'Road (escort)', households: 540 },
            { id: 'CM-KANO-3', name: 'Kano ward 3', main_language: 'Hausa', access: 'Urban', households: 880 },
            { id: 'CM-RIVERS-9', name: 'Rivers riverine 9', main_language: 'Ijaw', access: 'Boat only', households: 220 },
            { id: 'CM-OYO-2', name: 'Oyo rural 2', main_language: 'Yoruba', access: 'Road', households: 410 },
            { id: 'CM-BENUE-5', name: 'Benue cluster 5', main_language: 'Tiv', access: 'Road', households: 360 },
        ],
    },
    {
        id: 'events', domain: 'Hospitality / Events', task: 'Allocation', solver: 'Genetic algorithm',
        title: 'Event Staff Allocation — Conference', blurb: '80 staff → 24 stations by role, certification & peak demand',
        resourceLabel: 'staff', targetLabel: 'stations', resourceCount: 80, targetCount: 24,
        userPrompt: 'Allocate event staff to stations for a 2-day conference. Match roles and certifications, cover peak-hour demand, and keep teams balanced across halls.',
        goals: [
            { id: 'g1', description: 'Match role + certification to station.', award_type: 'Reward', weight: 45, logic_type: 'categorical_match', resource_columns: ['role', 'certs'], target_columns: ['needed_role'] },
            { id: 'g2', description: 'Cover peak-hour demand.', award_type: 'Reward', weight: 35, logic_type: 'weighted_scoring', resource_columns: [], target_columns: ['peak_demand'] },
            { id: 'g3', description: 'Balance headcount across halls.', award_type: 'Penalty', weight: 20, logic_type: 'numeric_threshold', resource_columns: [], target_columns: ['hall'] },
        ],
        assignments: [
            { assignment_id: '1', resource: { id: 'ST-21' }, target: { id: 'STN-REG-A' }, score: 0.961, approval_status: 'approved', notes: 'Lara (Lead, First-aid) → Registration A: role + cert match, covers 9am peak.' },
            { assignment_id: '2', resource: { id: 'ST-08' }, target: { id: 'STN-AV-1' }, score: 0.939, approval_status: 'approved', notes: 'Daniel (AV tech) → Main hall AV: certified, sole AV specialist for keynote.' },
            { assignment_id: '3', resource: { id: 'ST-44' }, target: { id: 'STN-CAT-2' }, score: 0.907, approval_status: 'pending', notes: 'Zainab (Catering) → Lunch station 2: fine; hall slightly over headcount target.' },
            { assignment_id: '4', resource: { id: 'ST-17' }, target: { id: 'STN-SEC-B' }, score: 0.878, approval_status: 'modified', notes: null },
            { assignment_id: '5', resource: { id: 'ST-30' }, target: { id: 'STN-INFO' }, score: 0.851, approval_status: 'approved', notes: null },
            { assignment_id: '6', resource: { id: 'ST-12' }, target: { id: 'STN-REG-B' }, score: 0.819, approval_status: 'pending', notes: null },
        ],
        resources: [
            { id: 'ST-21', name: 'Lara N.', role: 'Team lead', certs: 'First-aid', avail: 'Both days' },
            { id: 'ST-08', name: 'Daniel K.', role: 'AV tech', certs: 'AV', avail: 'Day 1' },
            { id: 'ST-44', name: 'Zainab M.', role: 'Catering', certs: 'Food safety', avail: 'Both days' },
            { id: 'ST-17', name: 'Femi O.', role: 'Security', certs: 'Crowd ctrl', avail: 'Both days' },
            { id: 'ST-30', name: 'Ruth A.', role: 'Usher', certs: '—', avail: 'Day 2' },
        ],
        targets: [
            { id: 'STN-REG-A', name: 'Registration A', needed_role: 'Lead', peak_demand: 'High (9am)', hall: 'Foyer' },
            { id: 'STN-AV-1', name: 'Main hall AV', needed_role: 'AV tech', peak_demand: 'Keynote', hall: 'Hall 1' },
            { id: 'STN-CAT-2', name: 'Lunch station 2', needed_role: 'Catering', peak_demand: 'High (1pm)', hall: 'Hall 2' },
            { id: 'STN-SEC-B', name: 'Entrance B', needed_role: 'Security', peak_demand: 'Medium', hall: 'Foyer' },
            { id: 'STN-INFO', name: 'Info desk', needed_role: 'Usher', peak_demand: 'Low', hall: 'Foyer' },
        ],
    },
];

const FITNESS_HISTORY = Array.from({ length: 60 }, (_, i) =>
    parseFloat(Math.min(0.987, 0.55 + 0.41 * (1 - Math.exp(-i / 14))).toFixed(3))
);
const AVG_HISTORY = Array.from({ length: 60 }, (_, i) =>
    parseFloat(Math.min(0.92, 0.4 + 0.42 * (1 - Math.exp(-i / 22))).toFixed(3))
);

// ── Shared components ──────────────────────────────────────────────────────────

// Mock share control — showcases session sharing without a backend.
const ShareButton: React.FC<{ slug: string }> = ({ slug }) => {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        navigator.clipboard?.writeText(`${origin}/share/demo-${slug}`).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        });
    };
    return (
        <button onClick={copy} title="Share this session (demo)"
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'transparent', border: `1px solid ${T.neutral200}`, borderRadius: 8, fontSize: 13, color: T.neutral600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {copied ? <Check size={13} /> : <Share2 size={13} />} {copied ? 'Link copied' : 'Share'}
        </button>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const s: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700',
        rejected: 'bg-red-100 text-red-700',
        modified: 'bg-blue-100 text-blue-700',
    };
    return <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold capitalize', s[status] ?? 'bg-gray-100 text-gray-600')}>{status}</span>;
};

const FitnessChart = () => {
    const w = 560; const h = 140; const pad = 24;
    const maxV = Math.max(...FITNESS_HISTORY, ...AVG_HISTORY);
    const minV = Math.min(...FITNESS_HISTORY, ...AVG_HISTORY);
    const range = maxV - minV || 1;
    const gx = (i: number) => pad + (i / (FITNESS_HISTORY.length - 1)) * (w - 2 * pad);
    const gy = (v: number) => h - pad - ((v - minV) / range) * (h - 2 * pad);
    const fitPath = FITNESS_HISTORY.map((v, i) => `${i === 0 ? 'M' : 'L'}${gx(i).toFixed(1)} ${gy(v).toFixed(1)}`).join(' ');
    const avgPath = AVG_HISTORY.map((v, i) => `${i === 0 ? 'M' : 'L'}${gx(i).toFixed(1)} ${gy(v).toFixed(1)}`).join(' ');
    const last = [gx(FITNESS_HISTORY.length - 1), gy(FITNESS_HISTORY[FITNESS_HISTORY.length - 1])];
    return (
        <div style={{ background: T.ink, borderRadius: 10, padding: '16px 18px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: T.bone, fontSize: 13, fontWeight: 600 }}>Fitness convergence</span>
                <div style={{ display: 'flex', gap: 14, fontSize: 11 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#999' }}><span style={{ display: 'inline-block', width: 14, height: 2, background: '#D49AAA' }} /> Best</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#999' }}><span style={{ display: 'inline-block', width: 14, height: 2, background: '#6B7280', opacity: 0.5 }} /> Average</span>
                </div>
            </div>
            <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 130 }}>
                <defs>
                    <linearGradient id="fg" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#D49AAA" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#D49AAA" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map(t => (
                    <line key={t} x1={pad} x2={w - pad} y1={h - pad - t * (h - 2 * pad)} y2={h - pad - t * (h - 2 * pad)} stroke="rgba(255,255,255,0.06)" />
                ))}
                <path d={`${fitPath} L${last[0].toFixed(1)} ${(h - pad).toFixed(1)} L${pad} ${(h - pad).toFixed(1)} Z`} fill="url(#fg)" />
                <path d={avgPath} fill="none" stroke="rgba(107,114,128,0.4)" strokeWidth="1.5" />
                <path d={fitPath} fill="none" stroke="#D49AAA" strokeWidth="2" />
                <circle cx={last[0]} cy={last[1]} r="3.5" fill={T.ink} stroke="#D49AAA" strokeWidth="1.5" />
            </svg>
        </div>
    );
};

// ── Canvas tabs ────────────────────────────────────────────────────────────────

const TIMELINE = [
    { stage: 'ingest',    label: 'Data validated',            sub: 'Resources & targets checked' },
    { stage: 'translate', label: 'Goals compiled',            sub: '3 goals → executable fitness function' },
    { stage: 'init',      label: 'Solver selected',           sub: 'Router picked best-fit solver for this problem' },
    { stage: 'solve',     label: 'Solver running',            sub: 'Evaluating candidate assignments' },
    { stage: 'converge',  label: 'Convergence detected',      sub: 'Fitness plateau reached' },
    { stage: 'explain',   label: 'Rationale generated',       sub: 'Per-assignment notes ready' },
];

const MonitorTab = ({ runStage }: { runStage: string }) => {
    const stageIdx = ['idle','ingest','translate','init','solve','converge','explain','done'].indexOf(runStage);
    const stats = [
        { lbl: 'Generation', val: runStage === 'done' ? '42' : '0' },
        { lbl: 'Best fitness', val: runStage === 'done' ? '0.987' : '—' },
        { lbl: 'Elapsed', val: runStage === 'done' ? '6.2s' : '—' },
    ];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {stats.map(s => (
                    <div key={s.lbl} style={{ background: T.neutral50, border: `1px solid ${T.neutral200}`, borderRadius: 8, padding: '12px 14px' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.neutral500, marginBottom: 6 }}>{s.lbl}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 1, fontWeight: 400, color: s.val === '0' || s.val === '—' ? T.neutral400 : T.ink, letterSpacing: '-0.02em' }}>{s.val}</div>
                    </div>
                ))}
            </div>
            <FitnessChart />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TIMELINE.map((t, i) => {
                    const done = i < stageIdx;
                    const active = i === stageIdx;
                    return (
                        <div key={t.stage} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13 }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.neutral400, flexShrink: 0, paddingTop: 1, width: 16, textAlign: 'center' }}>
                                {done ? '✓' : active ? '…' : '·'}
                            </div>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${T.maroon}`, background: done ? T.maroon : active ? '#F59E0B' : T.boneDeep, borderColor: active ? '#F59E0B' : T.maroon, marginTop: 3, flexShrink: 0 }} />
                            <div style={{ flex: 1, color: T.ink }}>
                                {t.label}
                                <span style={{ display: 'block', color: T.neutral500, fontSize: 11.5, marginTop: 1 }}>{t.sub}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ResultsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
                { lbl: 'Resources assigned', val: '50', sub: 'of 50', hi: true },
                { lbl: 'Target pool', val: '20' },
                { lbl: 'Best fitness', val: '0.987' },
                { lbl: 'Generations', val: '42' },
            ].map(m => (
                <div key={m.lbl} style={{ background: '#fff', border: `1px solid ${m.hi ? 'rgba(92,20,39,0.22)' : T.neutral200}`, borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.neutral500, marginBottom: 4 }}>{m.lbl}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, color: m.hi ? T.maroon : T.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{m.val}</span>
                        {m.sub && <span style={{ fontSize: 12, color: T.neutral500 }}>{m.sub}</span>}
                    </div>
                </div>
            ))}
        </div>
        <FitnessChart />
        <div style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10, padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: T.ink }}>Approval status</h3>
            {[
                { lbl: 'Approved', n: 41, c: '#10B981' }, { lbl: 'Pending', n: 6, c: '#F59E0B' },
                { lbl: 'Rejected', n: 1, c: '#EF4444' }, { lbl: 'Modified', n: 2, c: '#3B82F6' },
            ].map(item => (
                <div key={item.lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.neutral600 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.c, display: 'inline-block' }} />
                        {item.lbl}
                    </span>
                    <span style={{ fontWeight: 600, color: T.ink }}>{item.n}</span>
                </div>
            ))}
            <div style={{ height: 6, borderRadius: 999, overflow: 'hidden', display: 'flex', marginTop: 10, background: T.neutral100 }}>
                {[82, 12, 2, 4].map((pct, i) => (
                    <div key={i} style={{ height: '100%', width: `${pct}%`, background: ['#10B981','#F59E0B','#EF4444','#3B82F6'][i] }} />
                ))}
            </div>
        </div>
    </div>
);

const AssignmentsTab = ({ assignments }: { assignments: MockAssignment[] }) => {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [statuses, setStatuses] = useState<Record<string, string>>(
        Object.fromEntries(assignments.map(a => [a.assignment_id, a.approval_status]))
    );
    return (
        <div style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                    <tr style={{ background: T.neutral50, borderBottom: `1px solid ${T.neutral200}` }}>
                        <th style={{ width: 28, padding: '8px 10px' }}></th>
                        {['Resource', 'Target', 'Score', 'Status', 'Actions'].map(h => (
                            <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.neutral500, fontWeight: 500 }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {assignments.map(a => {
                        const isExp = expanded === a.assignment_id;
                        const status = statuses[a.assignment_id];
                        return (
                            <React.Fragment key={a.assignment_id}>
                                <tr style={{ borderTop: `1px solid ${T.neutral200}`, background: isExp ? T.neutral50 : undefined, transition: 'background 140ms' }}>
                                    <td style={{ padding: '8px 10px' }}>
                                        <button onClick={() => setExpanded(isExp ? null : a.assignment_id)}
                                            style={{ width: 22, height: 22, border: 0, background: 'transparent', color: T.neutral400, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'pointer' }}>
                                            <ChevronDown size={13} style={{ transform: isExp ? 'rotate(180deg)' : undefined, transition: 'transform 140ms' }} />
                                        </button>
                                    </td>
                                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: T.neutral700 }}>{a.resource.id}</td>
                                    <td style={{ padding: '8px 12px', color: T.neutral600 }}>{a.target.id}</td>
                                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#047857' }}>{a.score.toFixed(3)}</td>
                                    <td style={{ padding: '8px 12px' }}><StatusBadge status={status} /></td>
                                    <td style={{ padding: '8px 12px' }}>
                                        <div style={{ display: 'flex', gap: 3 }}>
                                            {(['approved','modified','rejected'] as const).map((s, si) => (
                                                <button key={s} onClick={() => setStatuses(prev => ({ ...prev, [a.assignment_id]: s }))}
                                                    style={{ width: 26, height: 26, borderRadius: 6, border: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: status === s ? [T.maroon, '#1D4ED8', '#B91C1C'][si] : T.neutral400 }}
                                                    title={s}>
                                                    {si === 0 ? <Check size={13} /> : si === 1 ? <Edit3 size={13} /> : <X size={13} />}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                                {isExp && (
                                    <tr>
                                        <td colSpan={6} style={{ background: T.neutral50, borderBottom: `1px solid ${T.neutral200}`, padding: '10px 14px 14px 14px' }}>
                                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.neutral500, margin: '0 0 6px' }}>Why this pairing</p>
                                            <p style={{ fontSize: 12.5, lineHeight: 1.55, color: T.neutral700, margin: '0 0 10px' }}>
                                                {a.notes ?? `Resource ${a.resource.id} assigned to Target ${a.target.id}. Score reflects weighted objective function across all defined goals.`}
                                            </p>
                                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.neutral500, margin: '0 0 6px' }}>Match score</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ flex: 1, height: 5, background: T.neutral200, borderRadius: 999, overflow: 'hidden', maxWidth: 200 }}>
                                                    <div style={{ height: '100%', width: `${Math.round(a.score * 100)}%`, background: '#10B981', borderRadius: 999 }} />
                                                </div>
                                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: '#047857' }}>{a.score.toFixed(3)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// ── Goals tab — full CRUD ─────────────────────────────────────────────────────

const LOGIC_TYPES = ['weighted_scoring', 'categorical_match', 'spatial_proximity', 'numeric_threshold', 'set_coverage', 'temporal_match'];
const LOGIC_LABELS: Record<string, string> = {
    weighted_scoring: 'Weighted Scoring', categorical_match: 'Attribute Matching',
    spatial_proximity: 'Distance / Proximity', numeric_threshold: 'Numeric Threshold',
    set_coverage: 'Skill Coverage', temporal_match: 'Schedule Matching',
};

interface GoalsTabProps {
    goals: MockGoal[];
    onAdd: (g: MockGoal) => void;
    onUpdate: (id: string, patch: Partial<MockGoal>) => void;
    onDelete: (id: string) => void;
}

const GoalsTab: React.FC<GoalsTabProps> = ({ goals, onAdd, onUpdate, onDelete }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [addingNew, setAddingNew] = useState(false);
    const [draft, setDraft] = useState<Partial<MockGoal>>({});
    const total = goals.reduce((s, g) => s + g.weight, 0);

    const startEdit = (g: MockGoal) => { setEditingId(g.id); setDraft({ ...g }); setAddingNew(false); };
    const startAdd = () => { setAddingNew(true); setEditingId(null); setDraft({ description: '', award_type: 'Reward', weight: 25, logic_type: 'categorical_match' }); };
    const cancelEdit = () => { setEditingId(null); setAddingNew(false); setDraft({}); };

    const saveEdit = () => {
        if (!draft.description?.trim()) return;
        if (addingNew) {
            onAdd({ id: `g${Date.now()}`, description: draft.description!, award_type: draft.award_type ?? 'Reward', weight: draft.weight ?? 25, logic_type: draft.logic_type ?? 'categorical_match', resource_columns: [], target_columns: [] });
        } else if (editingId) {
            onUpdate(editingId, draft);
        }
        cancelEdit();
    };

    const inputStyle: React.CSSProperties = { width: '100%', padding: '7px 10px', border: `1px solid ${T.neutral200}`, borderRadius: 6, fontSize: 12, outline: 'none', background: '#fff', color: T.ink, fontFamily: 'inherit' };
    const labelStyle: React.CSSProperties = { display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.neutral500, marginBottom: 4 };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: T.neutral50, border: `1px solid ${T.neutral200}`, borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: T.neutral600 }}>
                    {goals.length} goal{goals.length !== 1 ? 's' : ''} · weights total{' '}
                    <b style={{ fontFamily: 'var(--font-mono)', color: total === 100 ? '#047857' : '#B45309' }}>{total}%</b>
                </span>
                <button onClick={startAdd}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: T.maroon, color: T.bone, border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={12} /> Add goal
                </button>
            </div>

            {/* Add new form */}
            {addingNew && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: '#fff', border: `2px solid ${T.maroon}`, borderRadius: 10, padding: 14 }}>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.maroon, margin: '0 0 12px', fontWeight: 600 }}>New goal</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div><label style={labelStyle}>Description</label>
                            <textarea value={draft.description ?? ''} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'none' }} placeholder="e.g. Maximize skill match score" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div><label style={labelStyle}>Type</label>
                                <select value={draft.award_type ?? 'Reward'} onChange={e => setDraft(p => ({ ...p, award_type: e.target.value as any }))} style={inputStyle}>
                                    <option>Reward</option><option>Penalty</option>
                                </select>
                            </div>
                            <div><label style={labelStyle}>Logic</label>
                                <select value={draft.logic_type ?? 'categorical_match'} onChange={e => setDraft(p => ({ ...p, logic_type: e.target.value }))} style={inputStyle}>
                                    {LOGIC_TYPES.map(t => <option key={t} value={t}>{LOGIC_LABELS[t]}</option>)}
                                </select>
                            </div>
                        </div>
                        <div><label style={labelStyle}>Weight — <b style={{ color: T.maroon }}>{draft.weight ?? 25}%</b></label>
                            <input type="range" min={0} max={100} step={5} value={draft.weight ?? 25} onChange={e => setDraft(p => ({ ...p, weight: Number(e.target.value) }))} style={{ width: '100%', accentColor: T.maroon }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button onClick={cancelEdit} style={{ padding: '6px 12px', border: 0, background: 'transparent', color: T.neutral500, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: T.maroon, color: T.bone, border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                <Save size={12} /> Save
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Goal list */}
            {goals.map(g => {
                const isEditing = editingId === g.id;
                return (
                    <div key={g.id} style={{ background: '#fff', border: `1px solid ${isEditing ? T.maroon : T.neutral200}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 140ms' }}>
                        {/* Row header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
                            <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', background: g.award_type === 'Reward' ? '#D1FAE5' : '#FEE2E2', color: g.award_type === 'Reward' ? '#047857' : '#B91C1C' }}>
                                {g.award_type}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, lineHeight: 1.4 }}>{g.description}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.neutral500, marginTop: 2 }}>{LOGIC_LABELS[g.logic_type] ?? g.logic_type}</div>
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: T.neutral700, flexShrink: 0 }}>{g.weight}%</span>
                            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                                <button onClick={() => isEditing ? cancelEdit() : startEdit(g)}
                                    style={{ width: 28, height: 28, border: 0, background: 'transparent', color: T.neutral400, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer' }}
                                    title={isEditing ? 'Cancel' : 'Edit'}>
                                    {isEditing ? <X size={14} /> : <Edit3 size={14} />}
                                </button>
                                <button onClick={() => onDelete(g.id)}
                                    style={{ width: 28, height: 28, border: 0, background: 'transparent', color: T.neutral400, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer' }}
                                    title="Delete">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Weight bar */}
                        {!isEditing && (
                            <div style={{ height: 3, background: T.neutral100, marginBottom: 0 }}>
                                <div style={{ height: '100%', width: `${g.weight}%`, background: `linear-gradient(90deg, ${T.maroon}, ${T.maroonRich})` }} />
                            </div>
                        )}

                        {/* Inline edit form */}
                        {isEditing && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ borderTop: `1px solid ${T.neutral100}`, padding: '12px 14px', background: T.neutral50 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div><label style={labelStyle}>Description</label>
                                        <textarea value={draft.description ?? ''} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'none' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <div><label style={labelStyle}>Type</label>
                                            <select value={draft.award_type ?? g.award_type} onChange={e => setDraft(p => ({ ...p, award_type: e.target.value as any }))} style={inputStyle}>
                                                <option>Reward</option><option>Penalty</option>
                                            </select>
                                        </div>
                                        <div><label style={labelStyle}>Logic</label>
                                            <select value={draft.logic_type ?? g.logic_type} onChange={e => setDraft(p => ({ ...p, logic_type: e.target.value }))} style={inputStyle}>
                                                {LOGIC_TYPES.map(t => <option key={t} value={t}>{LOGIC_LABELS[t]}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div><label style={labelStyle}>Weight — <b style={{ color: T.maroon }}>{draft.weight ?? g.weight}%</b></label>
                                        <input type="range" min={0} max={100} step={5} value={draft.weight ?? g.weight} onChange={e => setDraft(p => ({ ...p, weight: Number(e.target.value) }))} style={{ width: '100%', accentColor: T.maroon }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                        <button onClick={cancelEdit} style={{ padding: '6px 12px', border: 0, background: 'transparent', color: T.neutral500, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                                        <button onClick={saveEdit} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: T.maroon, color: T.bone, border: 0, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                            <Save size={12} /> Save changes
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                );
            })}

            {goals.length === 0 && (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: T.neutral400 }}>
                    <Target size={28} style={{ margin: '0 auto 10px', display: 'block' }} />
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: T.maroonDeep }}>No goals yet.</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>Click "Add goal" to define your first objective.</p>
                </div>
            )}
        </div>
    );
};

const ConfigTab = () => {
    const [solver, setSolver] = useState('ga');
    const [pop, setPop] = useState(256);
    const [maxGens, setMaxGens] = useState(2000);
    const solvers = [
        { id: 'ga', name: 'Genetic algorithm', desc: 'Best for large assignment problems.' },
        { id: 'ga_vec', name: 'Vectorized GA', desc: 'Faster GA for bigger instances.' },
        { id: 'greedy', name: 'Greedy solver', desc: 'Fast, good for initial estimates.' },
        { id: 'ortools', name: 'OR-Tools routing', desc: 'When constraints dominate search.' },
        { id: 'schedule', name: 'Schedule solver', desc: 'Shift/time-window problems.' },
    ];
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.neutral500, marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Solver</span><span style={{ color: T.maroon }}>Auto-selected by Intellign</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {solvers.map(s => (
                        <button key={s.id} onClick={() => setSolver(s.id)}
                            style={{ textAlign: 'left', cursor: 'pointer', padding: '10px 12px', borderRadius: 6, background: solver === s.id ? 'rgba(92,20,39,0.05)' : '#fff', border: `1px solid ${solver === s.id ? T.maroon : T.neutral200}`, fontFamily: 'inherit' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: solver === s.id ? T.maroonDeep : T.ink }}>{s.name}</div>
                            <div style={{ fontSize: 11.5, color: T.neutral500, marginTop: 2, lineHeight: 1.4 }}>{s.desc}</div>
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ borderTop: `1px dashed ${T.neutral200}`, paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                    { lbl: 'Population size', val: pop, min: 64, max: 1024, step: 32, set: setPop },
                    { lbl: 'Max generations', val: maxGens, min: 500, max: 5000, step: 100, set: setMaxGens },
                ].map(r => (
                    <div key={r.lbl}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: T.neutral600, marginBottom: 4 }}>
                            <span>{r.lbl}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: T.maroonDeep, fontWeight: 600 }}>{r.val.toLocaleString()}</span>
                        </div>
                        <input type="range" min={r.min} max={r.max} step={r.step} value={r.val}
                            onChange={e => r.set(Number(e.target.value))}
                            style={{ width: '100%', accentColor: T.maroon }} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const DatasetsTab = ({ scenario }: { scenario: Scenario }) => {
    const [active, setActive] = useState<'resources' | 'targets'>('resources');
    const rows = active === 'resources' ? scenario.resources : scenario.targets;
    const cols = Object.keys(rows[0] ?? {}).map(k => k.replace(/_/g, ' '));
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'inline-flex', padding: 3, background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 999, gap: 2 }}>
                    {(['resources', 'targets'] as const).map(t => (
                        <button key={t} onClick={() => setActive(t)}
                            style={{ padding: '4px 12px', borderRadius: 999, border: 0, fontSize: 11, fontWeight: 500, cursor: 'pointer', background: active === t ? T.maroon : 'transparent', color: active === t ? T.bone : T.neutral600 }}>
                            {t === 'resources'
                                ? `${scenario.resourceLabel} · ${scenario.resourceCount}`
                                : `${scenario.targetLabel} · ${scenario.targetCount}`}
                        </button>
                    ))}
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'transparent', border: `1px solid ${T.neutral200}`, borderRadius: 6, fontSize: 12, color: T.neutral600, cursor: 'pointer' }}>
                    <Download size={12} /> Export .csv
                </button>
            </div>
            <div style={{ background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                        <tr style={{ background: T.neutral50, borderBottom: `1px solid ${T.neutral200}` }}>
                            {cols.map(c => (
                                <th key={c} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.neutral500, fontWeight: 500 }}>{c}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r: any, i) => (
                            <tr key={i} style={{ borderTop: `1px solid ${T.neutral200}` }}>
                                {Object.values(r).map((v: any, j) => (
                                    <td key={j} style={{ padding: '8px 12px', fontFamily: j === 0 ? 'var(--font-mono)' : undefined, fontSize: j === 0 ? 11 : 12, color: j === 0 ? T.ink : T.neutral600 }}>{v}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ padding: '8px 12px', fontSize: 11, color: T.neutral400, fontFamily: 'var(--font-mono)', borderTop: `1px solid ${T.neutral100}` }}>
                    Showing {rows.length} of {active === 'resources' ? scenario.resourceCount : scenario.targetCount} · source: generated sample ({scenario.title})
                </div>
            </div>
        </div>
    );
};

// ── Canvas panel ──────────────────────────────────────────────────────────────

type CanvasTab = 'monitor' | 'results' | 'assignments' | 'goals' | 'config' | 'datasets';

interface CanvasProps {
    runStage: string;
    goals: MockGoal[];
    onGoalAdd: (g: MockGoal) => void;
    onGoalUpdate: (id: string, patch: Partial<MockGoal>) => void;
    onGoalDelete: (id: string) => void;
    tab: CanvasTab;
    onTabChange: (t: CanvasTab) => void;
    onClose: () => void;
    onMinimize: () => void;
    scenario: Scenario;
}

const Canvas: React.FC<CanvasProps> = ({ scenario, runStage, goals, onGoalAdd, onGoalUpdate, onGoalDelete, tab, onTabChange, onClose, onMinimize }) => {
    const isDone = runStage === 'done';
    const tabs: { id: CanvasTab; label: string; badge?: number }[] = [
        { id: 'monitor', label: 'Monitor' },
        { id: 'results', label: 'Results' },
        { id: 'assignments', label: 'Assignments', badge: scenario.assignments.length },
        { id: 'goals', label: 'Goals', badge: goals.length },
        { id: 'config', label: 'Config' },
        { id: 'datasets', label: 'Datasets' },
    ];
    return (
        <aside style={{
            width: "min(720px, 100%)", flexShrink: 1, minWidth: 0, background: '#fff',
            borderLeft: `1px solid ${T.neutral200}`,
            display: 'flex', flexDirection: 'column',
            animation: 'canvas-in 280ms cubic-bezier(0.2,0,0,1)',
        }}>
            {/* Head */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: `1px solid ${T.neutral200}`, background: T.neutral50, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: isDone ? '#10B981' : runStage !== 'idle' ? '#F59E0B' : T.maroon, boxShadow: runStage !== 'idle' && !isDone ? '0 0 0 4px rgba(245,158,11,0.18)' : undefined, display: 'inline-block' }} />
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: T.maroonDeep, letterSpacing: '-0.015em', margin: 0 }}>{scenario.title}</h2>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: T.neutral400 }}>· 0a8f3c</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={onMinimize} style={{ width: 30, height: 30, border: 0, background: 'transparent', color: T.neutral500, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer' }} title="Minimize"><Minimize2 size={15} /></button>
                    <button onClick={onClose} style={{ width: 30, height: 30, border: 0, background: 'transparent', color: T.neutral500, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer' }} title="Close"><X size={15} /></button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', padding: '0 18px', borderBottom: `1px solid ${T.neutral200}`, background: '#fff', flexShrink: 0 }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => onTabChange(t.id)}
                        style={{
                            position: 'relative', padding: '11px 16px', border: 0, background: 'transparent',
                            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                            color: tab === t.id ? T.maroon : T.neutral500,
                            borderBottom: `2px solid ${tab === t.id ? T.maroon : 'transparent'}`,
                            marginBottom: -1,
                        }}>
                        {t.label}
                        {t.badge !== undefined && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(92,20,39,0.1)', color: T.maroonDeep, fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: 999, marginLeft: 5 }}>
                                {t.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
                {tab === 'monitor' && <MonitorTab runStage={runStage} />}
                {tab === 'results' && (isDone ? <ResultsTab /> : (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: T.neutral400 }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: T.maroonDeep }}>Results appear once the solver converges.</p>
                        <p style={{ fontSize: 13, marginTop: 6 }}>Watch the Monitor tab live. We'll switch you over automatically.</p>
                    </div>
                ))}
                {tab === 'assignments' && (isDone ? <AssignmentsTab assignments={scenario.assignments} /> : (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: T.neutral400 }}>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: T.maroonDeep }}>No assignments yet.</p>
                        <p style={{ fontSize: 13, marginTop: 6 }}>Once converged, every resource → target pairing lands here for review.</p>
                    </div>
                ))}
                {tab === 'goals' && <GoalsTab goals={goals} onAdd={onGoalAdd} onUpdate={onGoalUpdate} onDelete={onGoalDelete} />}
                {tab === 'config' && <ConfigTab />}
                {tab === 'datasets' && <DatasetsTab scenario={scenario} />}
            </div>
        </aside>
    );
};

// ── Message bubble ─────────────────────────────────────────────────────────────

const renderMd = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();
        const isTableHeader = trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < lines.length && /^\|[\s|:-]+\|/.test(lines[i + 1].trim());
        if (isTableHeader) {
            const tableLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) { tableLines.push(lines[i]); i++; }
            if (tableLines.length >= 2) {
                const parseRow = (l: string) => l.split('|').slice(1, -1).map(c => c.trim());
                const isSep = (l: string) => /^[\s|:-]+$/.test(l.replace(/\|/g, ''));
                const headers = parseRow(tableLines[0]);
                const bodyRows = tableLines.slice(2).filter(l => !isSep(l)).map(parseRow);
                result.push(
                    <div key={`tbl-${i}`} style={{ overflowX: 'auto', margin: '6px 0', borderRadius: 8, border: `1px solid ${T.neutral200}` }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead><tr style={{ background: T.neutral50, borderBottom: `1px solid ${T.neutral200}` }}>{headers.map((h, hi) => <th key={hi} style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600, color: T.neutral600, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
                            <tbody>{bodyRows.map((row, ri) => <tr key={ri} style={{ borderTop: `1px solid ${T.neutral100}` }}>{row.map((cell, ci) => <td key={ci} style={{ padding: '6px 10px', color: T.neutral700 }}>{cell}</td>)}</tr>)}</tbody>
                        </table>
                    </div>
                );
            }
            continue;
        }
        const isBullet = /^[-*]\s+/.test(line);
        const content = isBullet ? line.replace(/^[-*]\s+/, '') : line;
        const inline: React.ReactNode[] = [];
        const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
        let last = 0; let m: RegExpExecArray | null;
        while ((m = regex.exec(content)) !== null) {
            if (m.index > last) inline.push(content.slice(last, m.index));
            if (m[1]) inline.push(<strong key={m.index} style={{ color: T.ink, fontWeight: 700 }}>{m[1]}</strong>);
            else if (m[2]) inline.push(<code key={m.index} style={{ padding: '1px 5px', background: 'rgba(0,0,0,0.06)', borderRadius: 3, fontSize: 11, fontFamily: 'var(--font-mono)' }}>{m[2]}</code>);
            last = m.index + m[0].length;
        }
        if (last < content.length) inline.push(content.slice(last));
        const rendered = inline.length ? inline : [content];
        result.push(
            <React.Fragment key={i}>
                {isBullet ? <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', margin: '3px 0' }}><span style={{ marginTop: 9, width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.4, flexShrink: 0 }} /><span>{rendered}</span></div> : <span>{rendered}</span>}
                {i < lines.length - 1 && !isBullet && <br />}
            </React.Fragment>
        );
        i++;
    }
    return result;
};

// Build the demo conversation from the active scenario so chat always matches it.
const buildMessages = (s: Scenario) => {
    const goalLines = s.goals.map(g => `- ${g.description} · **${g.weight}%**`).join('\n');
    const sample = s.resources.slice(0, 3);
    const cols = Object.keys(sample[0] ?? {}).slice(0, 4);
    const head = `| ${cols.join(' | ')} |\n|${cols.map(() => '---').join('|')}|`;
    const tableRows = sample.map(r => `| ${cols.map(c => r[c]).join(' | ')} |`).join('\n');
    return [
        { id: '1', role: 'user' as const, content: s.userPrompt, ts: '09:41' },
        { id: '2', role: 'assistant' as const, content: `Got it — here's what I understand:\n\n- **${s.resourceLabel}** → **${s.targetLabel}**\n- **Objectives:** ${s.goals.map(g => g.description.replace(/\.$/, '')).join(' · ')}\n\nPick a data source and confirm the goals you care about:`, ts: '09:41', action: null, chips: ['Generate a sample for me', "I'll upload my data", ...s.goals.slice(0, 2).map(g => g.description.replace(/\.$/, ''))] },
        { id: '3', role: 'user' as const, content: `Generate a sample for me · ${s.goals.slice(0, 2).map(g => g.description.replace(/\.$/, '')).join(' · ')}`, ts: '09:42' },
        { id: '4', role: 'assistant' as const, content: `Generating a realistic sample now — **${s.resourceCount} ${s.resourceLabel}** and **${s.targetCount} ${s.targetLabel}**.\n\n${head}\n${tableRows}\n\nI've compiled your goals (tune weights in the **Goals** tab):\n\n${goalLines}\n\n**Shall I run the optimization now?**`, ts: '09:42', action: 'generate_sample_dataset', goals: true },
        { id: '5', role: 'user' as const, content: 'Yes, run it.', ts: '09:43' },
        { id: '6', role: 'assistant' as const, content: `Optimization dispatched via the **${s.solver}** — the canvas shows live progress. Every assignment comes back with a per-decision rationale you can review, approve, or modify.`, ts: '09:43', action: 'optimization_started', run: true },
    ];
};

const MessageBubble = ({ msg, onOpenCanvas, onStartRun, runStage }: { msg: any; onOpenCanvas: (tab: CanvasTab) => void; onStartRun: () => void; runStage: string }) => {
    const isUser = msg.role === 'user';
    return (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isUser ? T.boneDeep : `linear-gradient(135deg, #6B1A30, #9A3050)`, border: isUser ? `1px solid ${T.neutral300}` : 'none' }}>
                {isUser ? <User size={13} style={{ color: T.neutral600 }} /> : <Bot size={13} style={{ color: T.bone }} />}
            </div>
            <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                <div style={isUser ? { background: T.boneDeep, border: `1px solid ${T.neutral300}`, borderRadius: '18px 4px 18px 18px', padding: '9px 14px', fontSize: 14, lineHeight: 1.55, color: T.ink } : { fontSize: 14, lineHeight: 1.6, color: T.ink, paddingTop: 2 }}>
                    {msg.files && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {msg.files.map((f: any, i: number) => (
                                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: '#fff', border: `1px solid ${T.neutral200}`, borderRadius: 8, fontSize: 11, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.maroon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    <span style={{ fontWeight: 500 }}>{f.name}</span>
                                    <span style={{ color: T.neutral400 }}>{f.size}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ whiteSpace: 'pre-wrap' }}>{renderMd(msg.content)}</div>
                    {msg.action && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: 'rgba(92,20,39,0.08)', color: T.maroon, marginTop: 8 }}>
                            <CheckCircle2 size={10} /> {msg.action}
                        </div>
                    )}
                    {msg.chips && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                            {msg.chips.map((c: string) => (
                                <span key={c} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, border: `1px solid rgba(92,20,39,0.2)`, background: 'rgba(92,20,39,0.05)', color: T.maroonDeep, fontWeight: 500 }}>
                                    {c}
                                </span>
                            ))}
                        </div>
                    )}
                    {msg.goals && (
                        <button onClick={() => onOpenCanvas('goals')}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, color: T.maroon, background: 'rgba(92,20,39,0.06)', border: `1px solid rgba(92,20,39,0.15)`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            <Target size={12} /> Open Goals tab in canvas →
                        </button>
                    )}
                    {msg.run && runStage === 'idle' && (
                        <button onClick={onStartRun}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 13, fontWeight: 600, color: T.bone, background: T.maroon, border: 0, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>
                            <Play size={13} fill={T.bone} /> Watch the solve live
                        </button>
                    )}
                </div>
                <div style={{ fontSize: 10, color: T.neutral400, padding: '0 3px' }}>{msg.ts}</div>
            </div>
        </div>
    );
};

// ── Main demo page ─────────────────────────────────────────────────────────────

export default function DemoPage() {
    const [canvasOpen, setCanvasOpen] = useState(false);
    const [canvasMinimized, setCanvasMinimized] = useState(false);
    const [canvasTab, setCanvasTab] = useState<CanvasTab>('monitor');
    const [runStage, setRunStage] = useState('idle');
    const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const scenario = SCENARIOS.find(s => s.id === scenarioId) ?? SCENARIOS[0];
    const [goals, setGoals] = useState<MockGoal[]>(SCENARIOS[0].goals);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const runTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, []);

    const openCanvas = useCallback((tab: CanvasTab = 'monitor') => {
        setCanvasOpen(true);
        setCanvasMinimized(false);
        setCanvasTab(tab);
    }, []);

    const startRun = useCallback(() => {
        openCanvas('monitor');
        setRunStage('ingest');
        const stages = ['ingest','translate','init','solve','solve','solve','converge','explain','done'];
        let idx = 0;
        if (runTimer.current) clearInterval(runTimer.current);
        runTimer.current = setInterval(() => {
            idx++;
            if (idx >= stages.length) {
                setRunStage('done');
                setCanvasTab('results');
                clearInterval(runTimer.current!);
            } else {
                setRunStage(stages[idx]);
            }
        }, 700);
    }, [openCanvas]);

    useEffect(() => () => { if (runTimer.current) clearInterval(runTimer.current); }, []);

    const handleGoalAdd = (g: MockGoal) => setGoals(prev => [...prev, g]);
    const handleGoalUpdate = (id: string, patch: Partial<MockGoal>) => setGoals(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g));
    const handleGoalDelete = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));

    // Switching the active scenario (from the history list) swaps the whole demo dataset.
    const switchScenario = useCallback((id: string) => {
        const sc = SCENARIOS.find(s => s.id === id) ?? SCENARIOS[0];
        if (runTimer.current) clearInterval(runTimer.current);
        setScenarioId(id);
        setGoals(sc.goals);
        setRunStage('idle');
        setCanvasOpen(false);
        setSidebarOpen(false);
    }, []);

    const canvasVisible = canvasOpen && !canvasMinimized;
    const isDone = runStage === 'done';

    return (
        <div data-theme="light" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', width: '100%', overflow: 'hidden' }}>
            {/* Guided-demo banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '7px 16px', background: T.maroonDeep, color: T.bone, fontSize: 12.5, flexShrink: 0, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.7 }}>Guided demo · {scenario.domain}</span>
                <span>{scenario.blurb} · sample data, fully interactive.</span>
                <Link href="/workspace" style={{ color: T.bone, fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    Launch the app to solve your own →
                </Link>
            </div>
        <div style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', background: T.bone, overflow: 'hidden', fontFamily: 'var(--font-sans)', position: 'relative' }}>
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div className="md:hidden absolute inset-0 z-20 bg-black/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={cn("absolute md:relative z-30 inset-y-0 left-0 transition-transform duration-300 md:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")} style={{ width: 260, background: T.bone, borderRight: `1px solid ${T.boneDeep}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ padding: '14px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, fontFamily: 'var(--font-display)', fontSize: 22, color: T.maroonDeep }}>
                        Intellign
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden" style={{ width: 30, height: 30, border: 0, background: 'transparent', color: T.neutral500, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer' }}>
                        <PanelLeftClose size={17} />
                    </button>
                </div>
                <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 10px', borderRadius: 8, fontSize: 13.5, color: T.ink, background: 'transparent', border: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
                        onMouseEnter={e => (e.currentTarget.style.background = T.boneDeep)} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <SquarePen size={15} style={{ color: T.neutral600, flexShrink: 0 }} /> New chat
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, background: T.boneDeep }}>
                        <Search size={14} style={{ color: T.neutral600, flexShrink: 0 }} />
                        <input placeholder="Search chats" style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', fontSize: 13.5, color: T.ink, fontFamily: 'inherit' }} />
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '4px 12px' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: T.ink, padding: '6px 8px', marginBottom: 2 }}>Sample scenarios</p>
                    {SCENARIOS.map(s => {
                        const activeS = scenarioId === s.id;
                        return (
                            <div key={s.id} onClick={() => switchScenario(s.id)}
                                style={{ padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: activeS ? T.boneDeep : 'transparent', marginBottom: 1 }}
                                onMouseEnter={e => { if (!activeS) (e.currentTarget as HTMLDivElement).style.background = T.boneDeep; }}
                                onMouseLeave={e => { if (!activeS) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}>
                                <div style={{ fontSize: 13, color: T.ink, fontWeight: activeS ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                                <div style={{ fontSize: 10.5, color: T.neutral500, marginTop: 1 }}>{s.domain} · {s.task}</div>
                            </div>
                        );
                    })}
                </div>
                <div style={{ padding: '0 12px 10px' }}>
                    <Link href="/demo/helium-health"
                        style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 12px', borderRadius: 8, textDecoration: 'none', background: 'rgba(92,20,39,0.06)', border: `1px solid rgba(92,20,39,0.15)` }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.maroon, fontWeight: 700 }}>Featured partner demo</span>
                        <span style={{ fontSize: 12.5, color: T.ink, fontWeight: 600 }}>Helium Health &times; Intellign →</span>
                    </Link>
                </div>
                <div style={{ borderTop: `1px solid ${T.boneDeep}`, padding: '8px 12px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, cursor: 'pointer' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(92,20,39,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: T.maroon, flexShrink: 0 }}>A</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: T.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Adeola Adegbemijo</p>
                            <p style={{ fontSize: 11, color: T.neutral500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>adeola@databackedafrica.com</p>
                        </div>
                        <button style={{ border: 0, background: 'transparent', color: T.neutral500, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}>
                            <LogOut size={15} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Chat area (narrows when canvas open) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, transition: 'max-width 280ms cubic-bezier(0.2,0,0,1)', maxWidth: canvasVisible ? 'calc(100% - 720px)' : '100%' }}>
                {/* TopBar */}
                <header style={{ height: 54, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(244,239,231,0.85)', backdropFilter: 'blur(12px)', borderBottom: `1px solid transparent`, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button className="md:hidden" onClick={() => setSidebarOpen(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, border: 0, background: 'transparent', color: T.neutral600, cursor: 'pointer' }}>
                            <Menu size={18} />
                        </button>
                        <span style={{ fontSize: 15, fontWeight: 600, color: T.maroonDeep, padding: '5px 8px' }}>Intellign AI</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.neutral400 }}>
                            <ChevronDown size={13} />
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShareButton slug={scenario.id} />
                        {!canvasOpen && (
                            <button onClick={() => openCanvas('goals')}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'transparent', border: `1px solid ${T.neutral200}`, borderRadius: 8, fontSize: 13, color: T.neutral600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                <Settings size={13} /> Canvas
                            </button>
                        )}
                        <button onClick={startRun}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: T.maroon, color: T.bone, border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <Play size={13} fill={T.bone} /> Run optimization
                        </button>
                    </div>
                </header>

                {/* Context bar */}
                <div style={{ padding: '8px 16px 4px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 12px', padding: '9px 14px', background: T.boneDeep, border: `1px solid ${T.neutral200}`, borderRadius: 14, fontSize: 12 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.maroon, paddingRight: 12, borderRight: `1px solid rgba(0,0,0,0.08)` }}>Active problem</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.neutral600 }}>
                            <b style={{ color: T.ink, fontFamily: 'var(--font-sans)' }}>{scenario.title}</b>
                        </span>
                        <span style={{ width: 1, height: 13, background: 'rgba(0,0,0,0.08)' }} />
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.neutral600 }}>
                            <Database size={12} style={{ color: T.neutral500 }} />
                            <b style={{ color: T.ink }}>{scenario.resourceCount}</b> {scenario.resourceLabel} · <b style={{ color: T.ink }}>{scenario.targetCount}</b> {scenario.targetLabel}
                        </span>
                        <span style={{ width: 1, height: 13, background: 'rgba(0,0,0,0.08)' }} />
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.neutral600 }}>
                            <Target size={12} style={{ color: T.neutral500 }} />
                            <b style={{ color: T.ink }}>{goals.length}</b> goals
                        </span>
                        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12, borderLeft: '1px solid rgba(0,0,0,0.08)' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isDone ? '#10B981' : runStage !== 'idle' ? '#F59E0B' : '#10B981', display: 'inline-block', boxShadow: isDone ? undefined : runStage !== 'idle' ? '0 0 0 3px rgba(245,158,11,0.18)' : '0 0 0 3px rgba(16,185,129,0.16)' }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: isDone ? '#047857' : runStage !== 'idle' ? '#B45309' : '#047857' }}>
                                {isDone ? 'Converged' : runStage !== 'idle' ? 'Solving…' : 'Ready to optimize'}
                            </span>
                            {runStage === 'idle' && (
                                <button onClick={startRun} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: T.maroon, color: T.bone, border: 0, borderRadius: 999, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 4 }}>
                                    <Zap size={11} /> Run
                                </button>
                            )}
                            {(isDone) && (
                                <button onClick={() => openCanvas('results')} style={{ fontSize: 11, color: T.maroon, background: 'transparent', border: 0, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2, fontFamily: 'inherit', marginLeft: 4 }}>
                                    Open canvas
                                </button>
                            )}
                        </span>
                    </div>
                    {/* Readiness strip */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        {[
                            { label: 'Data ready', done: true, tab: 'datasets' as CanvasTab },
                            { label: 'Goals defined', done: goals.length > 0, tab: 'goals' as CanvasTab },
                            { label: 'Ready to optimize', done: isDone, tab: 'results' as CanvasTab },
                        ].map((item, idx, arr) => (
                            <React.Fragment key={item.label}>
                                <button onClick={() => openCanvas(item.tab)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, border: `1px solid ${item.done ? 'rgba(92,20,39,0.2)' : T.neutral200}`, background: item.done ? 'rgba(92,20,39,0.07)' : T.boneDeep, color: item.done ? T.maroon : T.neutral400, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, cursor: 'pointer', letterSpacing: '0.04em' }}>
                                    {item.done ? <CheckCircle2 size={11} /> : <span style={{ width: 10, height: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>○</span>}
                                    {item.label}
                                </button>
                                {idx < arr.length - 1 && <ChevronRight size={11} style={{ color: T.neutral300, flexShrink: 0 }} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {buildMessages(scenario).map(msg => <MessageBubble key={msg.id} msg={msg} onOpenCanvas={openCanvas} onStartRun={startRun} runStage={runStage} />)}
                </div>

                {/* Composer */}
                <div style={{ padding: '8px 16px 10px', background: 'rgba(244,239,231,0.85)', backdropFilter: 'blur(12px)', flexShrink: 0 }}>
                    <div style={{ background: T.boneDeep, border: `1px solid ${T.neutral300}`, borderRadius: 24, padding: '4px 6px 4px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Continue the conversation…"
                            style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', fontSize: 14, fontFamily: 'inherit', color: T.ink, height: 38 }} />
                        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: input.trim() ? T.maroon : T.neutral200, border: 0, cursor: input.trim() ? 'pointer' : 'default', color: input.trim() ? T.bone : T.neutral400, flexShrink: 0 }}>
                            <Zap size={15} />
                        </button>
                    </div>
                </div>

                {/* Minimized canvas dock */}
                {canvasOpen && canvasMinimized && (
                    <button onClick={() => setCanvasMinimized(false)}
                        style={{ position: 'absolute', right: 22, bottom: 80, display: 'flex', alignItems: 'center', gap: 8, background: T.maroon, color: T.bone, border: 0, borderRadius: 999, padding: '9px 16px', boxShadow: '0 6px 18px rgba(92,20,39,0.28)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFD08A', animation: 'pulse 1.2s ease-in-out infinite', display: 'inline-block' }} />
                        {isDone ? 'Optimization complete · 50 / 50 assigned' : 'Solving…'}
                        <TrendingUp size={14} />
                    </button>
                )}
            </div>

            {/* Canvas panel (slides in) */}
            <AnimatePresence>
                {canvasVisible && (
                    <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                        <Canvas
                            scenario={scenario}
                            runStage={runStage}
                            goals={goals}
                            onGoalAdd={handleGoalAdd}
                            onGoalUpdate={handleGoalUpdate}
                            onGoalDelete={handleGoalDelete}
                            tab={canvasTab}
                            onTabChange={setCanvasTab}
                            onClose={() => { setCanvasOpen(false); setCanvasMinimized(false); }}
                            onMinimize={() => setCanvasMinimized(true)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        </div>
    );
}
