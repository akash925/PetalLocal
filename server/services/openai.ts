import OpenAI from "openai";

interface PlantAnalysisResult {
  success: boolean;
  plantType?: string;
  variety?: string;
  category?: string;
  growthStage?: string;
  estimatedYield?: {
    quantity: number;
    unit: string;
    confidence: number;
  };
  maturitySeason?: {
    season: string;
    months: string[];
    timeToMaturity: string;
  };
  condition?: string;
  confidence?: number;
  suggestions?: {
    name?: string;
    description?: string;
    priceRange?: string;
    inventoryTips?: string;
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
            content: `You are an expert agricultural AI assistant specializing in plant and produce identification with predictive harvest capabilities. Analyze the provided image and identify the plant/produce with high accuracy, focusing on growth stage analysis and yield predictions.

Return your analysis in JSON format with these fields:
- plantType: The main type of plant/produce (e.g., "tomato", "apple", "lettuce")
- variety: Specific variety if identifiable (e.g., "cherry tomato", "honeycrisp apple")
- category: One of: vegetables, fruits, herbs, grains, nuts, other
- growthStage: Current growth stage (e.g., "seedling", "flowering", "fruiting", "mature", "harvest ready")
- condition: Current condition (e.g., "healthy", "ripe", "needs water", "pest damage")
- confidence: Confidence level 0-1
- estimatedYield: Object with quantity (number), unit (string), confidence (0-1)
- maturitySeason: Object with season (string), months (array), timeToMaturity (string)
- suggestions: Object with name, description, priceRange, inventoryTips

For growth stage analysis:
- Identify if plant is in early growth (seedling, vegetative), reproductive (flowering, fruiting), or harvest stages
- Estimate potential yield based on plant size, health, and fruit/vegetable count visible
- Predict seasonal maturity timing and harvest windows
- Provide inventory management suggestions for farmers

Focus on practical farming insights and accurate yield predictions.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this plant image for identification, growth stage assessment, and yield prediction. Focus on helping farmers plan their inventory and harvest timing."
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
        max_tokens: 1500,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        success: true,
        plantType: result.plantType,
        variety: result.variety,
        category: result.category,
        growthStage: result.growthStage,
        condition: result.condition,
        confidence: result.confidence,
        estimatedYield: result.estimatedYield,
        maturitySeason: result.maturitySeason,
        suggestions: result.suggestions,
      };
    } catch (error: any) {
      console.error("OpenAI plant analysis error:", error);
      
      // Handle specific OpenAI error types
      if (error.status === 429 || error.message?.includes("quota")) {
        return {
          success: false,
          error: "OpenAI usage quota exceeded. Please check your billing settings or try again later.",
        };
      }
      
      if (error.status === 401 || error.message?.includes("invalid_api_key")) {
        return {
          success: false,
          error: "OpenAI API key is invalid. Please check your configuration.",
        };
      }
      
      if (error.status === 400 || error.message?.includes("invalid_request")) {
        return {
          success: false,
          error: "Invalid image format. Please upload a clear photo of your plant or produce.",
        };
      }
      
      return {
        success: false,
        error: "Failed to analyze plant image. Please try again.",
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
      
      // Handle specific OpenAI error types
      if (error.status === 429 || error.message?.includes("quota")) {
        return {
          success: false,
          error: "OpenAI usage quota exceeded. Please check your billing settings or try again later.",
        };
      }
      
      if (error.status === 401 || error.message?.includes("invalid_api_key")) {
        return {
          success: false,
          error: "OpenAI API key is invalid. Please check your configuration.",
        };
      }
      
      if (error.status === 400 || error.message?.includes("invalid_request")) {
        return {
          success: false,
          error: "Invalid image format. Please upload a clear photo of your produce.",
        };
      }
      
      return {
        success: false,
        error: "Failed to estimate inventory. Please try again.",
      };
    }
  }
}

export const openaiService = new OpenAIService();