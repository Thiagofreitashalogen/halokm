import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/knowledge/PageHeader';
import { UserCircle } from 'lucide-react';

const PeoplePage = () => {
  return (
    <MainLayout>
      <div className="flex-1 p-6">
        <PageHeader
          title="People"
          description="Team members and contacts"
          icon={<UserCircle className="w-5 h-5" />}
          showAddButton={false}
        />
        
        <div className="mt-8 text-center text-muted-foreground">
          <UserCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>People management coming soon</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default PeoplePage;
