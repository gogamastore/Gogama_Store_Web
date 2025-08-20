import ProductAutogenForm from "@/components/product-autogen-form";

export default function AutogeneratorPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Product Description Autogenerator</h2>
      </div>
      <p className="text-muted-foreground">
        Use AI to automatically generate compelling product descriptions and suggest related items.
      </p>
      <div className="mt-6">
        <ProductAutogenForm />
      </div>
    </div>
  );
}
