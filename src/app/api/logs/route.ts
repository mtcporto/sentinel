import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { LOG_FILES, readSystemLog, validateLogLimit } from '@/lib/system-logs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');
  const limit = Number(searchParams.get('limit') ?? '50');
  try {
    validateLogLimit(limit);
  } catch {
    return NextResponse.json({ error: 'Invalid log limit (1-1000)' }, { status: 400 });
  }
  
  try {
    // Se um arquivo específico foi solicitado
    if (file) {
      // Aceita apenas os arquivos de log conhecidos.
      if (!LOG_FILES.includes(file)) {
        return NextResponse.json(
          { error: 'Invalid file path' },
          { status: 400 }
        );
      }
      
      try {
        // Executa tail com argumentos separados, sem shell.
        const logContent = await readSystemLog(file, limit);
        
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
