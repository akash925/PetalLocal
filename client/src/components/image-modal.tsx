import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ImageModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageModal({ src, alt, isOpen, onClose }: ImageModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  
  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  // Reset view when modal opens
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      resetView();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black border-0">
        <div className="relative w-full h-[95vh] flex items-center justify-center">
          {/* Controls */}
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleZoomOut}
              className="bg-black/50 text-white hover:bg-black/70 border-white/20"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleZoomIn}
              className="bg-black/50 text-white hover:bg-black/70 border-white/20"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRotate}
              className="bg-black/50 text-white hover:bg-black/70 border-white/20"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="bg-black/50 text-white hover:bg-black/70 border-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom indicator */}
          <div className="absolute top-4 left-4 z-50">
            <div className="bg-black/50 text-white px-3 py-1 rounded text-sm">
              {Math.round(zoom * 100)}%
            </div>
          </div>

          {/* Image */}
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            <img
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain transition-transform duration-200 cursor-grab active:cursor-grabbing"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
              draggable={false}
            />
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-black/50 text-white px-4 py-2 rounded text-sm">
              Use controls to zoom and rotate • Click outside to close
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}