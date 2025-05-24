import { AppLayout } from '@/components/layout/AppLayout';
import { AIDiagnosisClient } from '@/components/ai-diagnosis/AIDiagnosisClient';

export default function AIDiagnosisPage() {
  return (
    <AppLayout>
      <AIDiagnosisClient />
    </AppLayout>
  );
}
