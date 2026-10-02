import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const LOG_FILES: readonly string[] = [
  '/var/log/syslog', '/var/log/auth.log', '/var/log/kern.log',
  '/var/log/dmesg', '/var/log/messages', '/var/log/boot.log',
  '/var/log/apache2/access.log', '/var/log/apache2/error.log',
  '/var/log/nginx/access.log', '/var/log/nginx/error.log',
  '/var/log/mysql/error.log',
];

export function validateLogLimit(limit: unknown): asserts limit is number {
  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 1000) {
    throw new Error('Log limit must be an integer between 1 and 1000');
  }
}

export async function readSystemLog(file: string, limit: number): Promise<string> {
  if (!LOG_FILES.includes(file)) throw new Error('Invalid log file');
  validateLogLimit(limit);
  // Pass separate arguments without a shell; never interpret request text as code.
  const { stdout } = await execFileAsync('tail', ['-n', String(limit), '--', file], {
    timeout: 5000,
    maxBuffer: 1024 * 1024,
  });
  return stdout;
}
