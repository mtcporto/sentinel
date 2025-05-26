import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Lista de comandos seguros que podem ser executados
const SAFE_COMMANDS = [
  'ls', 'df', 'free', 'top', 'ps', 'uname', 'uptime', 'who', 'whoami',
  'cat', 'head', 'tail', 'grep', 'find', 'systemctl status'
];

const SAFE_PATHS = [
  '/var/log', '/etc', '/proc', '/sys/class'
];

export async function POST(request: Request) {
  try {
    const { command } = await request.json();
    
    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'Comando inválido ou não especificado' },
        { status: 400 }
      );
    }
    
    // Verificação de segurança - apenas permite certos comandos
    const isSafeCommand = SAFE_COMMANDS.some(safeCmd => command.startsWith(safeCmd));
    
    // Verificação adicional para comandos 'cat', 'head', 'tail' - apenas permitir acesso a certos caminhos
    const isAccessingUnsafePath = SAFE_PATHS.every(safePath => {
      if (command.includes('cat ') || command.includes('head ') || command.includes('tail ')) {
        return !command.includes(safePath);
      }
      return false;
    });
    
    if (!isSafeCommand || isAccessingUnsafePath) {
      return NextResponse.json(
        { error: 'Comando não permitido por razões de segurança' },
        { status: 403 }
      );
    }
    
    // Executa o comando com um timeout de 10 segundos
    const { stdout, stderr } = await execPromise(command, { timeout: 10000 });
    
    return NextResponse.json({
      success: true,
      output: stdout,
      stderr: stderr || null,
      timestamp: new Date().toISOString(),
      command
    });
    
  } catch (error: any) {
    console.error('Erro ao executar comando:', error);
    return NextResponse.json(
      { 
        error: 'Falha ao executar comando',
        details: error.message || 'Erro desconhecido',
        success: false 
      },
      { status: 500 }
    );
  }
}
