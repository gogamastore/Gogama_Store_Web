import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <BarChart3 />
            Inventory Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the inventory management page. Functionality to be added.</p>
        </CardContent>
      </Card>
    </div>
  );
}
