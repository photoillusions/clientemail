import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function generateEmailDraft(email: string, folderNumber: string): Promise<string> {
  try {
    const prompt = `
      You are a friendly assistant for "Photo Illusions", a professional event photography company.
      A customer with the email "${email}" has requested a digital copy of their photo. Their photo is from folder number "${folderNumber}".
      Generate a short, professional, and friendly email body for them. 
      Mention that their photo is attached and thank them for choosing Photo Illusions at the event.
      Do not include a subject line or signature, only the body of the email.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating email draft:", error);
    throw new Error("Failed to generate email draft. Please check your API key and network connection.");
  }
}