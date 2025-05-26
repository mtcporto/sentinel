// src/components/dashboard/SystemDiagnosticsWidget.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { executeSystemCommand } from '@/lib/actions';
import { Terminal, PlayCircle, CheckCircle, AlertCircle } from 'lucide-react';

const DIAGNOSTIC_COMMANDS = [
  { 
    name: "Informações do Sistema", 
    command: "uname -a && cat /etc/*release*", 
    description: "Informações gerais sobre o sistema operacional" 
  },
  { 
    name: "Uso de Disco", 
    command: "df -h", 
    description: "Informações sobre o uso de espaço em disco" 
  },
  { 
    name: "Uso de Memória", 
    command: "free -h", 
    description: "Informações sobre o uso de memória RAM" 
  },
  { 
    name: "CPU e Processo", 
    command: "ps aux --sort=-%cpu | head -10", 
    description: "Informações sobre CPU e processos em execução" 
  },
  { 
    name: "Tempo de Atividade", 
    command: "uptime", 
    description: "Quanto tempo o sistema está em funcionamento" 
  },
  {
    name: "Serviços Críticos",
    command: "systemctl status apache2 mysql nginx 2>/dev/null || echo 'Serviço não encontrado'",
    description: "Status de serviços críticos"
  },
  {
    name: "Logs Recentes",
    command: "tail -n 10 /var/log/syslog 2>/dev/null || echo 'Log não acessível'",
    description: "Entradas recentes no log do sistema"
  },
  {
    name: "Conexões Ativas",
    command: "ss -tuln 2>/dev/null || netstat -tuln 2>/dev/null || echo 'Comandos netstat/ss não disponíveis'",
    description: "Portas e conexões de rede ativas"
  }
];

export function SystemDiagnosticsWidget() {
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [commandResult, setCommandResult] = useState<{
    success: boolean;
    output?: string;
    error?: string;
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunCommand = async (command: string) => {
    setIsRunning(true);
    setSelectedCommand(command);
    setCommandResult(null);

    try {
      const result = await executeSystemCommand(command);
      setCommandResult(result);
    } catch (error) {
      setCommandResult({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido ao executar o comando"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" />
          Diagnóstico do Sistema
        </CardTitle>
        <CardDescription>
          Execute comandos de diagnóstico para verificar o estado do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DIAGNOSTIC_COMMANDS.map((diagCmd) => (
            <Button
              key={diagCmd.name}
              variant="outline"
              className="justify-start h-auto py-2"
              disabled={isRunning}
              onClick={() => handleRunCommand(diagCmd.command)}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              <div className="text-left">
                <div className="font-semibold">{diagCmd.name}</div>
                <div className="text-xs text-muted-foreground">{diagCmd.description}</div>
              </div>
            </Button>
          ))}
        </div>

        {(commandResult || isRunning) && (
          <div className="mt-6 pt-4 border-t">
            <div className="mb-2 flex justify-between items-center">
              <h4 className="font-semibold">Resultado do Diagnóstico:</h4>
              {commandResult && (
                commandResult.success ? 
                <CheckCircle className="h-5 w-5 text-green-500" /> : 
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
            
            {isRunning && <div className="py-3">Executando comando...</div>}
            
            {commandResult && (
              <>
                <div className="mb-2 text-sm text-muted-foreground">
                  Comando: <code className="bg-muted px-1 py-0.5 rounded">{selectedCommand}</code>
                </div>
                
                {commandResult.error ? (
                  <Alert variant="destructive">
                    <AlertTitle>Erro ao executar comando</AlertTitle>
                    <AlertDescription>{commandResult.error}</AlertDescription>
                  </Alert>
                ) : (
                  <ScrollArea className="h-48 w-full rounded-md border p-4 bg-muted font-mono text-sm whitespace-pre-wrap overflow-auto">
                    {commandResult.output || "Sem saída"}
                  </ScrollArea>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
