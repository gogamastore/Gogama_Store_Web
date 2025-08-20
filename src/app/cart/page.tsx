import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

export default function CartPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart />
            Shopping Cart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the shopping cart page. Functionality to be added.</p>
        </CardContent>
      </Card>
    </div>
  );
}
