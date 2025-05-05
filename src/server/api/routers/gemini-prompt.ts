import { GoogleGenAI, Type } from "@google/genai";

import type { Schema } from "@google/genai";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

import { TRPCError } from "@trpc/server";

import { env } from "@/env";

const prompt = `Okay, here is the prompt with the asterisks removed for easier copying and pasting. I've replaced bullet points previously marked with asterisks with hyphens (-) for list clarity.

You are an AI assistant tasked with preparing text excerpts for a typing racer game. The text comes from user-uploaded documents, likely personal notes, articles, or informational PDFs. The goal is to extract paragraphs that are both suitable for typing practice and rich in information content.

Instructions:
1.  Analyze Context: Read through the entire provided document text to understand its overall structure and content type (e.g., notes, textbook chapter, article).
2.  Identify Candidate Paragraphs: Scan the text for blocks of text separated by double line breaks ('\n\n') or similar paragraph delimiters.
3.  Prioritize Information Density: From the candidates, select paragraphs that are substantive and information-rich. This means prioritizing paragraphs that:
    - Explain concepts, ideas, or processes.
    - Summarize information or findings.
    - Provide detailed descriptions, definitions, or arguments.
    - Contain factual data or key takeaways.
    - Avoid: Paragraphs that are purely transitional, simple greetings/closings, repetitive filler, very basic narrative/dialogue lacking substance, or just list keywords.
4.  Exclude Non-Prose & Metadata: Strictly exclude the following:
    - Titles, chapter headings, section headers, subheadings.
    - Tables of contents, indices, bibliographies, reference lists, footnotes, endnotes.
    - Copyright notices, publisher details, author attributions (unless clearly part of the main informative text).
    - Page numbers, running headers, footers.
    - Figure captions, table titles/labels.
    - Standalone bullet points or numbered list items (unless a list item itself forms a complete, dense paragraph).
    - Code blocks, mathematical formulas, or heavily formatted data unsuitable for typing.
    - Very short fragments or single sentences that don't convey significant information on their own.
5.  Clean for Typing: For each selected paragraph:
    - Remove any leading/trailing whitespace.
    - Normalize internal whitespace to single spaces between words.
    - Ensure standard punctuation (e.g., question marks, periods, etc). Remove awkward line breaks within sentences that might remain from the PDF extraction.
    - Lowercase
    - Remove any residual formatting artifacts.
6.  Filter by Length: Ensure the final cleaned paragraphs are of a reasonable length for typing, for example, between 20 and 50 words. [Adjust this range based on your game's needs].
7.  Format Output: Return a list of the cleaned, information-dense paragraphs that meet all criteria. Format the output as a JSON list of strings. Provide [Specify Number, e.g., 'up to 15' or 'all suitable'] paragraphs.

Example of desired output format:
[
  "This first paragraph explains a key scientific concept in detail, making it information-dense and suitable for typing practice after cleaning.",
  "Here is another example paragraph summarizing the main arguments from a section of the text, fulfilling the criteria for substance and length.",
  "..."
]

Process the provided document text now according to these instructions.
`;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API,
});

const paragraphListSchema: Schema = {
  type: Type.ARRAY, // Use Type.ARRAY instead of "array"
  items: {
    type: Type.STRING, // Use Type.STRING instead of "string"
  },
};

export const aiService = {
  generateContent: async (pdfText: string) => {
    if (pdfText.length > 200000) {
      throw new TRPCError({
        code: "BAD_REQUEST", // It's bad input if you don't accept empty PDFs
        message: `The PDF file is too long`,
      });
    }

    const contents = prompt + pdfText;

    // For normal operation (not PDF content), use static text or uncomment the Gemini API call
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contents,
      config: {
        responseSchema: paragraphListSchema,
        responseMimeType: "application/json",
      },
    });

    if (!result.text) return;

    const parsed_result = JSON.parse(result.text);

    if (
      !Array.isArray(parsed_result) ||
      !parsed_result.every((item) => typeof item === "string")
    ) {
      console.error("Parsed data is not an array of strings:", parsed_result);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI response format mismatch (expected string array).",
      });
    }

    // Using static text as a placeholder
    return parsed_result as string[];
  },
};
