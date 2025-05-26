import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function runCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr) {
      console.error(`Command error: ${stderr}`);
    }
    return stdout.trim();
  } catch (error) {
    console.error(`Execution error: ${error}`);
    return '';
  }
}

function safeParseInt(value: string): number {
  const parsed = parseInt(value);
  return isNaN(parsed) ? 0 : parsed;
}

interface NetworkInterface {
  name: string;
  state: 'up' | 'down';
  ipAddress: string;
  macAddress: string;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
  type: 'ethernet' | 'wifi' | 'loopback' | 'vpn' | 'docker' | 'bridge' | 'unknown';
  isImportant: boolean;
}

function classifyInterface(interfaceName: string): { type: NetworkInterface['type'], isImportant: boolean } {
  const name = interfaceName.toLowerCase();
  
  if (name.startsWith('enp') || name.startsWith('eth') || name.startsWith('eno')) {
    return { type: 'ethernet', isImportant: true };
  }
  if (name.startsWith('wlp') || name.startsWith('wlan') || name.startsWith('wifi')) {
    return { type: 'wifi', isImportant: true };
  }
  if (name.startsWith('tun') || name.startsWith('tap') || name.includes('vpn')) {
    return { type: 'vpn', isImportant: true };
  }
  if (name.startsWith('lo')) {
    return { type: 'loopback', isImportant: false };
  }
  if (name.startsWith('docker') || name.startsWith('br-') || name.startsWith('veth')) {
    return { type: 'docker', isImportant: false };
  }
  if (name.startsWith('br') || name.startsWith('virbr')) {
    return { type: 'bridge', isImportant: false };
  }
  
  return { type: 'unknown', isImportant: false };
}

export async function GET() {
  try {
    const interfacesRaw = await runCommand('ip -o link show');
    const interfacesLines = interfacesRaw.split('\n').filter(Boolean);
    
    const interfaces: NetworkInterface[] = [];
    
    for (const line of interfacesLines) {
      const parts = line.split(/\s+/);
      if (parts.length < 3) continue;
      
      const interfaceName = parts[1].replace(':', '');
      const { type, isImportant } = classifyInterface(interfaceName);
      
      const state = line.includes('UP') ? 'up' : 'down';
      
      let ipAddress = '';
      try {
        const ipOutput = await runCommand(`ip -4 addr show ${interfaceName} | grep -oP '(?<=inet\\s)\\d+(\\.\\d+){3}'`);
        ipAddress = ipOutput.split('\n')[0] || '';
      } catch (error) {
        ipAddress = '';
      }
      
      let macAddress = '';
      const macMatch = line.match(/([0-9a-f]{2}[:-]){5}([0-9a-f]{2})/i);
      if (macMatch) {
        macAddress = macMatch[0];
      }
      
      let rxBytes = 0, txBytes = 0, rxPackets = 0, txPackets = 0;
      try {
        const statsPath = `/sys/class/net/${interfaceName}/statistics`;
        const rxBytesStr = await runCommand(`cat ${statsPath}/rx_bytes 2>/dev/null || echo 0`);
        const txBytesStr = await runCommand(`cat ${statsPath}/tx_bytes 2>/dev/null || echo 0`);
        const rxPacketsStr = await runCommand(`cat ${statsPath}/rx_packets 2>/dev/null || echo 0`);
        const txPacketsStr = await runCommand(`cat ${statsPath}/tx_packets 2>/dev/null || echo 0`);
        
        rxBytes = safeParseInt(rxBytesStr);
        txBytes = safeParseInt(txBytesStr);
        rxPackets = safeParseInt(rxPacketsStr);
        txPackets = safeParseInt(txPacketsStr);
      } catch (error) {
        // Keep default values
      }
      
      interfaces.push({
        name: interfaceName,
        state,
        ipAddress,
        macAddress,
        rxBytes,
        txBytes,
        rxPackets,
        txPackets,
        type,
        isImportant
      });
    }
    
    return NextResponse.json({
      interfaces,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Network interfaces API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network interfaces' },
      { status: 500 }
    );
  }
}
