import { Settings, Database, Users, FileText, Palette } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/knowledge/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const SettingsPage = () => {
  return (
    <MainLayout>
      <div className="p-6 max-w-3xl mx-auto fade-in">
        <PageHeader
          title="Settings"
          description="Configure your knowledge base"
          icon={<Settings className="w-5 h-5 text-muted-foreground" />}
          showAddButton={false}
        />

        <div className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Database className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">Data Sources</CardTitle>
                  <CardDescription>Connect external data sources</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://www.google.com/drive/images/drive/logo-drive.png" 
                      alt="Google Drive" 
                      className="w-6 h-6"
                    />
                    <div>
                      <p className="text-sm font-medium">Google Drive</p>
                      <p className="text-xs text-muted-foreground">Import documents from Drive</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-yellow-400 rounded flex items-center justify-center text-xs font-bold">M</div>
                    <div>
                      <p className="text-sm font-medium">Miro</p>
                      <p className="text-xs text-muted-foreground">Import boards and content</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">Team</CardTitle>
                  <CardDescription>Manage team access and roles</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Invite team members to collaborate on the knowledge base.
              </p>
              <Button variant="outline" size="sm">Manage Team</Button>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">Templates</CardTitle>
                  <CardDescription>Manage offer templates and tone of voice</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure templates for offer writing and define your brand voice.
              </p>
              <Button variant="outline" size="sm">Manage Templates</Button>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Palette className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">Style Guides</CardTitle>
                  <CardDescription>Define visual and brand guidelines</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage style guides, brand assets, and visual standards for consistent outputs.
              </p>
              <Button variant="outline" size="sm">Manage Style Guides</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
