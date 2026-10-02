import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Helper function to execute shell commands
export async function runCommand(command: string) {
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr) {
      console.error(`Command error: ${stderr}`);
    }
    return stdout;
  } catch (error) {
    console.error(`Execution error: ${error}`);
    throw error;
  }
}

