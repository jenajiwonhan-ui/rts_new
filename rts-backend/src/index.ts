import cron from 'node-cron';
import 'dotenv/config';
import { fetchRawData } from './jobs/fetchRawData.js';

const schedule = process.env.CRON_SCHEDULE || '0 6 * * *';

console.log(`[rts-backend] Starting scheduler`);
console.log(`[rts-backend] Cron schedule: ${schedule}`);

cron.schedule(schedule, async () => {
  console.log(`[cron] Triggered at ${new Date().toISOString()}`);
  await fetchRawData();
});

console.log(`[rts-backend] Scheduler running. Waiting for next trigger...`);
