import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDaLMOrF_nSCjhZ5TgRntX0yKyoH18329w";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function run() {
  try {
    const result = await model.generateContent("Explain how AI works in a few words");
    console.log(result.response.text());
  } catch (error) {
    console.error("Gemini API Error:", error);
  }
}
run();
