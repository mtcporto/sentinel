import { AppLayout } from '@/components/layout/AppLayout';
import { SystemMetricsWidget } from '@/components/dashboard/SystemMetricsWidget';
import { ServiceStatusWidget } from '@/components/dashboard/ServiceStatusWidget';
import { RecentLogsWidget } from '@/components/dashboard/RecentLogsWidget';
import { AlertsWidget } from '@/components/dashboard/AlertsWidget';

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="lg:col-span-2 xl:col-span-2">
          <SystemMetricsWidget />
        </div>
        <div className="lg:col-span-1 xl:col-span-2">
          <ServiceStatusWidget />
        </div>
        <div className="lg:col-span-3 xl:col-span-2">
          <RecentLogsWidget />
        </div>
        <div className="lg:col-span-3 xl:col-span-2">
          <AlertsWidget />
        </div>
      </div>
    </AppLayout>
  );
}
