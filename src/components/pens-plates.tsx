import React, { useState } from "react";
import { Button } from "./ui/button";
import { Eraser, Pen, Pencil, Redo, Undo, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Slider } from "./ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const colors = [
  "#000000",
  "#EF4444",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#6366F1",
  "#14B8A6",
  "#F97316",
];

export default function PensPlates() {
  const [activeTool, setActiveTool] = useState("pen");
  const [penColor, setPenColor] = useState("#000000");
  const [pencilColor, setPencilColor] = useState("#6B7280");
  const [penWidth, setPenWidth] = useState(3);
  const [pencilWidth, setPencilWidth] = useState(2);

  return (
    <div className="flex w-full items-center justify-between p-2 bg-white rounded-lg border">
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
            color={activeTool === "pen" ? penColor : "black"}
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
            color={activeTool === "pencil" ? pencilColor : "black"}
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

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9">
              <Undo className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9">
              <Redo className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo</p>
          </TooltipContent>
        </Tooltip>
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
  onColorChange: React.Dispatch<React.SetStateAction<string>>;
  onWidthChange: React.Dispatch<React.SetStateAction<number>>;
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
