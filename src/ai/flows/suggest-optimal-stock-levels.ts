
'use server';

/**
 * @fileOverview An AI-powered tool that analyzes historical sales data for a specific product
 * to forecast demand and suggest optimal stock levels. This flow now uses a structured tool
 * for data analysis to provide more reliable and accurate suggestions.
 *
 * - suggestOptimalStockLevels - A function that handles the stock level suggestion process.
 * - SuggestOptimalStockLevelsInput - The input type for the suggestOptimalStockLevels function.
 * - SuggestOptimalStockLevelsOutput - The return type for the suggestOptimalStockLevels function.
 */

import {ai} from '@/ai/genkit';
import {parse, differenceInDays, format} from 'date-fns';
import { SuggestOptimalStockLevelsInput, SuggestOptimalStockLevelsInputSchema, SuggestOptimalStockLevelsOutput, SuggestOptimalStockLevelsOutputSchema, AnalysisResultSchema } from '@/ai/schemas/stock-suggestion-schemas';

// SECTION: AI Tool for Sales Analysis

/**
 * An AI-callable tool that performs a statistical analysis of sales data.
 * This function is not called directly from the app, but by the Genkit flow.
 */
const analyzeSalesDataTool = ai.defineTool(
    {
        name: 'analyzeSalesData',
        description: 'Analyzes raw sales data to extract trends, totals, and peak periods.',
        inputSchema: SuggestOptimalStockLevelsInputSchema,
        outputSchema: AnalysisResultSchema,
    },
    async (input) => {
        const { salesData } = input;
        if (!salesData || salesData.length === 0) {
            return { totalSold: 0, salesTrend: "no_data", peakDays: [], averageDailySales: 0 };
        }

        const totalSold = salesData.reduce((sum, item) => sum + item.quantity, 0);

        const salesByDay: Record<string, number> = {};
        salesData.forEach(item => {
            salesByDay[item.orderDate] = (salesByDay[item.orderDate] || 0) + item.quantity;
        });
        
        const sortedDays = Object.keys(salesByDay).sort();
        const firstDay = parse(sortedDays[0], 'yyyy-MM-dd', new Date());
        const lastDay = parse(sortedDays[sortedDays.length - 1], 'yyyy-MM-dd', new Date());
        const periodInDays = differenceInDays(lastDay, firstDay) + 1;
        const averageDailySales = totalSold / periodInDays;

        // Simplified trend analysis
        let salesTrend = "stable";
        if (sortedDays.length > 1) {
            const firstHalfTotal = sortedDays.slice(0, Math.floor(sortedDays.length / 2)).reduce((sum, day) => sum + salesByDay[day], 0);
            const secondHalfTotal = sortedDays.slice(Math.floor(sortedDays.length / 2)).reduce((sum, day) => sum + salesByDay[day], 0);
            if (secondHalfTotal > firstHalfTotal * 1.2) salesTrend = "increasing";
            if (secondHalfTotal < firstHalfTotal * 0.8) salesTrend = "decreasing";
        }
        
        // Find peak sales days
        const peakDays = Object.entries(salesByDay)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([day, quantity]) => `${format(parse(day, 'yyyy-MM-dd', new Date()), 'dd MMM')}: ${quantity} units`);

        return {
            totalSold,
            salesTrend,
            peakDays,
            averageDailySales,
        };
    }
);


// SECTION: Main AI Flow

const suggestStockFlow = ai.defineFlow(
  {
    name: 'suggestOptimalStockLevelsFlow',
    inputSchema: SuggestOptimalStockLevelsInputSchema,
    outputSchema: SuggestOptimalStockLevelsOutputSchema,
    // Add the tool to the flow's capabilities
    tools: [analyzeSalesDataTool],
  },
  async (input) => {
    
    // The prompt is now much simpler. It acts as an expert interpreting pre-analyzed data.
    const llmResponse = await ai.generate({
      prompt: `You are an expert inventory management AI.
        Your task is to provide a stock level suggestion based on the analysis of historical sales data.

        Here is the situation for the product "{{productName}}":
        - Current Stock: {{currentStock}}
        - Sales Period Analyzed: Last {{analysisPeriod}}

        A tool has analyzed the sales data and provided the following summary. Use this as your primary source of truth.
        - Use the 'analyzeSalesData' tool with the provided input to get the analysis.

        Based on the tool's output, your task is to:
        1.  **Formulate a stock suggestion:**
            -   **Suggested Stock for Next Period:** Calculate a specific number of units to stock. Factor in the average daily sales, the trend, and add a buffer. A good starting point is (averageDailySales * 30) + safety stock.
            -   **Safety Stock:** Recommend a buffer quantity. This should be higher for products with increasing or sporadic trends. A good baseline is 25% of the next period's stock.
        2.  **Provide Reasoning:** Write a clear, step-by-step explanation for your suggestions. Explain how the trend, total sales, and peak days from the analysis influenced your final numbers.
        
        Return the entire response in the required JSON format.`,
      model: 'googleai/gemini-2.0-flash',
      // Pass the necessary information for the tool and the prompt.
      context: {
        productName: input.productName,
        currentStock: input.currentStock,
        analysisPeriod: input.analysisPeriod,
        salesData: input.salesData,
      },
      // Specify the desired output schema
      output: {
        schema: SuggestOptimalStockLevelsOutputSchema,
      },
    });

    const output = llmResponse.output;
    if (!output) {
      throw new Error("AI failed to generate a valid stock suggestion.");
    }

    return output;
  }
);


/**
 * Public-facing function to call the Genkit flow.
 * @param input The input data for the AI flow.
 * @returns A promise that resolves to the AI's suggestion.
 */
export async function suggestOptimalStockLevels(
  input: SuggestOptimalStockLevelsInput
): Promise<SuggestOptimalStockLevelsOutput> {
  return suggestStockFlow(input);
}
