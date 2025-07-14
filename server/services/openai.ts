import OpenAI from "openai";

interface PlantAnalysisResult {
  success: boolean;
  plantType?: string;
  variety?: string;
  category?: string;
  estimatedQuantity?: number;
  condition?: string;
  confidence?: number;
  suggestions?: {
    name?: string;
    description?: string;
    priceRange?: string;
    harvestTips?: string;
  };
  error?: string;
}

interface InventoryEstimation {
  success: boolean;
  estimatedQuantity?: number;
  unit?: string;
  confidence?: number;
  analysisNotes?: string;
  error?: string;
}

class OpenAIService {
  private client: OpenAI | null = null;
  private isEnabled: boolean = false;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.isEnabled = true;
    } else {
      console.warn("OpenAI API key not found. Photo recognition features will be disabled.");
    }
  }

  async analyzePlantPhoto(base64Image: string): Promise<PlantAnalysisResult> {
    if (!this.isEnabled || !this.client) {
      return {
        success: false,
        error: "OpenAI service not configured. Please provide an API key to enable photo recognition.",
      };
    }

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert agricultural AI assistant specializing in plant and produce identification. Analyze the provided image and identify the plant/produce with high accuracy. 

Return your analysis in JSON format with these fields:
- plantType: The main type of plant/produce (e.g., "tomato", "apple", "lettuce")
- variety: Specific variety if identifiable (e.g., "cherry tomato", "honeycrisp apple")
- category: One of: vegetables, fruits, herbs, grains, dairy, other
- condition: Current condition (e.g., "ripe", "fresh", "needs harvesting")
- confidence: Confidence level 0-1
- suggestions: Object with name, description, priceRange, harvestTips

Focus on accuracy and provide detailed observations.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this plant/produce image and provide detailed identification information."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        success: true,
        plantType: result.plantType,
        variety: result.variety,
        category: result.category,
        condition: result.condition,
        confidence: result.confidence,
        suggestions: result.suggestions,
      };
    } catch (error: any) {
      console.error("OpenAI plant analysis error:", error);
      
      // Handle quota exceeded error gracefully
      if (error.status === 429) {
        return {
          success: false,
          error: "OpenAI usage quota exceeded. Please check your billing settings or try again later.",
        };
      }
      
      return {
        success: false,
        error: `Failed to analyze plant photo: ${error.message}`,
      };
    }
  }

  async estimateInventoryFromPhoto(base64Image: string): Promise<InventoryEstimation> {
    if (!this.isEnabled || !this.client) {
      return {
        success: false,
        error: "OpenAI service not configured. Please provide an API key to enable inventory estimation.",
      };
    }

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert agricultural inventory estimator. Analyze the provided image of plants, trees, or produce and estimate the quantity available for harvest or sale.

Return your analysis in JSON format with these fields:
- estimatedQuantity: Numerical estimate of items/weight
- unit: Appropriate unit (lb, kg, each, bunch, dozen, pint, quart, bag, box)
- confidence: Confidence level 0-1
- analysisNotes: Detailed notes about your estimation process

Consider factors like:
- Plant maturity and harvest readiness
- Visible fruit/vegetable count
- Tree/plant size and typical yield
- Seasonal factors
- Quality assessment

Be conservative but realistic in estimates.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this image and estimate the quantity of produce available for harvest or sale."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        success: true,
        estimatedQuantity: result.estimatedQuantity,
        unit: result.unit,
        confidence: result.confidence,
        analysisNotes: result.analysisNotes,
      };
    } catch (error: any) {
      console.error("OpenAI inventory estimation error:", error);
      return {
        success: false,
        error: `Failed to estimate inventory: ${error.message}`,
      };
    }
  }
}

export const openaiService = new OpenAIService();