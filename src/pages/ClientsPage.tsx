import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/knowledge/PageHeader';
import { Users } from 'lucide-react';

const ClientsPage = () => {
  return (
    <MainLayout>
      <div className="flex-1 p-6">
        <PageHeader
          title="Clients"
          description="Manage your client relationships and history"
          icon={<Users className="w-5 h-5" />}
          showAddButton={false}
        />
        
        <div className="mt-8 text-center text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Client management coming soon</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default ClientsPage;
