import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
const scenes = JSON.parse(readFileSync('narration.json', 'utf8'));
const env = { ...process.env, PATH: `${os.homedir()}/.cache/hyperframes-venv/bin:${process.env.PATH}` };
for (const s of scenes) {
  execFileSync('npx', ['--yes', 'hyperframes', 'tts', s.text, '--voice', 'af_heart', '--speed', '0.95', '--output', `audio/${s.id}.wav`], { stdio: 'ignore', env, timeout: 300000 });
  const d = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', `audio/${s.id}.wav`]).toString().trim();
  console.log(s.id, d);
}
