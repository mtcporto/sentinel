import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execPromise = promisify(exec);

// Função para executar comandos shell
async function runCommand(command: string) {
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

// Lista de arquivos de log comuns em sistemas Linux
const LOG_FILES = [
  '/var/log/syslog',
  '/var/log/auth.log',
  '/var/log/kern.log',
  '/var/log/dmesg',
  '/var/log/messages',
  '/var/log/boot.log',
  '/var/log/apache2/access.log',
  '/var/log/apache2/error.log',
  '/var/log/nginx/access.log',
  '/var/log/nginx/error.log',
  '/var/log/mysql/error.log'
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  
  try {
    // Se um arquivo específico foi solicitado
    if (file) {
      // Verificação básica de segurança para evitar path traversal
      if (file.includes('..')) {
        return NextResponse.json(
          { error: 'Invalid file path' },
          { status: 400 }
        );
      }
      
      try {
        // Usando comando cat com sudo -n (non-interactive) para tentar leituras com privilégios
        // ou cai de volta para tail normal sem sudo
        const logContent = await runCommand(`tail -n ${limit} ${file} 2>/dev/null || echo "Não foi possível acessar o arquivo. Permissão negada."`);
        
        return NextResponse.json({
          file,
          content: logContent.trim() === "Não foi possível acessar o arquivo. Permissão negada." 
            ? [`[ERRO DE ACESSO] ${logContent}`] 
            : logContent.split('\n'),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Erro ao ler arquivo ${file}:`, error);
        return NextResponse.json({
          file,
          content: [`[ERRO DE ACESSO] Não foi possível ler o arquivo: ${file}. Verifique as permissões.`],
          timestamp: new Date().toISOString()
        }, { status: 200 }); // Retornando 200 com mensagem de erro em vez de falhar
      }
    } 
    
    // Caso contrário, retorne uma lista de logs disponíveis
    const availableLogs = [];
    
    for (const logFile of LOG_FILES) {
      try {
        // Verifica se o arquivo existe
        await fs.access(logFile);
        
        // Obtém informações do arquivo
        const stats = await fs.stat(logFile);
        
        availableLogs.push({
          path: logFile,
          name: path.basename(logFile),
          sizeBytes: stats.size,
          lastModified: stats.mtime.toISOString()
        });
      } catch (err) {
        // Ignora arquivos que não existem
      }
    }
    
    return NextResponse.json({
      logs: availableLogs,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching log data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch log data' },
      { status: 500 }
    );
  }
}
