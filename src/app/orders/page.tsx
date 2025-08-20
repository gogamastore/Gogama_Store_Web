import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { History } from "lucide-react";

export default function OrdersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History />
            My Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the order history page. Functionality to be added.</p>
        </CardContent>
      </Card>
    </div>
  );
}
