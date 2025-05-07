import { GoogleGenAI, Type } from "@google/genai";

import type { Schema, Part } from "@google/genai";
import { TRPCError } from "@trpc/server";

const prompt = `You are an AI assistant tasked with preparing text excerpts for a typing racer game. The input is a **PDF document**, which may contain a mix of text, diagrams, images, and other visual elements. This document is likely personal notes, articles, or informational content focused on technical or academic subjects. The goal is to extract or synthesize **short, highly information-dense, self-contained textual statements** that present key concepts, factual information, or significant observations, suitable for typing practice.

**Crucial Objective: Emulate the style, density, and informational focus of the provided "Desired Output Examples" below. The output MUST be in the same textual format as these examples.** While the examples are often definitional, the key is that they are complete, dense thoughts.

**Desired Output Examples (These are the gold standard for style and density):**
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
*   "an interesting phenomenon is that certain species exhibit unique dietary adaptations based on environmental electrolyte availability affecting their interaction with specific habitats" (Example of a non-definitional but complete, dense thought)

Instructions:
1.  **Analyze Full Context:** Examine the **entire provided PDF document**. This includes all written text, as well as information presented in images, charts, or diagrams. Your primary goal is to understand the overall subject matter and identify key concepts, notable facts, or significant phenomena being discussed, whether they are explained in text or visually.
2.  **Identify Candidate Information for Textual Extraction/Synthesis:**
    *   Scan all content within the PDF.
    *   Look for individual sentences or very short, cohesive passages in the **written text** that define, explain, characterize a specific term/concept, **OR present a complete, self-contained factual statement, an interesting observation, or a key takeaway.**
    *   Crucially, if a key concept, definition, explanation, **or significant piece of factual information** is primarily conveyed through an **image, diagram, or chart**, you must **synthesize this visual information into a concise textual statement** that meets all other criteria (density, self-containment, style of examples). The output must still be a text string.
    *   The extracted/synthesized statement should articulate a core idea, fact, mechanism, or observation clearly.
3.  **Prioritize for Density, Clarity, and Informative Value (Critical):**
    *   **Select for High Information Density:** Choose or create textual statements that pack significant meaning into few words. They should be rich with specific terminology or factual content.
    *   **Focus on Statements Articulating Core Ideas, Facts, or Mechanisms:** Prioritize statements that clearly present a complete thought, whether it's a definition, an explanation of how something works, a key characteristic, or an interesting, self-contained piece of information.
    *   **Ensure Self-Containment:** Each selected/synthesized snippet must be understandable on its own without requiring surrounding context from the original document.
    *   **Look for Key Terminology/Concepts:** The snippets should ideally revolve around important nouns, noun phrases, concepts, or phenomena.
    *   **Avoid:**
        *   Vague, overly general, or incomplete statements.
        *   Purely illustrative examples without a core informative statement (e.g., avoid "this diagram shows many turtles" *unless* it's part of a synthesized, concise, informative statement like "some turtle populations in this region have shown a threefold increase").
        *   Transitional phrases, conversational fillers, questions.
        *   Simple greetings/closings, repetitive filler.
        *   Sentences that primarily list keywords without explaining their relationships or forming a complete thought.
4.  **Exclude Non-Prose, Metadata, and Purely Visual Elements Unsuitable for Textual Synthesis:** Strictly exclude the following from being the *direct output* (though their informational content can be *used* for synthesis):
    *   Titles, chapter headings, section headers, subheadings (unless one happens to be a perfect, dense, self-contained statement).
    *   Tables of contents, indices, bibliographies, reference lists, footnotes, endnotes.
    *   Copyright notices, publisher details, author attributions.
    *   Page numbers, running headers, footers.
    *   Figure captions or table titles/labels, **unless** the caption/label itself is a perfect, dense, self-contained statement that matches the desired output style. Generally, prefer synthesizing information from the main body of text or the core informational content of visuals.
    *   Standalone bullet points or numbered list items (unless an item *itself* forms a complete, dense statement like the examples).
    *   Code blocks, mathematical formulas, or heavily formatted data unsuitable for direct typing as a sentence.
    *   Raw descriptions of images (e.g., "a blue arrow points to a red box") unless that description is part of synthesizing a key concept or fact. Focus on the *meaning* conveyed.
    *   Very short fragments (e.g., less than 10 words) that don't convey a complete, dense idea.
5.  **Clean for Typing:** For each selected or synthesized textual snippet:
    *   Remove any leading/trailing whitespace.
    *   Normalize internal whitespace to single spaces between words.
    *   Ensure standard punctuation. Correct run-on sentences if a simple punctuation addition makes two short, related sentences into a valid snippet (but prefer naturally well-formed single sentences). Remove awkward line breaks within sentences.
    *   Convert all text to lowercase.
    *   Remove any residual formatting artifacts.
6.  **Filter by Length:** Ensure the final cleaned textual snippets are concise, ideally between **30 and 50 words**. This range reflects the density of the "Desired Output Examples". Adjust slightly if needed, but the goal is conciseness.
7.  **Format Output:** Return a list of the cleaned, information-dense **textual snippets** that meet all criteria. Format the output as a JSON list of strings. Provide **ideally 20 snippets**, unless there's not enough suitable information to meet the quality and quantity criteria. If fewer high-quality snippets are found, provide those.

Example of bad output to avoid (too conversational, not informative enough, incomplete, or just describing an image without extracting a concept/fact):
"high data volume: we’re talking billions of images or millions of customer interactions" (Too conversational for this specific style)
"the image displays a complex network of interconnected nodes with arrows indicating data flow" (Just describes, doesn't provide a conceptual takeaway)
"turtles sometimes eat blueberries" (Not dense enough, lacks the "why" or "effect" that your example had)

Process the provided **PDF document** now according to these instructions, striving to match the style and density of the "Desired Output Examples" in your **textual output**.`;

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
  generateContent: async (pdfBase64: string) => {
    // Check if Gemini API is configured
    if (!ai || !process.env.GEMINI_API) {
      console.warn("Gemini API key not found, using fallback content");
      return fallbackParagraphs;
    }

    const pdfPart: Part = {
      inlineData: {
        mimeType: "application/pdf",
        data: pdfBase64,
      },
    };

    const textPart: Part = {
      text: prompt,
    };

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [textPart, pdfPart] }],
      config: {
        responseSchema: paragraphListSchema,
        responseMimeType: "application/json",
      },
    });

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `oki so whats da result ${result.text}`,
    });

    const response = result.text;
    if (!response) {
      console.warn("Empty response from Gemini API");
      return fallbackParagraphs;
    }
    // try {
    //   const parsed_result = JSON.parse(response) as string[];

    //   if (
    //     !Array.isArray(parsed_result) ||
    //     !parsed_result.every((item) => typeof item === "string") ||
    //     parsed_result.length === 0
    //   ) {
    //     console.error(
    //       "Invalid response format from Gemini API:",
    //       parsed_result,
    //     );
    //     return fallbackParagraphs;
    //   }

    //   return parsed_result;
    // } catch (parseError: unknown) {
    //   throw new TRPCError({
    //     code: "INTERNAL_SERVER_ERROR",
    //     message: `Some error : ${parseError}...`,
    //   });
    //   return fallbackParagraphs;
    // }
  },
};
