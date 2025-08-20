import ProductCard from "@/components/product-card";
import { products } from "@/lib/placeholders";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold font-headline text-primary">
          Welcome to Toko Central
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Your one-stop shop for wholesale and reseller products.
        </p>
        <div className="mt-4">
          <Button asChild>
            <Link href="/admin/dashboard">Go to Admin Dashboard</Link>
          </Button>
        </div>
      </header>
      <section>
        <h2 className="text-3xl font-bold font-headline mb-6">Product Gallery</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
