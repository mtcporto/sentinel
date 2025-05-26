import { AppLayout } from '@/components/layout/AppLayout';
import SystemConsolidatedWidget from '@/components/dashboard/SystemConsolidatedWidget';
import { ServiceStatusWidget } from '@/components/dashboard/ServiceStatusWidget';
import { AlertsWidget } from '@/components/dashboard/AlertsWidget';
import { NetworkOverviewWidget } from '@/components/dashboard/NetworkOverviewWidget';
import { SecurityOverviewWidget } from '@/components/dashboard/SecurityOverviewWidget';

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Primeira linha - Sistema Consolidado */}
        <div className="lg:col-span-3 xl:col-span-2">
          <SystemConsolidatedWidget />
        </div>
        <div className="lg:col-span-1 xl:col-span-2">
          <ServiceStatusWidget />
        </div>
        
        {/* Segunda linha - Rede e Segurança */}
        <div className="lg:col-span-3 xl:col-span-2">
          <NetworkOverviewWidget />
        </div>
        <div className="lg:col-span-3 xl:col-span-2">
          <SecurityOverviewWidget />
        </div>
        
        {/* Terceira linha - Alertas e Logs Consolidados */}
        <div className="lg:col-span-3 xl:col-span-4">            <AlertsWidget />
        </div>
      </div>
    </AppLayout>
  );
}
