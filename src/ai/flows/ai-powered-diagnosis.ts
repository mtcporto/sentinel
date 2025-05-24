'use server';
/**
 * @fileOverview An AI-powered system diagnosis agent.
 *
 * - aiPoweredDiagnosis - A function that handles the system diagnosis process.
 * - AIPoweredDiagnosisInput - The input type for the aiPoweredDiagnosis function.
 * - AIPoweredDiagnosisOutput - The return type for the aiPoweredDiagnosis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIPoweredDiagnosisInputSchema = z.object({
  systemStatus: z
    .string()
    .describe('The current status of the system, including CPU, memory, and disk usage.'),
  recentLogs: z.string().describe('The recent system logs.'),
  actionHistory: z.string().describe('The history of actions performed on the system.'),
});
export type AIPoweredDiagnosisInput = z.infer<typeof AIPoweredDiagnosisInputSchema>;

const AIPoweredDiagnosisOutputSchema = z.object({
  diagnosis: z.string().describe('The diagnosis of the system health.'),
  suggestedActions: z.string().describe('The suggested actions to resolve any issues.'),
});
export type AIPoweredDiagnosisOutput = z.infer<typeof AIPoweredDiagnosisOutputSchema>;

export async function aiPoweredDiagnosis(input: AIPoweredDiagnosisInput): Promise<AIPoweredDiagnosisOutput> {
  return aiPoweredDiagnosisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiPoweredDiagnosisPrompt',
  input: {schema: AIPoweredDiagnosisInputSchema},
  output: {schema: AIPoweredDiagnosisOutputSchema},
  prompt: `You are an expert system administrator specializing in diagnosing system issues.

You will use the provided system status, recent logs, and action history to diagnose the system and suggest actions to resolve any issues.

System Status: {{{systemStatus}}}
Recent Logs: {{{recentLogs}}}
Action History: {{{actionHistory}}}

Diagnosis:
Suggested Actions:`, // Removed extraneous backticks
});

const aiPoweredDiagnosisFlow = ai.defineFlow(
  {
    name: 'aiPoweredDiagnosisFlow',
    inputSchema: AIPoweredDiagnosisInputSchema,
    outputSchema: AIPoweredDiagnosisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
