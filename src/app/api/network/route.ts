import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Helper function to execute shell commands
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

// Helper function to safely parse numbers
function safeParseFloat(value: string): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

// Helper function to safely parse integers
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

// Classify interface type and importance
function classifyInterface(interfaceName: string): { type: NetworkInterface['type'], isImportant: boolean } {
  const name = interfaceName.toLowerCase();
  
  // Important interfaces (ethernet, wifi, VPN)
  if (name.startsWith('enp') || name.startsWith('eth') || name.startsWith('eno')) {
    return { type: 'ethernet', isImportant: true };
  }
  if (name.startsWith('wlp') || name.startsWith('wlan') || name.startsWith('wifi')) {
    return { type: 'wifi', isImportant: true };
  }
  if (name.startsWith('tun') || name.startsWith('tap') || name.includes('vpn')) {
    return { type: 'vpn', isImportant: true };
  }
  
  // Secondary interfaces
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
    // Get network interfaces information
    const interfacesRaw = await runCommand('ip -o link show');
    const interfacesLines = interfacesRaw.split('\n').filter(Boolean);
    
    const interfaces: NetworkInterface[] = [];
    
    for (const line of interfacesLines) {
      const parts = line.split(/\s+/);
      if (parts.length < 3) continue;
      
      const interfaceName = parts[1].replace(':', '');
      const { type, isImportant } = classifyInterface(interfaceName);
      
      // Get interface state
      const state = line.includes('UP') ? 'up' : 'down';
      
      // Get IP address
      let ipAddress = '';
      try {
        const ipOutput = await runCommand(`ip -4 addr show ${interfaceName} | grep -oP '(?<=inet\\s)\\d+(\\.\\d+){3}'`);
        ipAddress = ipOutput.split('\n')[0] || '';
      } catch (error) {
        ipAddress = '';
      }
      
      // Get MAC address
      let macAddress = '';
      const macMatch = line.match(/([0-9a-f]{2}[:-]){5}([0-9a-f]{2})/i);
      if (macMatch) {
        macAddress = macMatch[0];
      }
      
      // Get traffic statistics
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
        // Keep default values of 0
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
    
    // Get VPN status
    let vpnStatus = { isActive: false, interface: '', ip: '' };
    try {
      // Check for active VPN connections
      const vpnInterfaces = interfaces.filter(iface => iface.type === 'vpn' && iface.state === 'up');
      if (vpnInterfaces.length > 0) {
        vpnStatus = {
          isActive: true,
          interface: vpnInterfaces[0].name,
          ip: vpnInterfaces[0].ipAddress
        };
      }
      
      // Also check for OpenVPN processes
      const openvpnProcess = await runCommand('pgrep -f openvpn');
      if (openvpnProcess) {
        vpnStatus.isActive = true;
      }
      
      // Check for WireGuard
      const wgOutput = await runCommand('wg show 2>/dev/null | head -1');
      if (wgOutput) {
        vpnStatus.isActive = true;
        if (!vpnStatus.interface) {
          vpnStatus.interface = wgOutput.split(':')[0] || 'wg0';
        }
      }
    } catch (error) {
      // Keep default VPN status
    }
    
    // Get public IP and internet connectivity
    let publicIp = '';
    let internetConnected = false;
    try {
      // Try multiple services for public IP
      const ipServices = [
        'curl -s --max-time 5 ifconfig.me',
        'curl -s --max-time 5 ipinfo.io/ip',
        'curl -s --max-time 5 icanhazip.com'
      ];
      
      for (const service of ipServices) {
        try {
          const ip = await runCommand(service);
          if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
            publicIp = ip;
            internetConnected = true;
            break;
          }
        } catch (error) {
          continue;
        }
      }
      
      // If public IP services fail, try simple connectivity test
      if (!internetConnected) {
        try {
          await runCommand('ping -c 1 -W 3 8.8.8.8 >/dev/null 2>&1');
          internetConnected = true;
        } catch (error) {
          internetConnected = false;
        }
      }
    } catch (error) {
      // Keep default values
    }
    
    // Get DNS servers
    const dnsServers: string[] = [];
    try {
      const resolvConfContent = await runCommand('cat /etc/resolv.conf');
      const dnsLines = resolvConfContent.split('\n').filter(line => line.trim().startsWith('nameserver'));
      for (const line of dnsLines) {
        const server = line.replace('nameserver', '').trim();
        if (server && !dnsServers.includes(server)) {
          dnsServers.push(server);
        }
      }
    } catch (error) {
      // Keep empty DNS servers array
    }
    
    return NextResponse.json({
      interfaces,
      vpnStatus,
      publicIp,
      internetConnected,
      dnsServers,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Network API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network information' },
      { status: 500 }
    );
  }
}
