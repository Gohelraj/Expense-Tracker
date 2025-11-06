import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BankPatternsManager from "@/components/BankPatternsManager";
import GmailIntegration from "@/components/GmailIntegration";
import EmailParserTest from "@/components/EmailParserTest";

export default function Settings() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your expense tracker configuration</p>
        </div>

        <Tabs defaultValue="gmail" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="gmail">Gmail Integration</TabsTrigger>
            <TabsTrigger value="patterns">Bank Patterns</TabsTrigger>
            <TabsTrigger value="test">Test Parser</TabsTrigger>
          </TabsList>

          <TabsContent value="gmail" className="mt-6">
            <GmailIntegration />
          </TabsContent>

          <TabsContent value="patterns" className="mt-6">
            <BankPatternsManager />
          </TabsContent>

          <TabsContent value="test" className="mt-6">
            <EmailParserTest />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
