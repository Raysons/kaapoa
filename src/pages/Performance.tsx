import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function Performance() {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">Performance Analytics</CardTitle>
              <CardDescription className="text-muted-foreground">
                Detailed supplier performance analytics and reports coming soon.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We're working on bringing you powerful insights into your suppliers' performance.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
