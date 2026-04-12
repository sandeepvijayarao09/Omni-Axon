import { GoogleGenAI } from "@google/genai";
import { Agent, Workflow } from "@/store";

// Initialize the Gemini client using the environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function executeWorkflow(
  workflow: Workflow,
  agents: Agent[],
  initialInput: string,
  onProgress: (step: string, output: string) => void,
) {
  try {
    let currentContext = initialInput;

    // Sort nodes by edges (simple linear topological sort for prototype)
    // For a real app, you'd need a proper DAG execution engine
    const sortedNodes = workflow.nodes.sort(
      (a, b) => a.position.y - b.position.y,
    );

    for (const node of sortedNodes) {
      if (node.type === "input") {
        onProgress(
          `Triggered: ${node.data.label}`,
          "Fetching data from Google Drive...",
        );
        // Simulate Drive fetch
        await new Promise((resolve) => setTimeout(resolve, 1000));
        currentContext = `[Data from Drive]: ${initialInput}`;
        onProgress(`Completed: ${node.data.label}`, currentContext);
        continue;
      }

      if (node.type === "output") {
        onProgress(
          `Action: ${node.data.label}`,
          "Writing final output to Google Docs...",
        );
        // Simulate Docs write
        await new Promise((resolve) => setTimeout(resolve, 1000));
        onProgress(
          `Completed: ${node.data.label}`,
          "Successfully saved to Google Docs!",
        );
        continue;
      }

      // It's an agent node
      const agent = agents.find((a) => a.name === node.data.label);
      if (!agent) {
        onProgress(
          `Error: ${node.data.label}`,
          "Agent configuration not found.",
        );
        continue;
      }

      onProgress(
        `Agent Running: ${agent.name}`,
        `Processing data with role: ${agent.role}...`,
      );

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Process the following input based on your instructions:\n\n${currentContext}`,
        config: {
          systemInstruction: `${agent.systemPrompt}\n\nYou are acting as a node in an automated pipeline. Output only the processed result, no conversational filler.`,
          temperature: 0.2,
        },
      });

      currentContext = response.text || "No output generated.";
      onProgress(`Agent Completed: ${agent.name}`, currentContext);
    }

    return currentContext;
  } catch (error) {
    console.error("Workflow execution failed:", error);
    onProgress(
      "Execution Failed",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw error;
  }
}
