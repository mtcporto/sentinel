import { AppLayout } from '@/components/layout/AppLayout';
import { LogAnalysisClient } from '@/components/log-analysis/LogAnalysisClient';

export default function LogAnalysisPage() {
  return (
    <AppLayout>
      <LogAnalysisClient />
    </AppLayout>
  );
}
