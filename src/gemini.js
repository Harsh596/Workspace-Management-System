import { GoogleGenerativeAI } from "@google/generative-ai";

export const askAI = async (prompt, workspaceTasks, customApiKey = null, preferredModel = "gemini-flash-latest") => {
  const activeKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY;

  if (!activeKey) {
    throw new Error("No Gemini API Key found. Please add it to your settings or .env.local file. If using .env.local, YOU MUST RESTART THE SERVER `npm run dev`.");
  }

  try {
    const genAI = new GoogleGenerativeAI(activeKey);
    const model = genAI.getGenerativeModel({ model: preferredModel });

    // Enhanced Data Preparation: Map internal IDs to Human names
    const workspaceMap = {};
    if (workspaceTasks.workspaces) {
      workspaceTasks.workspaces.forEach(w => {
        workspaceMap[w.id] = w.name;
      });
    }

    const readableTasks = workspaceTasks.tasks ? workspaceTasks.tasks.map(t => ({
      ...t,
      hubName: workspaceMap[t.workspaceId] || 'Unknown Hub',
      workspaceId: undefined, // Hide IDs from AI to prevent citation of them
      userId: undefined,
      id: undefined
    })) : [];

    const tasksContext = JSON.stringify(readableTasks, null, 2);
    const workspaceList = workspaceTasks.workspaces ? workspaceTasks.workspaces.map(w => w.name).join(", ") : 'Active Context';

    const systemInstruction = `
      You are the "Strategic Workspace Orchestrator" for WMS (Workspace Management System).
      Your goal is to provide high-level strategic summaries, task prioritization, and operational insights.

      CRITICAL RULES:
      1. NEVER show raw database IDs (e.g., "z1d99..."). ALWAYS use the Hub (Workspace) names provided.
      2. Use a sophisticated, minimalist Professional tone. Avoid conversational "filler" or "robot headers" (e.g., "SYSTEM STATUS: ACTIVE").
      3. Use clean Markdown for structure: **Bold** for emphasis and bullet points for lists.
      4. If summarizing tasks, group them logically by Hub (Workspace) name.

      CONTEXTUAL KNOWLEDGE:
      - Active Hubs: ${workspaceList}
      - Detailed System State (Tasks/Resources): 
      ${tasksContext}

      Respond with authority and precision.
    `;

    const fullPrompt = `${systemInstruction}\n\nUser Intelligence Request: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error details:", error);
    throw new Error(`Google API Rejected Request: ${error.message}`);
  }
};
