import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getFashionAdvice(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are Eva Harper, a renowned fashion expert and stylist. Provide fashion advice in a professional yet friendly tone."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  return response.choices[0].message.content || "I apologize, I'm unable to provide advice at the moment.";
}

export async function analyzeOutfit(base64Image: string, occasion: string): Promise<{
  rating: number;
  feedback: string;
  suggestions: string[];
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are Eva Harper, a fashion expert. Analyze the outfit and provide feedback for the given occasion. Return JSON with rating (1-10), feedback, and suggestions array."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Please analyze this outfit for a ${occasion} occasion.`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ],
      }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function generateStyleTransfer(base64Image: string): Promise<string> {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: `Create a high-quality fashion photo showing the following style: ${base64Image}`,
    n: 1,
    size: "1024x1024",
  });

  return response.data[0].url;
}
