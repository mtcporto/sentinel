// src/ai/flows/analyze-system-logs.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing system logs,
 * identifying anomalies, and providing insights into potential issues.
 *
 * - analyzeSystemLogs - Analyzes system logs and identifies potential issues.
 * - AnalyzeSystemLogsInput - The input type for the analyzeSystemLogs function.
 * - AnalyzeSystemLogsOutput - The output type for the analyzeSystemLogs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSystemLogsInputSchema = z.object({
  logs: z
    .string()
    .describe('The system logs to analyze.'),
});
export type AnalyzeSystemLogsInput = z.infer<typeof AnalyzeSystemLogsInputSchema>;

const AnalyzeSystemLogsOutputSchema = z.object({
  analysis: z.string().describe('An analysis of the system logs, identifying anomalies and potential issues.'),
  recommendations: z.string().describe('Recommendations for addressing the identified issues.'),
});
export type AnalyzeSystemLogsOutput = z.infer<typeof AnalyzeSystemLogsOutputSchema>;

export async function analyzeSystemLogs(input: AnalyzeSystemLogsInput): Promise<AnalyzeSystemLogsOutput> {
  return analyzeSystemLogsFlow(input);
}

const analyzeSystemLogsPrompt = ai.definePrompt({
  name: 'analyzeSystemLogsPrompt',
  input: {schema: AnalyzeSystemLogsInputSchema},
  output: {schema: AnalyzeSystemLogsOutputSchema},
  prompt: `You are an experienced system administrator. Analyze the provided system logs to identify anomalies and potential issues.

Logs:
{{logs}}

Provide a detailed analysis of the logs, highlighting any anomalies, errors, or suspicious activity.  Based on your analysis, provide clear and actionable recommendations for addressing the identified issues to ensure system stability.`,
});

const analyzeSystemLogsFlow = ai.defineFlow(
  {
    name: 'analyzeSystemLogsFlow',
    inputSchema: AnalyzeSystemLogsInputSchema,
    outputSchema: AnalyzeSystemLogsOutputSchema,
  },
  async input => {
    const {output} = await analyzeSystemLogsPrompt(input);
    return output!;
  }
);
