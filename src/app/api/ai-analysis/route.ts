import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const execPromise = promisify(exec);

// Set up Genkit with Google AI
const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-pro',
});

export async function GET() {
  try {
    // Collect log data - using more robust error handling
    let syslog = "Log unavailable";
    let authLog = "Log unavailable";
    
    try {
      const syslogResult = await execPromise('tail -n 50 /var/log/syslog');
      syslog = syslogResult.stdout || syslog;
    } catch (err) {
      console.warn("Could not read syslog:", err);
    }
    
    try {
      const authLogResult = await execPromise('tail -n 20 /var/log/auth.log');
      authLog = authLogResult.stdout || authLog;
    } catch (err) {
      console.warn("Could not read auth.log:", err);
    }
    
    // Get system status
    let cpuInfo = "0";
    let memoryInfo = "0";
    let diskInfo = "0%";
    
    try {
      const cpuResult = await execPromise('top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\'');
      cpuInfo = cpuResult.stdout || cpuInfo;
    } catch (err) {
      console.warn("Could not get CPU info:", err);
    }
    
    try {
      const memResult = await execPromise('free -m | grep "Mem:" | awk \'{print $3/$2 * 100}\'');
      memoryInfo = memResult.stdout || memoryInfo;
    } catch (err) {
      console.warn("Could not get memory info:", err);
    }
    
    try {
      const diskResult = await execPromise('df -h / | awk \'NR==2 {print $5}\'');
      diskInfo = diskResult.stdout || diskInfo;
    } catch (err) {
      console.warn("Could not get disk info:", err);
    }
    
    // Prepare the context for AI analysis
    const contextData = {
      syslog: syslog.trim(),
      authLog: authLog.trim(),
      systemStatus: {
        cpu: parseFloat(cpuInfo.trim()) || 0,
        memory: parseFloat(memoryInfo.trim()) || 0,
        disk: diskInfo.trim().replace('%', '') || 0,
      }
    };
    
    // Generate prompt for the AI
    const prompt = `
      As an AI system administrator, analyze these logs and system status:
      
      SYSTEM STATUS:
      CPU Usage: ${contextData.systemStatus.cpu}%
      Memory Usage: ${contextData.systemStatus.memory}%
      Disk Usage: ${contextData.systemStatus.disk}%
      
      RECENT SYSLOG:
      ${contextData.syslog}
      
      AUTH LOG:
      ${contextData.authLog}
      
      Based on this information:
      1. Identify any potential issues or anomalies
      2. Suggest possible causes for any problems detected
      3. Recommend specific actions to resolve the issues
      4. Rate the severity of any detected problems on a scale of 1-5
      
      Format your response as JSON with these keys: issues, causes, recommendations, severity, explanation
    `;
    
    // Send the prompt to the AI model (using Google's Gemini model via Genkit)
    const result = await ai.generate({
      prompt: prompt,
    });
    const text = result.text;
    
    // Try to parse the AI response as JSON
    let analysisResult;
    try {
      // Extract JSON from the response if it's wrapped in markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                       text.match(/```\n([\s\S]*?)\n```/) ||
                       [null, text];
                       
      analysisResult = JSON.parse(jsonMatch[1] || text);
    } catch (error) {
      // If parsing fails, return the text response
      analysisResult = {
        raw: text,
        parseError: 'Could not parse AI response as JSON',
      };
    }
    
    return NextResponse.json({
      analysis: analysisResult,
      timestamp: new Date().toISOString(),
      rawSystemStatus: contextData.systemStatus
    });
    
  } catch (error) {
    console.error('Error in AI analysis:', error);
    return NextResponse.json(
      { error: 'Failed to perform AI analysis' },
      { status: 500 }
    );
  }
}
