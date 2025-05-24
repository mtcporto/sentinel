import { AppLayout } from '@/components/layout/AppLayout';
import { ActionHistoryClient } from '@/components/action-history/ActionHistoryClient';

export default function ActionHistoryPage() {
  return (
    <AppLayout>
      <ActionHistoryClient />
    </AppLayout>
  );
}
