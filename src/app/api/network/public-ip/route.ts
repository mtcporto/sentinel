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
    let publicIp = '';
    let internetConnected = false;
    let provider = '';
    let location = '';
    let connectionDetails = {
      latency: 0,
      method: '',
      attempts: 0
    };
    
    // Multiple IP services with different information
    const ipServices = [
      { 
        name: 'ifconfig.me', 
        command: 'curl -s --max-time 10 ifconfig.me',
        timeout: 10000
      },
      { 
        name: 'ipinfo.io', 
        command: 'curl -s --max-time 10 ipinfo.io/json',
        timeout: 10000,
        parseJson: true
      },
      { 
        name: 'icanhazip.com', 
        command: 'curl -s --max-time 10 icanhazip.com',
        timeout: 10000
      },
      { 
        name: 'httpbin.org', 
        command: 'curl -s --max-time 10 httpbin.org/ip',
        timeout: 10000,
        parseJson: true
      }
    ];
    
    // Try each service
    for (const service of ipServices) {
      try {
        connectionDetails.attempts++;
        const startTime = Date.now();
        
        const result = await runCommand(service.command);
        const endTime = Date.now();
        connectionDetails.latency = endTime - startTime;
        
        if (result) {
          if (service.parseJson) {
            try {
              const data = JSON.parse(result);
              if (service.name === 'ipinfo.io') {
                if (data.ip && data.ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                  publicIp = data.ip;
                  provider = data.org || '';
                  location = data.city && data.region ? `${data.city}, ${data.region}, ${data.country}` : data.country || '';
                  internetConnected = true;
                  connectionDetails.method = service.name;
                  break;
                }
              } else if (service.name === 'httpbin.org') {
                if (data.origin && data.origin.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                  publicIp = data.origin;
                  internetConnected = true;
                  connectionDetails.method = service.name;
                  break;
                }
              }
            } catch (parseError) {
              // Continue to next service
            }
          } else {
            // Plain text response
            const ip = result.trim();
            if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
              publicIp = ip;
              internetConnected = true;
              connectionDetails.method = service.name;
              break;
            }
          }
        }
      } catch (error) {
        console.error(`Failed to get IP from ${service.name}:`, error);
        continue;
      }
    }
    
    // If all HTTP services fail, try basic connectivity tests
    if (!internetConnected) {
      const connectivityTests = [
        { name: 'Google DNS', command: 'ping -c 1 -W 3 8.8.8.8 >/dev/null 2>&1' },
        { name: 'Cloudflare DNS', command: 'ping -c 1 -W 3 1.1.1.1 >/dev/null 2>&1' },
        { name: 'OpenDNS', command: 'ping -c 1 -W 3 208.67.222.222 >/dev/null 2>&1' }
      ];
      
      for (const test of connectivityTests) {
        try {
          connectionDetails.attempts++;
          const startTime = Date.now();
          await runCommand(test.command);
          const endTime = Date.now();
          
          internetConnected = true;
          connectionDetails.latency = endTime - startTime;
          connectionDetails.method = `ping-${test.name}`;
          break;
        } catch (error) {
          continue;
        }
      }
    }
    
    // Get additional network information
    let defaultGateway = '';
    let dnsServers: string[] = [];
    
    try {
      // Get default gateway
      const gatewayOutput = await runCommand('ip route | grep default | awk \'{print $3}\' | head -1');
      defaultGateway = gatewayOutput || '';
    } catch (error) {
      // Keep empty
    }
    
    try {
      // Get DNS servers
      const resolvConfContent = await runCommand('cat /etc/resolv.conf | grep nameserver | awk \'{print $2}\'');
      dnsServers = resolvConfContent.split('\n').filter(Boolean);
    } catch (error) {
      // Keep empty array
    }
    
    return NextResponse.json({
      publicIp,
      internetConnected,
      provider,
      location,
      defaultGateway,
      dnsServers,
      connectionDetails,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Public IP API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public IP information' },
      { status: 500 }
    );
  }
}
