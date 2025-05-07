import { GoogleGenAI, Type } from "@google/genai";

import type { Schema } from "@google/genai";
import { TRPCError } from "@trpc/server";

const prompt = `You are an AI assistant tasked with preparing text excerpts for a typing racer game. The text comes from user-uploaded documents, likely personal notes, articles, or informational PDFs focused on technical or academic subjects. The goal is to extract short, highly information-dense, self-contained statements that explain or define key concepts, suitable for typing practice.

**Crucial Objective: Emulate the style, density, and informational focus of the provided "Desired Output Examples" below.**

**Desired Output Examples (These are the gold standard):**
*   "paxos is a family of protocols ensuring distributed agreement despite node failures it guarantees safety by requiring a majority quorum for proposals and commits making it robust but complex"
*   "raft simplifies distributed consensus compared to paxos it uses leader election and replicated logs ensuring that all nodes agree on the sequence of operations in a fault tolerant manner"
*   "bft mechanisms allow distributed systems to reach consensus even when some nodes exhibit arbitrary malicious behavior byzantine faults unlike protocols assuming only crash failures"
*   "2pc coordinates atomic transactions across multiple distributed nodes it involves a prepare phase where nodes vote and a commitabort phase based on the vote outcome blocking is a risk"
*   "3pc aims to reduce 2pcs blocking issue during coordinator or node failures it adds a pre commit phase allowing non blocking recovery under certain failure scenarios"
*   "vector clocks track causality in distributed systems by assigning a vector timestamp to each event comparing vectors reveals if events are causally related concurrent or ordered"
*   "matrix clocks extend vector clocks enabling nodes to maintain knowledge about other nodes knowledge of event times this helps track more complex causal relationships and global states"
*   "lamport timestamps assign a logical clock value a simple counter to events establishing a total ordering consistent with causality concurrent events might get arbitrary order"
*   "hlcs combine physical clock time with logical counters they provide timestamps that reflect causality like lamport clocks but stay close to physical time for better observability"
*   "version vectors are used in replicated systems to track the history of updates for each replica they help detect and reconcile conflicting updates made concurrently"
*   "crdts are data structures designed for replication where concurrent updates can merge automatically without conflicts ensuring strong eventual consistency without complex coordination"

Instructions:
1.  **Analyze Context:** Read through the entire provided document text to understand its overall subject matter and the key concepts being discussed.
2.  **Identify Candidate Sentences/Short Passages:** Scan the text. Instead of looking for long paragraphs, focus on individual sentences or very short, cohesive passages (1-2 sentences max) that seem to define, explain, or characterize a specific term, concept, mechanism, or principle.
3.  **Prioritize for Density and Definition (Critical):**
    *   **Select for High Information Density:** Choose sentences/passages that pack significant meaning into few words. They should be rich with specific terminology and factual content.
    *   **Focus on Definitional/Explanatory Content:** Prioritize statements that answer "What is X?" or "How does X work?" or "What are the key features of X?". They should clearly articulate a core idea.
    *   **Ensure Self-Containment:** Each selected snippet should be understandable on its own without requiring surrounding context from the original document.
    *   **Look for Key Terminology:** The snippets should ideally revolve around, define, or explain important nouns or noun phrases (like "Paxos," "vector clocks," "BFT mechanisms").
    *   **Avoid:**
        *   Vague or overly general statements.
        *   Purely illustrative examples without a core definition (e.g., avoid "we are talking billions of images" *unless* it's part of a concise definition of "high data volume").
        *   Transitional phrases, conversational fillers, questions, or incomplete thoughts.
        *   Simple greetings/closings, repetitive filler.
        *   Sentences that primarily list keywords without explaining their relationships.
4.  **Exclude Non-Prose & Metadata:** Strictly exclude the following:
    *   Titles, chapter headings, section headers, subheadings.
    *   Tables of contents, indices, bibliographies, reference lists, footnotes, endnotes.
    *   Copyright notices, publisher details, author attributions (unless clearly part of the main informative text defining a concept).
    *   Page numbers, running headers, footers.
    *   Figure captions, table titles/labels.
    *   Standalone bullet points or numbered list items (unless an item *itself* forms a complete, dense statement like the examples).
    *   Code blocks, mathematical formulas, or heavily formatted data unsuitable for typing.
    *   Very short fragments (e.g., less than 10 words) that don't convey a complete, dense idea.
5.  **Clean for Typing:** For each selected snippet:
    *   Remove any leading/trailing whitespace.
    *   Normalize internal whitespace to single spaces between words.
    *   Ensure standard punctuation. Correct run-on sentences if a simple punctuation addition makes two short, related sentences into a valid snippet (but prefer naturally well-formed single sentences). Remove awkward line breaks within sentences.
    *   Convert all text to lowercase.
    *   Remove any residual formatting artifacts.
6.  **Filter by Length:** Ensure the final cleaned snippets are concise, ideally between **15 and 40 words**. This range reflects the density of the "Desired Output Examples". Adjust slightly if needed, but the goal is conciseness.
7.  **Format Output:** Return a list of the cleaned, information-dense snippets that meet all criteria. Format the output as a JSON list of strings. Provide [Specify Number, e.g., 'up to 15' or 'all suitable'] snippets.

Example of bad output to avoid (too conversational, not definitional):
"high data volume: we’re talking billions of images or millions of customer interactions"

Process the provided document text now according to these instructions, striving to match the style and density of the "Desired Output Examples."`;

// Fallback content in case Gemini API fails
const fallbackParagraphs = [
  "this is a fallback paragraph from the system since the ai processing failed please try again with a different pdf or contact support if this issue persists",
  "we apologize for the inconvenience our system is currently experiencing difficulties processing your document try uploading a simpler pdf with clear text content",
];

// Initialize the GoogleGenAI client only if API key is available
const ai = process.env.GEMINI_API
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API,
    })
  : null;

const paragraphListSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.STRING,
  },
};

export const aiService = {
  generateContent: async (pdfText: string) => {
    if (pdfText.length > 200000) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `The PDF file is too long`,
      });
    }

    // Check if Gemini API is configured
    if (!ai || !process.env.GEMINI_API) {
      console.warn("Gemini API key not found, using fallback content");
      return fallbackParagraphs;
    }

    try {
      const contents = prompt + pdfText;

      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contents,
        config: {
          responseSchema: paragraphListSchema,
          responseMimeType: "application/json",
        },
      });

      if (!result.text) {
        console.warn("Empty response from Gemini API");
        return fallbackParagraphs;
      }

      try {
        const parsed_result = JSON.parse(result.text) as string[];

        if (
          !Array.isArray(parsed_result) ||
          !parsed_result.every((item) => typeof item === "string") ||
          parsed_result.length === 0
        ) {
          console.error(
            "Invalid response format from Gemini API:",
            parsed_result,
          );
          return fallbackParagraphs;
        }

        return parsed_result;
      } catch (parseError) {
        console.error(
          "Error parsing Gemini API response:",
          parseError,
          "Raw response:",
          result.text,
        );
        return fallbackParagraphs;
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return fallbackParagraphs;
    }
  },
};
