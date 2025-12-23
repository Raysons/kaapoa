import { Bell, Calendar, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title?: string;
  showSearch?: boolean;
}

export function DashboardHeader({ title = "Hello, araysondesign", showSearch = true }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
      </div>
      
      <div className="flex items-center gap-3">
        {showSearch && (
          <div className="relative hidden w-64 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="h-9 pl-10 bg-muted/50"
            />
          </div>
        )}
        
        <Button variant="outline" size="sm" className="hidden gap-2 sm:flex">
          <Calendar className="h-4 w-4 text-accent" />
          Today
          <ChevronDown className="h-3 w-3" />
        </Button>
        
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            2
          </span>
        </Button>
      </div>
    </header>
  );
}
