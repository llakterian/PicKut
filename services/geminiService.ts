
import { GoogleGenAI } from "@google/genai";
import { EditRequest, GenerateRequest } from "../types";

export const editImageWithGemini = async ({ imageUri, prompt, mimeType }: EditRequest): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  const base64Data = imageUri.split(',')[1];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Instruction: ${prompt}. Process the image and return the updated result as a single image part. If the user asks for filters (like retro), lighting changes, or background removals, apply them professionally for a product showcase.`,
          },
        ],
      },
    });

    if (!response || !response.candidates || response.candidates.length === 0) {
      throw new Error("No response from AI model.");
    }

    const parts = response.candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("The AI model did not return an image part.");
  } catch (error) {
    console.error("Gemini Edit Error:", error);
    throw error;
  }
};

export const generateImageWithGemini = async ({ prompt, aspectRatio, imageSize }: GenerateRequest): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio,
          imageSize,
        },
      },
    });

    if (!response || !response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from synthesis model.");
    }

    const parts = response.candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Failed to extract image data from synthesis response.");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
