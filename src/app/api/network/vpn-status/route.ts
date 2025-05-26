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

export async function GET() {
  try {
    let vpnStatus = { 
      isActive: false, 
      interface: '', 
      ip: '', 
      type: '',
      connections: [] as Array<{
        interface: string;
        ip: string;
        type: string;
        status: string;
      }>
    };
    
    // Check for VPN network interfaces (tun/tap)
    const vpnInterfaces = await runCommand('ip -o link show | grep -E "(tun|tap)" | awk -F: \'{print $2}\' | tr -d " "');
    if (vpnInterfaces) {
      const interfaces = vpnInterfaces.split('\n').filter(Boolean);
      for (const iface of interfaces) {
        try {
          const ipOutput = await runCommand(`ip -4 addr show ${iface} | grep -oP '(?<=inet\\s)\\d+(\\.\\d+){3}'`);
          const ip = ipOutput.split('\n')[0] || '';
          const status = await runCommand(`ip link show ${iface} | grep -o 'state [A-Z]*' | awk '{print $2}'`);
          
          if (status === 'UP' || status === 'UNKNOWN') {
            vpnStatus.isActive = true;
            if (!vpnStatus.interface) {
              vpnStatus.interface = iface;
              vpnStatus.ip = ip;
              vpnStatus.type = iface.startsWith('tun') ? 'TUN' : 'TAP';
            }
          }
          
          vpnStatus.connections.push({
            interface: iface,
            ip: ip,
            type: iface.startsWith('tun') ? 'TUN' : 'TAP',
            status: status || 'UNKNOWN'
          });
        } catch (error) {
          // Continue with next interface
        }
      }
    }
    
    // Check for OpenVPN processes
    try {
      const openvpnProcesses = await runCommand('pgrep -f openvpn');
      if (openvpnProcesses) {
        vpnStatus.isActive = true;
        if (!vpnStatus.type) {
          vpnStatus.type = 'OpenVPN';
        }
      }
    } catch (error) {
      // OpenVPN not running
    }
    
    // Check for WireGuard
    try {
      const wgOutput = await runCommand('wg show 2>/dev/null');
      if (wgOutput) {
        vpnStatus.isActive = true;
        const wgInterfaces = wgOutput.split('\n').filter(line => line.includes('interface:') || !line.includes(' '));
        
        for (const line of wgInterfaces) {
          if (line && !line.includes(' ')) {
            const wgInterface = line.replace(':', '').trim();
            try {
              const wgIp = await runCommand(`ip -4 addr show ${wgInterface} | grep -oP '(?<=inet\\s)\\d+(\\.\\d+){3}'`);
              
              if (!vpnStatus.interface) {
                vpnStatus.interface = wgInterface;
                vpnStatus.ip = wgIp;
                vpnStatus.type = 'WireGuard';
              }
              
              vpnStatus.connections.push({
                interface: wgInterface,
                ip: wgIp,
                type: 'WireGuard',
                status: 'UP'
              });
            } catch (error) {
              // Continue
            }
          }
        }
      }
    } catch (error) {
      // WireGuard not available
    }
    
    // Check for other VPN software
    try {
      // Check for strongSwan (IPsec)
      const ipsecStatus = await runCommand('ipsec status 2>/dev/null | head -1');
      if (ipsecStatus && !ipsecStatus.includes('command not found')) {
        const activeConnections = await runCommand('ipsec status 2>/dev/null | grep -c "ESTABLISHED"');
        if (parseInt(activeConnections) > 0) {
          vpnStatus.isActive = true;
          if (!vpnStatus.type) {
            vpnStatus.type = 'IPsec';
          }
        }
      }
    } catch (error) {
      // IPsec not available
    }
    
    // Check for NetworkManager VPN connections
    try {
      const nmConnections = await runCommand('nmcli connection show --active | grep vpn');
      if (nmConnections) {
        vpnStatus.isActive = true;
        if (!vpnStatus.type) {
          vpnStatus.type = 'NetworkManager VPN';
        }
      }
    } catch (error) {
      // NetworkManager not available
    }
    
    return NextResponse.json({
      vpnStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('VPN status API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VPN status' },
      { status: 500 }
    );
  }
}
