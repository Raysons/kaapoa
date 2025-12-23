import { ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  showSearch?: boolean;
}

export function DashboardLayout({ children, title, showSearch = true }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-64 transition-all duration-300 ease-in-out">
        <DashboardHeader title={title} showSearch={showSearch} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
