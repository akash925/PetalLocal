import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { compressImage, validateImageFile } from "@/lib/image-utils";
import { 
  Upload, 
  Camera, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Brain,
  TrendingUp,
  Calendar,
  DollarSign,
  Zap,
  Target
} from "lucide-react";

interface FlowerAnalysisResult {
  success: boolean;
  source?: string;
  plantType?: string;
  variety?: string;
  category?: string;
  growthStage?: string;
  condition?: string;
  confidence?: number;
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
  suggestions?: {
    name?: string;
    description?: string;
    priceRange?: string;
    inventoryTips?: string;
  };
  error?: string;
}

interface FlowerIdentificationWidgetProps {
  onAnalysisComplete?: (analysis: FlowerAnalysisResult) => void;
  onImageSelect?: (imageUrl: string) => void;
  showFormFilling?: boolean;
  className?: string;
}

export function FlowerIdentificationWidget({
  onAnalysisComplete,
  onImageSelect,
  showFormFilling = true,
  className = ""
}: FlowerIdentificationWidgetProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FlowerAnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setAnalysis(null);
    
    try {
      // Validate image file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid image file');
      }

      // Compress image
      const result = await compressImage(file, 1200, 0.8);
      if (!result.isValid) {
        throw new Error(result.error || 'Image compression failed');
      }

      setSelectedImage(result.compressedImage);
      if (onImageSelect) {
        onImageSelect(result.compressedImage);
      }

      toast({
        title: "Image uploaded successfully",
        description: `Compressed by ${result.compressionRatio.toFixed(1)}% for optimal analysis`,
      });

      // Start AI analysis immediately
      setIsAnalyzing(true);
      try {
        const base64Image = result.compressedImage.split(',')[1];
        const response = await fetch("/api/analyze-plant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        });
        
        const analysisData = await response.json();
        setAnalysis(analysisData);
        
        if (onAnalysisComplete) {
          onAnalysisComplete(analysisData);
        }

        if (analysisData.success) {
          const sourceText = analysisData.source === 'fallback' ? ' (Demo Mode)' : '';
          toast({
            title: "AI Analysis Complete",
            description: `Identified: ${analysisData.plantType || 'Unknown flower'}${sourceText}`,
          });
        } else {
          throw new Error(analysisData.error || 'Analysis failed');
        }
      } catch (error) {
        console.error("AI Analysis error:", error);
        toast({
          title: "Analysis failed",
          description: "Unable to analyze flower. Please try again with a clear flower photo.",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [onImageSelect, onAnalysisComplete, toast]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
  }, []);

  const resetWidget = () => {
    setSelectedImage(null);
    setAnalysis(null);
    setIsAnalyzing(false);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className={`${className} border-2 border-tiffany/20 shadow-xl hover:shadow-2xl transition-all duration-300`}>
      <CardHeader className="bg-gradient-to-r from-tiffany/5 to-tiffany/10">
        <CardTitle className="flex items-center gap-3 text-xl luxury-heading">
          <div className="w-8 h-8 rounded-lg bg-tiffany flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          AI Flower Identification
          <Badge variant="secondary" className="ml-auto">
            <Zap className="w-3 h-3 mr-1" />
            Powered by GPT-4o
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Upload Section */}
        {!selectedImage ? (
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              dragActive
                ? 'border-tiffany bg-tiffany/5'
                : 'border-gray-300 hover:border-tiffany/50 hover:bg-tiffany/2'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-tiffany/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-tiffany" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Upload Your Flower Photo
                </h3>
                <p className="text-gray-600 mb-4">
                  Drag and drop or click to select a clear photo of your flowers
                </p>
              </div>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="luxury-button"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Select Photo
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Image Preview & Analysis */
          <div className="space-y-6">
            {/* Image Display */}
            <div className="relative">
              <img
                src={selectedImage}
                alt="Uploaded flower"
                className="w-full h-64 object-cover rounded-xl shadow-lg"
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm"
                onClick={resetWidget}
              >
                Upload New Photo
              </Button>
            </div>

            {/* Analysis Loading */}
            {isAnalyzing && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-tiffany/10 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-tiffany" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">Analyzing with AI...</p>
                    <p className="text-sm text-gray-600">Identifying flower type, variety, and growing conditions</p>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {analysis && !isAnalyzing && (
              <div className="space-y-6">
                {analysis.success ? (
                  <>
                    {/* Main Results */}
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <div className="font-semibold mb-2">Flower Successfully Identified!</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Type:</span> {analysis.plantType}
                          </div>
                          <div>
                            <span className="font-medium">Confidence:</span> {Math.round((analysis.confidence || 0.9) * 100)}%
                          </div>
                          {analysis.variety && (
                            <div className="col-span-2">
                              <span className="font-medium">Variety:</span> {analysis.variety}
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>

                    {/* Detailed Analysis Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Growth Information */}
                      <Card className="border-blue-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <h4 className="font-semibold text-blue-800">Growth Details</h4>
                          </div>
                          <div className="space-y-2 text-sm">
                            {analysis.growthStage && (
                              <div>
                                <span className="text-gray-600">Stage:</span> {analysis.growthStage}
                              </div>
                            )}
                            {analysis.condition && (
                              <div>
                                <span className="text-gray-600">Condition:</span> {analysis.condition}
                              </div>
                            )}
                            {analysis.category && (
                              <div>
                                <span className="text-gray-600">Category:</span> {analysis.category}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Yield Estimation */}
                      {analysis.estimatedYield && (
                        <Card className="border-purple-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Target className="w-4 h-4 text-purple-600" />
                              <h4 className="font-semibold text-purple-800">Yield Estimate</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-600">Quantity:</span> {analysis.estimatedYield.quantity} {analysis.estimatedYield.unit}
                              </div>
                              <div>
                                <span className="text-gray-600">Confidence:</span> {Math.round(analysis.estimatedYield.confidence * 100)}%
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Seasonality */}
                      {analysis.maturitySeason && (
                        <Card className="border-orange-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Calendar className="w-4 h-4 text-orange-600" />
                              <h4 className="font-semibold text-orange-800">Seasonality</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-600">Season:</span> {analysis.maturitySeason.season}
                              </div>
                              {analysis.maturitySeason.timeToMaturity && (
                                <div>
                                  <span className="text-gray-600">Maturity:</span> {analysis.maturitySeason.timeToMaturity}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Pricing Suggestions */}
                      {analysis.suggestions?.priceRange && (
                        <Card className="border-green-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <h4 className="font-semibold text-green-800">Market Insights</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-600">Price Range:</span> {analysis.suggestions.priceRange}
                              </div>
                              {analysis.suggestions.inventoryTips && (
                                <div>
                                  <span className="text-gray-600">Tips:</span> {analysis.suggestions.inventoryTips}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Auto-fill Notice */}
                    {showFormFilling && analysis.suggestions && (
                      <Alert className="border-tiffany/20 bg-tiffany/5">
                        <Sparkles className="w-5 h-5 text-tiffany" />
                        <AlertDescription className="text-tiffany-dark">
                          <div className="font-semibold mb-1">Smart Form Filling Available</div>
                          <p className="text-sm">
                            This analysis can automatically fill your flower listing form with optimized descriptions, pricing, and inventory details.
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Source Attribution */}
                    {analysis.source && (
                      <div className="text-xs text-gray-500 text-center pt-2 border-t">
                        Analysis source: {analysis.source === 'openai' ? 'OpenAI GPT-4o' : 'Intelligent fallback system'}
                        {analysis.source === 'fallback' && ' (Demo mode - limited API quota)'}
                      </div>
                    )}
                  </>
                ) : (
                  /* Error State */
                  <Alert variant="destructive">
                    <AlertCircle className="w-5 h-5" />
                    <AlertDescription>
                      <div className="font-semibold mb-1">Analysis Failed</div>
                      <p className="text-sm">
                        {analysis.error || 'Unable to identify flower. Please try uploading a clearer photo of flowers or flowering plants.'}
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}