import jsPDF from "jspdf";

interface ExportPDFOptions {
  pages: Map<number, ImageData>;
  pageCount: number;
  fileName: string;
}

export const exportToPDF = async ({
  pages,
  pageCount,
  fileName,
}: ExportPDFOptions): Promise<void> => {
  // A4 dimensions in mm
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;

  // Canvas dimensions (high resolution)
  const pixelRatio =
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const CANVAS_WIDTH = 794 * pixelRatio;
  const CANVAS_HEIGHT = 1123 * pixelRatio;

  // Create PDF with A4 size
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  for (let i = 1; i <= pageCount; i++) {
    const pageData = pages.get(i);

    if (pageData) {
      // Create a temporary canvas to convert ImageData to image
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = CANVAS_WIDTH;
      tempCanvas.height = CANVAS_HEIGHT;
      const tempCtx = tempCanvas.getContext("2d");

      if (tempCtx) {
        tempCtx.putImageData(pageData, 0, 0);
        // Use JPEG with high quality for smaller file size but good quality
        const imageDataUrl = tempCanvas.toDataURL("image/jpeg", 0.95);

        // Add new page for pages after the first one
        if (i > 1) {
          pdf.addPage();
        }

        // Add image to PDF (fill the entire A4 page)
        pdf.addImage(
          imageDataUrl,
          "JPEG",
          0,
          0,
          A4_WIDTH_MM,
          A4_HEIGHT_MM,
          undefined,
          "FAST",
        );
      }
    } else {
      // If page has no data, add a blank page
      if (i > 1) {
        pdf.addPage();
      }
    }
  }

  // Download the PDF
  pdf.save(`${fileName}.pdf`);
};
