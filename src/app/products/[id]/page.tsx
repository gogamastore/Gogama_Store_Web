import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { products, type Product } from "@/lib/placeholders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import SmartProductSummary from "@/components/smart-product-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Package } from "lucide-react";

async function getProduct(id: string): Promise<Product | undefined> {
  return products.find((p) => p.id === id);
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <div className="aspect-video overflow-hidden rounded-lg border shadow-lg mb-4">
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={1200}
              height={800}
              className="object-cover w-full h-full"
              data-ai-hint={product.aiHint}
            />
          </div>
        </div>
        <div>
          <div className="flex flex-col h-full">
            <Badge variant="secondary" className="w-fit mb-2">
              {product.category}
            </Badge>
            <h1 className="text-4xl font-bold font-headline mb-2">{product.name}</h1>
            <p className="text-sm text-muted-foreground mb-4">SKU: {product.sku}</p>

            <div className="flex items-baseline gap-4 mb-6">
                <span className="text-4xl font-bold text-primary">${product.resellerPrice.toFixed(2)}</span>
                <span className="text-lg text-muted-foreground line-through">${product.price.toFixed(2)}</span>
            </div>

            <p className="text-foreground/80 mb-6">{product.description}</p>

            <div className="mt-auto pt-6">
              <div className="flex items-center gap-4 mb-4">
                  <Package className="w-5 h-5 text-muted-foreground"/>
                  <p className="text-muted-foreground">{product.stock} units in stock</p>
              </div>
              <Button size="lg" className="w-full">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <Separator className="my-12" />

      <div className="grid md:grid-cols-2 gap-12">
        <div>
            <h2 className="text-2xl font-bold font-headline mb-4">Specifications</h2>
            <p className="text-foreground/80 whitespace-pre-wrap">{product.specs}</p>

            <h2 className="text-2xl font-bold font-headline mt-8 mb-4">Shipping Information</h2>
            <p className="text-foreground/80">{product.shippingInfo}</p>
        </div>
        <div>
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <SmartProductSummary product={product} />
            </Suspense>
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
    return products.map((product) => ({
        id: product.id,
    }));
}
