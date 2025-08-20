"use server";

import {
  generateProductDescription,
  type GenerateProductDescriptionInput,
  type GenerateProductDescriptionOutput,
} from "@/ai/flows/product-description-autogenerator";

export async function createProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  try {
    const result = await generateProductDescription(input);
    return result;
  } catch (error) {
    console.error("Error generating product description:", error);
    throw new Error("Failed to generate description via AI flow.");
  }
}
