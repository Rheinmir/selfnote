import { createRef, useState } from "react";
import { ReactSketchCanvas, type ReactSketchCanvasRef } from "react-sketch-canvas";
import { EraserIcon, HighlighterIcon, PenIcon, RedoIcon, UndoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (imageBlob: Blob) => void;
}

const COLORS = ["#000000", "#ef4444", "#22c55e", "#3b82f6", "#eab308", "#a855f7"];

const SketchpadDialog = ({ open, onOpenChange, onSave }: Props) => {
  const canvasRef = createRef<ReactSketchCanvasRef>();
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [isEraser, setIsEraser] = useState(false);
  const [activeTool, setActiveTool] = useState<"pen" | "eraser">("pen");
  const [strokeWidth, setStrokeWidth] = useState(4);

  const handleSave = async () => {
    if (canvasRef.current) {
      try {
        const dataURL = await canvasRef.current.exportImage("png");
        const res = await fetch(dataURL);
        const blob = await res.blob();
        onSave(blob);
        onOpenChange(false);
      } catch (e) {
        console.error("Failed to export image", e);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Sketchpad</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                     <Button
                        variant={activeTool === "pen" ? "default" : "outline"}
                        size="icon"
                        onClick={() => {
                            setActiveTool("pen");
                            setIsEraser(false);
                        }}
                        title="Pen"
                     >
                        <PenIcon className="w-4 h-4" />
                     </Button>
                     <Button
                        variant={activeTool === "eraser" ? "default" : "outline"}
                        size="icon"
                        onClick={() => {
                            setActiveTool("eraser");
                            setIsEraser(true);
                        }}
                        title="Eraser"
                     >
                        <EraserIcon className="w-4 h-4" />
                     </Button>
                     <div className="w-px h-6 bg-border mx-2" />
                     <Button variant="ghost" size="icon" onClick={() => canvasRef.current?.undo()} title="Undo">
                        <UndoIcon className="w-4 h-4" />
                     </Button>
                     <Button variant="ghost" size="icon" onClick={() => canvasRef.current?.redo()} title="Redo">
                        <RedoIcon className="w-4 h-4" />
                     </Button>
                </div>
                {/* Color Picker */}
                {!isEraser && (
                    <div className="flex items-center gap-1">
                        {COLORS.map((color) => (
                            <button
                                type="button"
                                key={color}
                                className={`w-6 h-6 rounded-full border border-gray-200 ${strokeColor === color ? "ring-2 ring-offset-1 ring-black" : ""}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setStrokeColor(color)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="border rounded-lg overflow-hidden h-[400px] w-full bg-white relative">
                <ReactSketchCanvas
                    ref={canvasRef}
                    strokeWidth={strokeWidth}
                    strokeColor={strokeColor}
                    eraserWidth={20}
                    canvasColor="white"
                />
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SketchpadDialog;
