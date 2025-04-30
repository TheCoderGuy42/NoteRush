import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import * as fs from "fs";
import * as path from "path";

// Import pdf-parse dynamically to avoid the initialization error
let pdfParse: any = null;

// Create test directory structure if it doesn't exist
const testDir = path.join(process.cwd(), "test", "data");
fs.mkdirSync(testDir, { recursive: true });

// Create empty placeholder file that pdf-parse looks for during initialization
const placeholderFile = path.join(testDir, "05-versions-space.pdf");
if (!fs.existsSync(placeholderFile)) {
  fs.writeFileSync(placeholderFile, Buffer.from([0]));
}

// Now import pdf-parse after ensuring the file exists
import("pdf-parse").then((module) => {
  pdfParse = module.default;
});

// Helper to convert base64 to Buffer
function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, "base64");
}

// Function to select a random paragraph from text
function getRandomParagraph(text: string): string {
  // Split text into paragraphs (any sequence of text separated by double line breaks)
  const paragraphs = text
    .split(/\n\s*\n/)
    .filter((para) => para.trim().length > 100) // Only paragraphs with reasonable length
    .map((para) => para.replace(/\s+/g, " ").trim()); // Normalize whitespace

  if (paragraphs.length === 0) {
    return "No suitable paragraphs found in the document.";
  }

  // Select a random paragraph
  const randomIndex = Math.floor(Math.random() * paragraphs.length);
  // Ensure paragraph is a string
  return (
    paragraphs[randomIndex] || "Unable to extract paragraph from document."
  );
}

export const pdfProcessor = createTRPCRouter({
  process: publicProcedure
    .input(
      z.object({
        pdfBase64: z.string(),
        filename: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        // Convert base64 to buffer
        const pdfBuffer = base64ToBuffer(input.pdfBase64);

        // Ensure pdf-parse is loaded
        if (!pdfParse) {
          pdfParse = (await import("pdf-parse")).default;
        }

        // Parse PDF
        const pdfData = await pdfParse(pdfBuffer);

        if (!pdfData.text || pdfData.text.trim().length === 0) {
          return {
            success: false,
            message: "Could not extract text from PDF",
            text: null,
          };
        }

        // Extract a random paragraph
        const randomParagraph = getRandomParagraph(pdfData.text);

        return {
          success: true,
          message: "PDF processed successfully",
          text: randomParagraph,
          filename: input.filename,
        };
      } catch (error) {
        console.error("PDF processing error:", error);
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Unknown error processing PDF",
          text: null,
        };
      }
    }),
});
