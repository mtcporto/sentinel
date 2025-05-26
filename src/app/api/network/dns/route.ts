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

interface DnsServer {
  ip: string;
  name: string;
  responseTime: number;
  isReachable: boolean;
  provider: string;
}

// Known DNS providers for identification
const knownDnsProviders: Record<string, string> = {
  '8.8.8.8': 'Google DNS',
  '8.8.4.4': 'Google DNS',
  '1.1.1.1': 'Cloudflare DNS',
  '1.0.0.1': 'Cloudflare DNS',
  '208.67.222.222': 'OpenDNS',
  '208.67.220.220': 'OpenDNS',
  '9.9.9.9': 'Quad9 DNS',
  '149.112.112.112': 'Quad9 DNS',
  '76.76.19.19': 'Comodo DNS',
  '76.76.76.76': 'Comodo DNS',
  '94.140.14.14': 'AdGuard DNS',
  '94.140.15.15': 'AdGuard DNS'
};

export async function GET() {
  try {
    const dnsServers: DnsServer[] = [];
    
    // Get DNS servers from /etc/resolv.conf
    try {
      const resolvConfContent = await runCommand('cat /etc/resolv.conf');
      const dnsLines = resolvConfContent.split('\n').filter(line => line.trim().startsWith('nameserver'));
      
      for (const line of dnsLines) {
        const serverIp = line.replace('nameserver', '').trim();
        if (serverIp && serverIp.match(/^\d+\.\d+\.\d+\.\d+$/)) {
          
          // Test DNS server response time
          let responseTime = 0;
          let isReachable = false;
          try {
            const startTime = Date.now();
            await runCommand(`nslookup google.com ${serverIp} | grep -q "Address"`);
            const endTime = Date.now();
            responseTime = endTime - startTime;
            isReachable = true;
          } catch (error) {
            // Try ping as fallback
            try {
              const startTime = Date.now();
              await runCommand(`ping -c 1 -W 2 ${serverIp} >/dev/null 2>&1`);
              const endTime = Date.now();
              responseTime = endTime - startTime;
              isReachable = true;
            } catch (pingError) {
              isReachable = false;
            }
          }
          
          // Get reverse DNS name
          let name = '';
          try {
            const reverseLookup = await runCommand(`nslookup ${serverIp} | grep "name =" | awk '{print $4}' | sed 's/\\.$//g'`);
            name = reverseLookup || '';
          } catch (error) {
            name = '';
          }
          
          const provider = knownDnsProviders[serverIp] || 'Unknown';
          
          dnsServers.push({
            ip: serverIp,
            name: name || serverIp,
            responseTime,
            isReachable,
            provider
          });
        }
      }
    } catch (error) {
      console.error('Error reading resolv.conf:', error);
    }
    
    // Also check systemd-resolved if available
    try {
      const systemdResolved = await runCommand('systemd-resolve --status 2>/dev/null | grep "DNS Servers" -A 10 | grep -E "^\\s+[0-9]+\\." | awk \'{print $1}\'');
      if (systemdResolved) {
        const resolvedServers = systemdResolved.split('\n').filter(Boolean);
        
        for (const serverIp of resolvedServers) {
          // Check if we already have this server
          if (!dnsServers.find(server => server.ip === serverIp)) {
            let responseTime = 0;
            let isReachable = false;
            
            try {
              const startTime = Date.now();
              await runCommand(`nslookup google.com ${serverIp} | grep -q "Address"`);
              const endTime = Date.now();
              responseTime = endTime - startTime;
              isReachable = true;
            } catch (error) {
              try {
                const startTime = Date.now();
                await runCommand(`ping -c 1 -W 2 ${serverIp} >/dev/null 2>&1`);
                const endTime = Date.now();
                responseTime = endTime - startTime;
                isReachable = true;
              } catch (pingError) {
                isReachable = false;
              }
            }
            
            let name = '';
            try {
              const reverseLookup = await runCommand(`nslookup ${serverIp} | grep "name =" | awk '{print $4}' | sed 's/\\.$//g'`);
              name = reverseLookup || '';
            } catch (error) {
              name = '';
            }
            
            const provider = knownDnsProviders[serverIp] || 'Unknown';
            
            dnsServers.push({
              ip: serverIp,
              name: name || serverIp,
              responseTime,
              isReachable,
              provider
            });
          }
        }
      }
    } catch (error) {
      // systemd-resolved not available or failed
    }
    
    // Get DNS resolution statistics
    let dnsResolutionTest = {
      googleCom: { resolved: false, time: 0 },
      githubCom: { resolved: false, time: 0 },
      cloudflareComm: { resolved: false, time: 0 }
    };
    
    const testDomains = [
      { domain: 'google.com', key: 'googleCom' },
      { domain: 'github.com', key: 'githubCom' },
      { domain: 'cloudflare.com', key: 'cloudflareComm' }
    ];
    
    for (const test of testDomains) {
      try {
        const startTime = Date.now();
        await runCommand(`nslookup ${test.domain} | grep -q "Address"`);
        const endTime = Date.now();
        (dnsResolutionTest as any)[test.key] = {
          resolved: true,
          time: endTime - startTime
        };
      } catch (error) {
        (dnsResolutionTest as any)[test.key] = {
          resolved: false,
          time: 0
        };
      }
    }
    
    return NextResponse.json({
      dnsServers,
      dnsResolutionTest,
      totalServers: dnsServers.length,
      reachableServers: dnsServers.filter(server => server.isReachable).length,
      averageResponseTime: dnsServers.length > 0 
        ? dnsServers.reduce((sum, server) => sum + server.responseTime, 0) / dnsServers.length 
        : 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('DNS API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DNS information' },
      { status: 500 }
    );
  }
}
