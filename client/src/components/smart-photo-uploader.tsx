import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { compressImage, validateImageFile, formatFileSize } from "@/lib/image-utils";
import { 
  Upload, 
  Camera, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff,
  Calendar,
  BarChart3,
  TreePine
} from "lucide-react";

interface SmartPhotoUploaderProps {
  onImageSelect: (imageUrl: string) => void;
  onAnalysisComplete?: (analysis: PlantAnalysisResult) => void;
  className?: string;
  defaultPublic?: boolean;
}

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

export function SmartPhotoUploader({
  onImageSelect,
  onAnalysisComplete,
  className = "",
  defaultPublic = true
}: SmartPhotoUploaderProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PlantAnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isPublic, setIsPublic] = useState(defaultPublic);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      // Validate and compress image
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid image file');
      }

      const result = await compressImage(file, 1200, 0.8);
      if (!result.isValid) {
        throw new Error(result.error || 'Compression failed');
      }

      toast({
        title: "Image processed",
        description: `Reduced size by ${result.compressionRatio.toFixed(1)}%`,
      });

      setSelectedImage(result.compressedImage);
      onImageSelect(result.compressedImage);

      // Start AI analysis
      setIsAnalyzing(true);
      try {
        const base64Image = result.compressedImage.split(',')[1];
        const response = await apiRequest("POST", "/api/analyze-plant", {
          image: base64Image,
        });
        
        const analysisData = await response.json();
        
        setAnalysis(analysisData);
        if (onAnalysisComplete) {
          onAnalysisComplete(analysisData);
        }

        if (analysisData.success) {
          toast({
            title: "AI Analysis Complete",
            description: `Identified: ${analysisData.plantType || 'Unknown plant'}`,
          });
        }
      } catch (error) {
        console.error("AI Analysis error:", error);
        toast({
          title: "Analysis failed",
          description: "Unable to analyze image. Please try again.",
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

  const removeImage = useCallback(() => {
    setSelectedImage(null);
    setAnalysis(null);
    setShowAnalysis(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {!selectedImage ? (
        <Card className={`border-2 border-dashed transition-colors ${
          dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'
        }`}>
          <CardContent className="p-6">
            <div
              className="text-center cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-green-100 rounded-full">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-green-600" />
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Upload Plant Photo
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Drag and drop or click to select an image for AI analysis
                  </p>
                  <Button disabled={isUploading} className="bg-green-600 hover:bg-green-700">
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Processing...' : 'Select Photo'}
                  </Button>
                </div>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>
      ) : (
        /* Image Preview and Analysis */
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Uploaded plant"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  Remove
                </Button>
              </div>

              {/* Privacy Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {isPublic ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-sm font-medium">
                    {isPublic ? 'Public photo' : 'Private photo'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPublic(!isPublic)}
                >
                  {isPublic ? 'Make Private' : 'Make Public'}
                </Button>
              </div>

              {/* AI Analysis Status */}
              {isAnalyzing && (
                <Alert>
                  <Sparkles className="w-4 h-4" />
                  <AlertDescription className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI is analyzing your plant photo...
                  </AlertDescription>
                </Alert>
              )}

              {/* Analysis Results */}
              {analysis && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-green-600" />
                      AI Analysis Results
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAnalysis(!showAnalysis)}
                    >
                      {showAnalysis ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </div>

                  {analysis.success ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Plant Information */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center mb-2">
                            <TreePine className="w-4 h-4 mr-2 text-green-600" />
                            <span className="font-medium">Plant Info</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-semibold">{analysis.plantType}</p>
                            {analysis.variety && (
                              <p className="text-sm text-gray-600">{analysis.variety}</p>
                            )}
                            <Badge variant="outline">{analysis.category}</Badge>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Growth Stage */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center mb-2">
                            <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                            <span className="font-medium">Growth Stage</span>
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-semibold">{analysis.growthStage}</p>
                            {analysis.maturitySeason && (
                              <p className="text-sm text-gray-600">
                                {analysis.maturitySeason.season} harvest
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Yield Estimate */}
                      {analysis.estimatedYield && (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center mb-2">
                              <BarChart3 className="w-4 h-4 mr-2 text-orange-600" />
                              <span className="font-medium">Estimated Yield</span>
                            </div>
                            <div className="space-y-1">
                              <p className="text-lg font-semibold">
                                {analysis.estimatedYield.quantity} {analysis.estimatedYield.unit}
                              </p>
                              <p className="text-sm text-gray-600">
                                {(analysis.estimatedYield.confidence * 100).toFixed(0)}% confidence
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        {analysis.error || 'Unable to analyze the image. Please try a different photo.'}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Detailed Analysis */}
                  {showAnalysis && analysis.success && analysis.suggestions && (
                    <Card>
                      <CardContent className="p-4">
                        <h5 className="font-medium mb-2">AI Suggestions</h5>
                        <div className="space-y-2 text-sm">
                          {analysis.suggestions.name && (
                            <p><strong>Suggested Name:</strong> {analysis.suggestions.name}</p>
                          )}
                          {analysis.suggestions.description && (
                            <p><strong>Description:</strong> {analysis.suggestions.description}</p>
                          )}
                          {analysis.suggestions.priceRange && (
                            <p><strong>Price Range:</strong> {analysis.suggestions.priceRange}</p>
                          )}
                          {analysis.suggestions.inventoryTips && (
                            <p><strong>Inventory Tips:</strong> {analysis.suggestions.inventoryTips}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}