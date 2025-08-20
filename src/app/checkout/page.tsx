import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard />
            Checkout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the checkout page. Functionality to be added.</p>
        </CardContent>
      </Card>
    </div>
  );
}
