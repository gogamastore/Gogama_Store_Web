"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { createProductDescription } from "@/app/admin/products/autogenerator/actions";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Wand2 } from "lucide-react";

const formSchema = z.object({
  productName: z.string().min(3, "Product name is required"),
  productSpecs: z.string().min(10, "Product specs are required"),
  shippingInfo: z.string().min(5, "Shipping info is required"),
  existingDescription: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type GenerationResult = {
  generatedDescription: string;
  suggestedItems: string[];
};

export default function ProductAutogenForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      productSpecs: "",
      shippingInfo: "",
      existingDescription: "",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await createProductDescription(data);
      setResult(response);
      toast({
        title: "Success!",
        description: "Product description generated successfully.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate product description.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Product Details</CardTitle>
          <CardDescription>
            Enter product information to generate a new description.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="productName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Ergonomic Office Chair" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="productSpecs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Specs</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. Material: Mesh, Color: Black, Weight: 15kg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shippingInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Info</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Ships in 2-3 business days" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="existingDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Existing Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="If you have an existing description, paste it here to improve it."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Generated Content</CardTitle>
          <CardDescription>
            The AI-generated description and suggestions will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[400px]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p>AI is thinking...</p>
            </div>
          )}
          {!isLoading && !result && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Wand2 className="h-12 w-12 mb-4" />
              <p>Your results will be shown here.</p>
            </div>
          )}
          {result && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Generated Description:</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-secondary rounded-md whitespace-pre-wrap">
                  {result.generatedDescription}
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Suggested Related Items:</h3>
                <ul className="list-disc list-inside space-y-1">
                  {result.suggestedItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
