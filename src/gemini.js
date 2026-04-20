import { GoogleGenerativeAI } from "@google/generative-ai";

export const askAI = async (prompt, workspaceTasks, customApiKey = null, preferredModel = "gemini-flash-latest") => {
  const activeKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY;

  if (!activeKey) {
    throw new Error("No Gemini API Key found. Please add it to your settings or .env.local file. If using .env.local, YOU MUST RESTART THE SERVER `npm run dev`.");
  }

  try {
    const genAI = new GoogleGenerativeAI(activeKey);
    const model = genAI.getGenerativeModel({ model: preferredModel });

    // Handle both old single-array context and new aggregated object context
    let tasksContext = "";
    let workspaceList = "";

    if (workspaceTasks.tasks) {
      tasksContext = JSON.stringify(workspaceTasks.tasks, null, 2);
      workspaceList = workspaceTasks.workspaces.map(w => w.name).join(", ");
    } else {
      tasksContext = JSON.stringify(workspaceTasks, null, 2);
    }

    const systemInstruction = `
      You are an intelligent Workspace Assistant. Your goal is to help the user manage their productivity.
      You have access to their contextual memory across selected workspaces: ${workspaceList || 'Active Project'}.
      
      Here is the raw data (tasks/resources) in JSON format:
      ${tasksContext}

      Instructions:
      1. Always reference this specific data when answering.
      2. If multiple workspaces are selected, help the user understand the relationship between them.
      3. Respond concisely and professionally in high-contrast monochrome style.
    `;

    const fullPrompt = `${systemInstruction}\n\nUser Question: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error details:", error);
    throw new Error(`Google API Rejected Request: ${error.message}`);
  }
};
