import run from './nysc-run.json';
import sample from './sample-assignments.json';
import type { NyscBundle } from './types';

export const bundle = { ...run, sample } as unknown as NyscBundle;
