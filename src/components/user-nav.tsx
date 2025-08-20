import { generateProductSummary } from "@/ai/flows/smart-product-summary";
import type { Product } from "@/lib/placeholders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";

interface SmartProductSummaryProps {
  product: Product;
}

export default async function SmartProductSummary({
  product,
}: SmartProductSummaryProps) {
  const { summary } = await generateProductSummary({
    productName: product.name,
    productSpecs: product.specs,
    shippingInfo: product.shippingInfo,
  });

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-primary">
          <Bot className="h-6 w-6" />
          <span>Smart Product Summary</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-foreground/90">{summary}</p>
      </CardContent>
    </Card>
  );
}
