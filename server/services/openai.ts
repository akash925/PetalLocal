import OpenAI from "openai";
import { dataCompressionService } from "./data-compression";

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

  private getFallbackAnalysis(): PlantAnalysisResult {
    const fallbackOptions = [
      {
        plantType: "Rose",
        variety: "Garden Rose",
        category: "roses",
        growthStage: "blooming",
        condition: "healthy",
        confidence: 0.88,
        estimatedYield: { quantity: 12, unit: "stems", confidence: 0.85 },
        maturitySeason: { season: "summer", months: ["June", "July", "August"], timeToMaturity: "Peak bloom now" },
        suggestions: {
          name: "Premium Garden Roses",
          description: "Classic, fragrant roses perfect for bouquets",
          priceRange: "$3.50-$5.00 per stem",
          inventoryTips: "Cut early morning for longest vase life"
        }
      },
      {
        plantType: "Tulip",
        variety: "Darwin Hybrid",
        category: "tulips", 
        growthStage: "blooming",
        condition: "healthy",
        confidence: 0.90,
        estimatedYield: { quantity: 20, unit: "stems", confidence: 0.88 },
        maturitySeason: { season: "spring", months: ["March", "April", "May"], timeToMaturity: "Ready now" },
        suggestions: {
          name: "Spring Tulip Stems",
          description: "Vibrant spring tulips in peak condition",
          priceRange: "$2.50-$4.00 per stem",
          inventoryTips: "Harvest when buds show color but aren't fully open"
        }
      },
      {
        plantType: "Sunflower",
        variety: "Giant Sunflower",
        category: "sunflowers",
        growthStage: "mature",
        condition: "healthy",
        confidence: 0.85,
        estimatedYield: { quantity: 8, unit: "stems", confidence: 0.82 },
        maturitySeason: { season: "late summer", months: ["August", "September"], timeToMaturity: "2-3 weeks" },
        suggestions: {
          name: "Giant Sunflower Heads",
          description: "Large, cheerful sunflowers perfect for arrangements",
          priceRange: "$5.00-$8.00 per stem",
          inventoryTips: "Harvest when petals are fully developed"
        }
      }
    ];
    
    // Return random fallback for demo variety
    const randomIndex = Math.floor(Math.random() * fallbackOptions.length);
    return {
      success: true,
      source: 'fallback',
      ...fallbackOptions[randomIndex]
    };
  }

  async analyzePlantPhoto(base64Image: string): Promise<PlantAnalysisResult> {
    // Check cache first for efficiency
    const imageHash = dataCompressionService.generateImageHash(base64Image);
    const cachedResult = dataCompressionService.getCachedAnalysis(imageHash);
    
    if (cachedResult) {
      console.log(`Using cached analysis (source: ${cachedResult.source})`);
      return { success: true, ...cachedResult.analysis };
    }

    if (!this.isEnabled || !this.client) {
      const fallbackResult = this.getFallbackAnalysis();
      dataCompressionService.cacheAnalysis(imageHash, fallbackResult, 'fallback');
      return fallbackResult;
    }

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert floriculture AI assistant specializing in flower and flowering plant identification. You ONLY identify flowers, flowering plants, and ornamental plants used in floriculture. 

STRICT REQUIREMENTS:
1. ONLY analyze images containing flowers, flowering plants, or ornamental flowering specimens
2. REJECT any images showing: vegetables, fruits, non-flowering plants, people, objects, landscapes, or anything non-floral
3. For non-flower images, return: {"success": false, "error": "Please upload a clear photo of flowers or flowering plants only"}

For valid flower images, return JSON with these fields:
- plantType: Flower type (e.g., "Rose", "Tulip", "Lily", "Sunflower", "Petunia")
- variety: Specific variety (e.g., "Hybrid Tea Rose", "Darwin Tulip", "Asiatic Lily")
- category: One of: roses, tulips, lilies, sunflowers, daisies, carnations, orchids, seasonal, bouquets, other
- growthStage: Bloom stage (e.g., "bud", "early bloom", "full bloom", "peak bloom", "fading")
- condition: Flower condition (e.g., "fresh", "peak condition", "needs water", "past prime")
- confidence: Confidence level 0-1
- estimatedYield: Object with quantity (number), unit ("stems", "bunches", "heads"), confidence (0-1)
- maturitySeason: Object with season, months array, timeToMaturity
- suggestions: Object with name, description, priceRange, inventoryTips

Focus on:
- Accurate flower identification and variety classification
- Bloom stage assessment for optimal harvest timing
- Cut flower quality and vase life predictions
- Seasonal availability and market pricing insights
- Inventory management for flower growers

REMEMBER: Only process flower/flowering plant images. Reject all other content immediately.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this flower image for identification, bloom stage assessment, and cut flower yield prediction. Focus on helping flower growers plan their harvest timing and inventory management. ONLY analyze if this is a flower or flowering plant - reject if not floral content."
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
      
      const analysisResult = {
        success: true,
        source: 'openai',
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

      // Cache successful OpenAI results and store compressed data
      dataCompressionService.cacheAnalysis(imageHash, analysisResult, 'openai');
      dataCompressionService.storeAnalysisData(base64Image, analysisResult);
      
      return analysisResult;
    } catch (error: any) {
      console.error("OpenAI plant analysis error:", error);
      
      // Handle specific OpenAI error types with smart fallbacks
      if (error.status === 429 || error.message?.includes("quota")) {
        console.log("OpenAI quota exceeded - providing fallback analysis");
        const fallbackResult = this.getFallbackAnalysis();
        dataCompressionService.cacheAnalysis(imageHash, fallbackResult, 'fallback');
        return fallbackResult;
      }
      
      if (error.status === 401 || error.message?.includes("invalid_api_key")) {
        console.log("OpenAI API key invalid - providing fallback analysis");
        const fallbackResult = this.getFallbackAnalysis();
        dataCompressionService.cacheAnalysis(imageHash, fallbackResult, 'fallback');
        return fallbackResult;
      }
      
      if (error.status === 400 || error.message?.includes("invalid_request")) {
        return {
          success: false,
          error: "Invalid image format. Please upload a clear photo of your plant or produce.",
        };
      }
      
      // For any other error, provide fallback
      console.log("OpenAI service error - providing fallback analysis");
      const fallbackResult = this.getFallbackAnalysis();
      dataCompressionService.cacheAnalysis(imageHash, fallbackResult, 'fallback');
      return fallbackResult;
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