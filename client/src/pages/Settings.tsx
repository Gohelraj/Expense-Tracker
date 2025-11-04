import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BankPatternsManager from "@/components/BankPatternsManager";
import CategoryManager from "@/components/CategoryManager";

export default function Settings() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your expense tracker configuration</p>
        </div>

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="banks">Bank Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-6">
            <CategoryManager />
          </TabsContent>

          <TabsContent value="banks" className="mt-6">
            <BankPatternsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
