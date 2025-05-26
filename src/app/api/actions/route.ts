import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// List of allowed commands for security
const ALLOWED_COMMANDS = [
  'systemctl restart',
  'systemctl status',
  'rm -rf /tmp/',
  'df -h',
  'free -m',
  'top -bn1',
  // Add more allowed commands as needed
];

export async function POST(request: Request) {
  try {
    const { command } = await request.json();
    
    // Security check: Only allow pre-approved commands
    const isAllowed = ALLOWED_COMMANDS.some(allowedCmd => command.startsWith(allowedCmd));
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Command not allowed for security reasons' },
        { status: 403 }
      );
    }
    
    // Execute the command
    const { stdout, stderr } = await execPromise(command);
    
    // Log the action for audit purposes
    // In a real app, you'd store this in a database
    console.log(`Action executed: ${command}`);
    
    return NextResponse.json({
      success: true,
      output: stdout,
      error: stderr || null,
      timestamp: new Date().toISOString(),
      command
    });
    
  } catch (error) {
    console.error('Error executing command:', error);
    return NextResponse.json(
      { error: 'Failed to execute command' },
      { status: 500 }
    );
  }
}
