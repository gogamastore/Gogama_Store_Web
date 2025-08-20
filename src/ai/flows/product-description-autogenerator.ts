'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating rekeyed product descriptions and suggesting similar or related items.
 *
 * - generateProductDescription - A function that generates a product description and suggests related items.
 * - GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * - GenerateProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productSpecs: z.string().describe('The specifications of the product.'),
  shippingInfo: z.string().describe('The shipping information of the product.'),
  existingDescription: z.string().optional().describe('The existing description of the product, if any.'),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
  generatedDescription: z.string().describe('The rekeyed description of the product.'),
  suggestedItems: z.array(z.string()).describe('Suggested similar or related items.'),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

export async function generateProductDescription(input: GenerateProductDescriptionInput): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `You are an expert product description writer.

  You will generate a rekeyed description for the product, and suggest similar or related items.
  If an existing description is provided, improve upon it.

  Product Name: {{{productName}}}
  Product Specs: {{{productSpecs}}}
  Shipping Info: {{{shippingInfo}}}
  Existing Description: {{{existingDescription}}}

  Here is what the generated description should contain:
  - Key features and benefits
  - Technical specifications
  - Shipping information

  The suggested items should be a list of product names.
  `,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
