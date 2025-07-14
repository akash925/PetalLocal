import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, Lightbulb } from "lucide-react";

interface PhotoAnalyzerProps {
  onAnalysisComplete?: (analysis: PlantAnalysis) => void;
  onInventoryEstimate?: (estimate: InventoryEstimate) => void;
  mode?: "plant-identification" | "inventory-estimation";
}

interface PlantAnalysis {
  plantType?: string;
  variety?: string;
  category?: string;
  condition?: string;
  confidence?: number;
  suggestions?: {
    name?: string;
    description?: string;
    priceRange?: string;
    harvestTips?: string;
  };
}

interface InventoryEstimate {
  estimatedQuantity?: number;
  unit?: string;
  confidence?: number;
  analysisNotes?: string;
}

export function PhotoAnalyzer({ 
  onAnalysisComplete, 
  onInventoryEstimate, 
  mode = "plant-identification" 
}: PhotoAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PlantAnalysis | null>(null);
  const [inventory, setInventory] = useState<InventoryEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const convertToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix to get just the base64 string
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const analyzePhoto = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError("Please upload a valid image file.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setInventory(null);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Convert to base64
      const base64Image = await convertToBase64(file);

      if (mode === "plant-identification") {
        const response = await apiRequest("POST", "/api/analyze-plant", {
          image: base64Image,
        });

        if (response.success) {
          setAnalysis({
            plantType: response.plantType,
            variety: response.variety,
            category: response.category,
            condition: response.condition,
            confidence: response.confidence,
            suggestions: response.suggestions,
          });
          onAnalysisComplete?.(response);
          
          toast({
            title: "Plant identified!",
            description: `Detected: ${response.plantType}${response.variety ? ` (${response.variety})` : ''}`,
          });
        } else {
          setError(response.error || "Failed to analyze plant photo");
        }
      } else {
        const response = await apiRequest("POST", "/api/estimate-inventory", {
          image: base64Image,
        });

        if (response.success) {
          setInventory({
            estimatedQuantity: response.estimatedQuantity,
            unit: response.unit,
            confidence: response.confidence,
            analysisNotes: response.analysisNotes,
          });
          onInventoryEstimate?.(response);
          
          toast({
            title: "Inventory estimated!",
            description: `Estimated: ${response.estimatedQuantity} ${response.unit}`,
          });
        } else {
          setError(response.error || "Failed to estimate inventory");
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis");
    } finally {
      setIsAnalyzing(false);
    }
  }, [mode, convertToBase64, onAnalysisComplete, onInventoryEstimate, toast]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      analyzePhoto(file);
    }
  }, [analyzePhoto]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      analyzePhoto(file);
    }
  }, [analyzePhoto]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {mode === "plant-identification" ? "Plant Identification" : "Inventory Estimation"}
          </CardTitle>
          <CardDescription>
            {mode === "plant-identification" 
              ? "Upload a photo to automatically identify plants and populate form fields"
              : "Upload a photo to estimate available quantities for inventory management"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="photo-upload"
              disabled={isAnalyzing}
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                {isAnalyzing ? (
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isAnalyzing ? "Analyzing..." : "Upload a photo"}
                </p>
                <p className="text-sm text-gray-500">
                  Drag and drop or click to select an image
                </p>
              </div>
            </label>
          </div>

          {imagePreview && (
            <div className="mt-4">
              <img
                src={imagePreview}
                alt="Uploaded preview"
                className="max-w-full h-48 object-cover rounded-lg border"
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {analysis && mode === "plant-identification" && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-green-700">Plant Identified</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Plant Type</p>
                  <p className="text-lg">{analysis.plantType}</p>
                </div>
                
                {analysis.variety && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Variety</p>
                    <p className="text-lg">{analysis.variety}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Category</p>
                  <Badge variant="outline">{analysis.category}</Badge>
                </div>
                
                {analysis.condition && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Condition</p>
                    <Badge variant="secondary">{analysis.condition}</Badge>
                  </div>
                )}
              </div>

              {analysis.confidence && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${analysis.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">{Math.round(analysis.confidence * 100)}%</span>
                  </div>
                </div>
              )}

              {analysis.suggestions && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-500" />
                    <h4 className="font-medium text-blue-900">Suggestions</h4>
                  </div>
                  
                  {analysis.suggestions.name && (
                    <p><strong>Suggested Name:</strong> {analysis.suggestions.name}</p>
                  )}
                  
                  {analysis.suggestions.description && (
                    <p><strong>Description:</strong> {analysis.suggestions.description}</p>
                  )}
                  
                  {analysis.suggestions.priceRange && (
                    <p><strong>Price Range:</strong> {analysis.suggestions.priceRange}</p>
                  )}
                  
                  {analysis.suggestions.harvestTips && (
                    <p><strong>Harvest Tips:</strong> {analysis.suggestions.harvestTips}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {inventory && mode === "inventory-estimation" && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-green-700">Inventory Estimated</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Estimated Quantity</p>
                  <p className="text-2xl font-bold text-green-600">
                    {inventory.estimatedQuantity} {inventory.unit}
                  </p>
                </div>
                
                {inventory.confidence && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Confidence</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${inventory.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{Math.round(inventory.confidence * 100)}%</span>
                    </div>
                  </div>
                )}
              </div>

              {inventory.analysisNotes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Analysis Notes</h4>
                  <p className="text-sm text-gray-700">{inventory.analysisNotes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}