import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Link, X, CheckCircle2, AlertCircle, ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EnhancedImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  description?: string;
  placeholder?: string;
  className?: string;
}

export function EnhancedImageUploader({
  value,
  onChange,
  label = "Image",
  description = "Add an image URL or drag and drop a file",
  placeholder = "Enter image URL (e.g., https://example.com/image.jpg)",
  className = "",
}: EnhancedImageUploaderProps) {
  const [url, setUrl] = useState(value || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(!!value);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setUploadedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUrl(dataUrl);
      setIsValid(true);
      onChange(dataUrl);
      setIsLoading(false);
      
      toast({
        title: "Image uploaded",
        description: "Image has been successfully uploaded",
      });
    };
    reader.readAsDataURL(file);
  }, [onChange, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const clearImage = () => {
    setUrl("");
    setIsValid(false);
    setUploadedFile(null);
    onChange("");
  };

  const validateImageUrl = async (imageUrl: string) => {
    if (!imageUrl) {
      setIsValid(false);
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      
      if (response.ok && contentType && contentType.startsWith('image/')) {
        setIsValid(true);
        onChange(imageUrl);
        toast({
          title: "Image validated",
          description: "Image URL is valid and accessible",
        });
      } else {
        setIsValid(false);
        toast({
          title: "Invalid image URL",
          description: "Please provide a valid image URL",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsValid(false);
      toast({
        title: "Image validation failed",
        description: "Could not validate image URL. Please check the URL.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (newUrl !== value) {
      setIsValid(false);
    }
  };

  const handleValidate = () => {
    if (url.trim()) {
      validateImageUrl(url.trim());
    }
  };

  return (
    <div className={className}>
      <Label htmlFor={`image-upload-${label}`} className="text-sm font-medium">
        {label}
      </Label>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      
      <div className="space-y-4">
        {/* Drag and Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload a photo</h3>
          <p className="text-gray-600 mb-4">Drag and drop or click to select an image</p>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id={`file-upload-${label}`}
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(`file-upload-${label}`)?.click()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Upload className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ImagePlus className="w-4 h-4 mr-2" />
            )}
            Select Image
          </Button>
        </div>

        {/* URL Input */}
        <div className="flex gap-2">
          <Input
            id={`image-upload-${label}`}
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleValidate}
            disabled={!url || isLoading}
            className="shrink-0"
          >
            {isLoading ? (
              <Upload className="w-4 h-4 animate-spin" />
            ) : (
              <Link className="w-4 h-4" />
            )}
            Validate
          </Button>
        </div>

        {/* Status Badge */}
        {url && (
          <div className="flex items-center gap-2">
            {isValid ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Valid Image
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="w-3 h-3 mr-1" />
                Validation Required
              </Badge>
            )}
            {uploadedFile && (
              <Badge variant="secondary">
                File: {uploadedFile.name}
              </Badge>
            )}
          </div>
        )}

        {/* Image Preview */}
        {isValid && url && (
          <div className="relative">
            <img
              src={url}
              alt="Image preview"
              className="w-full h-48 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={clearImage}
              className="absolute top-2 right-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Image Suggestions */}
        {!isValid && !uploadedFile && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-sm text-gray-600">
                <ImagePlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p>Need free stock photos? Try:</p>
                <div className="flex justify-center gap-4 mt-2">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => window.open("https://unsplash.com/s/photos/farm", '_blank')}
                  >
                    Unsplash
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => window.open("https://www.pexels.com/search/agriculture/", '_blank')}
                  >
                    Pexels
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}