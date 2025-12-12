// app/fee-management/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilePlus, HandCoins, BarChart3 } from "lucide-react";

export default function FeeHomePage() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Fee Structure</CardTitle>
          <FilePlus className="w-6 h-6 text-blue-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Define and manage different types of fees.
          </p>
          <Button onClick={() => router.push("/fee-management/structure")}>
            Go to Setup
          </Button>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Collect Fees</CardTitle>
          <HandCoins className="w-6 h-6 text-green-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Record student fee payments.
          </p>
          <Button onClick={() => router.push("/fee-management/collect")}>
            Go to Collection
          </Button>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Dues & Reports</CardTitle>
          <BarChart3 className="w-6 h-6 text-orange-500" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            View outstanding dues and payment history.
          </p>
          <Button onClick={() => router.push("/fee-management/reports")}>
            View Reports
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
