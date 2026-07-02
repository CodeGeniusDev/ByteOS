import { useState } from "react";
import type React from "react";
import { AppLayout } from "@/layouts/app-layout";
import { ChatPage } from "@/pages/chat";
import { DashboardPage } from "@/pages/dashboard";
import { SettingsPage } from "@/pages/settings";
import type { WorkbenchPage } from "@/types/navigation";

function App() {
  const [activePage, setActivePage] = useState<WorkbenchPage>("dashboard");

  const pages: Record<WorkbenchPage, React.ReactNode> = {
    dashboard: <DashboardPage />,
    chat: <ChatPage />,
    settings: <SettingsPage />,
  };

  return (
    <AppLayout activePage={activePage} onPageChange={setActivePage}>
      {pages[activePage]}
    </AppLayout>
  );
}

export default App;
