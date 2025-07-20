import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        
        // Calculate new dimensions (max 1200px)
        const maxSize = 1200;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image'));
      };
      
      img.src = objectUrl;
    });
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const compressedImageUrl = await compressImage(file);
      setSelectedImage(compressedImageUrl);
      onImageSelect(compressedImageUrl);
      
      toast({
        title: "Image uploaded",
        description: "Image ready for analysis!",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [compressImage, onImageSelect, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const analyzeImage = useCallback(async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      // Convert data URL to base64
      const base64Image = selectedImage.split(',')[1];
      
      const response = await apiRequest("POST", "/api/analyze-plant", {
        image: base64Image,
      });

      if (response.success) {
        setAnalysis(response);
        setShowAnalysis(true);
        onAnalysisComplete?.(response);
        
        toast({
          title: "Analysis complete!",
          description: `Identified: ${response.plantType || 'Unknown plant'}`,
        });
      } else {
        throw new Error(response.error || 'Analysis failed');
      }
    } catch (error: any) {
      console.error("Plant analysis error:", error);
      
      // Handle quota exceeded gracefully
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        toast({
          title: "Analysis temporarily unavailable",
          description: "AI analysis quota reached. Please try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis failed",
          description: "Unable to analyze image. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedImage, onAnalysisComplete, toast]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Simple Upload Area */}
      {!selectedImage ? (
        <Card 
          className={`border-2 border-dashed transition-all cursor-pointer hover:border-green-400 ${
            dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-8 px-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-green-600" />
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload a photo
            </h3>
            
            <p className="text-sm text-gray-600 text-center mb-4">
              Drag and drop or click to select an image<br />
              (max 10MB, auto-compressed)
            </p>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline" className="text-xs">
                <Camera className="w-3 h-3 mr-1" />
                Fresh produce
              </Badge>
              <Badge variant="outline" className="text-xs">
                <TreePine className="w-3 h-3 mr-1" />
                Growing plants
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Image Preview & Analysis */
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Image Preview */}
            <div className="relative">
              <img 
                src={selectedImage} 
                alt="Uploaded plant" 
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => {
                  setSelectedImage(null);
                  setAnalysis(null);
                  setShowAnalysis(false);
                }}
              >
                Remove
              </Button>
            </div>

            {/* Privacy Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Photo visibility:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPublic(!isPublic)}
                className="flex items-center gap-2"
              >
                {isPublic ? (
                  <>
                    <Eye className="w-4 h-4" />
                    Public
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Private
                  </>
                )}
              </Button>
            </div>

            <Separator />

            {/* Analyze Button */}
            {!showAnalysis && (
              <Button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Identify plant & predict harvest
                  </>
                )}
              </Button>
            )}

            {/* Analysis Results */}
            {showAnalysis && analysis && analysis.success && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-800">AI Analysis Complete</h4>
                </div>

                {/* Plant Identification */}
                <div className="bg-green-50 p-4 rounded-lg space-y-3">
                  <div>
                    <h5 className="font-medium text-gray-900">Plant Identification</h5>
                    <p className="text-sm text-gray-700">
                      {analysis.plantType} {analysis.variety && `(${analysis.variety})`}
                    </p>
                    {analysis.category && (
                      <Badge variant="secondary" className="mt-1">
                        {analysis.category}
                      </Badge>
                    )}
                  </div>

                  {/* Growth Stage & Condition */}
                  {analysis.growthStage && (
                    <div>
                      <h5 className="font-medium text-gray-900">Growth Stage</h5>
                      <p className="text-sm text-gray-700">{analysis.growthStage}</p>
                      {analysis.condition && (
                        <p className="text-xs text-gray-600">Condition: {analysis.condition}</p>
                      )}
                    </div>
                  )}

                  {/* Yield Prediction */}
                  {analysis.estimatedYield && (
                    <div className="flex items-start gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-gray-900">Estimated Yield</h5>
                        <p className="text-sm text-gray-700">
                          {analysis.estimatedYield.quantity} {analysis.estimatedYield.unit}
                        </p>
                        <p className="text-xs text-gray-600">
                          Confidence: {Math.round(analysis.estimatedYield.confidence * 100)}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Maturity Season */}
                  {analysis.maturitySeason && (
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-orange-600 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-gray-900">Harvest Season</h5>
                        <p className="text-sm text-gray-700">{analysis.maturitySeason.season}</p>
                        <p className="text-xs text-gray-600">
                          {analysis.maturitySeason.timeToMaturity}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions */}
                {analysis.suggestions && (
                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      <strong>AI Suggestions:</strong> {analysis.suggestions.inventoryTips || analysis.suggestions.name}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Confidence */}
                {analysis.confidence && (
                  <div className="text-xs text-gray-500">
                    Analysis confidence: {Math.round(analysis.confidence * 100)}%
                  </div>
                )}

                {/* Re-analyze Option */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnalysis(false)}
                  className="w-full"
                >
                  Analyze again
                </Button>
              </div>
            )}

            {/* Analysis Error */}
            {showAnalysis && analysis && !analysis.success && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {analysis.error || "Unable to analyze this image. Please try a different photo."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}