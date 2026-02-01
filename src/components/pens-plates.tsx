import React from "react";
import { Button } from "./ui/button";
import {
  Eraser,
  Pen,
  Pencil,
  Redo,
  Undo,
  ChevronDown,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Slider } from "./ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { colors, useTools } from "./hooks/useTools";

interface PensPlatesProps {
  onPageChange: (page: number) => void;
  onClearPage: () => void;
}

export default function PensPlates({
  onPageChange,
  onClearPage,
}: PensPlatesProps) {
  const {
    activeTool,
    setActiveTool,
    penColor,
    setPenColor,
    pencilColor,
    setPencilColor,
    penWidth,
    setPenWidth,
    pencilWidth,
    setPencilWidth,
    pageCount,
    setPageCount,
    currentPage,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useTools();

  return (
    <div className="flex flex-col w-full sticky top-0 z-10">
      {/* Main Toolbar */}
      <div className="flex w-full items-center justify-between p-2 backdrop-blur-lg bg-white/60 rounded-lg border border-white/20">
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={"ghost"}
                  size="sm"
                  onClick={() => setActiveTool("pen")}
                  className={`h-9 w-9 rounded-r-none border-r-0`}
                  style={{
                    background: activeTool === "pen" ? penColor : "white",
                  }}
                >
                  <Pen
                    className="w-4 h-4"
                    style={{ color: activeTool === "pen" ? "white" : "black" }}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pen</p>
              </TooltipContent>
            </Tooltip>
            <ToolDropdown
              tool="pen"
              color={penColor}
              width={penWidth}
              onColorChange={setPenColor}
              onWidthChange={setPenWidth}
            />
          </div>

          <div className="flex items-center ml-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={"ghost"}
                  size="sm"
                  onClick={() => setActiveTool("pencil")}
                  className="h-9 w-9 rounded-r-none border-r-0"
                  style={{
                    background: activeTool === "pencil" ? pencilColor : "white",
                  }}
                >
                  <Pencil
                    className="w-4 h-4"
                    style={{
                      color: activeTool === "pencil" ? "white" : "black",
                    }}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Pencil</p>
              </TooltipContent>
            </Tooltip>
            <ToolDropdown
              tool="pencil"
              color={pencilColor}
              width={pencilWidth}
              onColorChange={setPencilColor}
              onWidthChange={setPencilWidth}
            />
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === "eraser" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTool("eraser")}
                className="h-9 w-9 ml-1"
              >
                <Eraser className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eraser</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 px-3"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <span className="text-sm font-medium px-3 py-1 bg-white rounded border">
            Page {currentPage} of {pageCount}
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8"
                onClick={() => setPageCount(pageCount + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add New Page</p>
            </TooltipContent>
          </Tooltip>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pageCount}
            className="h-8 px-3"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

          <div className="border-l border-gray-300 h-6" />

          <Button
            variant="outline"
            size="sm"
            onClick={onClearPage}
            className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9"
                onClick={undo}
                disabled={!canUndo()}
              >
                <Undo className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Undo</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9"
                onClick={redo}
                disabled={!canRedo()}
              >
                <Redo className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Redo</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

const ToolDropdown = ({
  tool,
  color,
  width,
  onColorChange,
  onWidthChange,
}: {
  tool: string;
  color: string;
  width: number;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 hover:bg-gray-100"
      >
        <ChevronDown className="w-4 h-4" style={{ color }} />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-64 p-4" align="start">
      <div className="flex flex-col gap-4">
        <div>
          <h4 className="text-sm font-semibold mb-3">Colors</h4>
          <div className="grid grid-cols-5 gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                className={`rounded-full w-9 h-9 transition-all hover:scale-110 ${
                  color === c ? "ring-2 ring-offset-2 ring-gray-400" : ""
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="w-full h-16 bg-gray-100 rounded-lg flex items-center justify-center px-4">
          <svg
            width="100%"
            height="50"
            viewBox="0 0 240 50"
            preserveAspectRatio="none"
          >
            <path
              d="M 10 25 Q 60 10, 120 25 T 230 25"
              fill="none"
              stroke={color}
              strokeWidth={width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold">Stroke Width</h4>
            <span className="text-xs text-gray-500">{width}px</span>
          </div>
          <Slider
            value={[width]}
            onValueChange={(value) => onWidthChange(value[0])}
            min={1}
            max={20}
            step={1}
            className="flex-1"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Thin</span>
            <span>Thick</span>
          </div>
        </div>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
);
