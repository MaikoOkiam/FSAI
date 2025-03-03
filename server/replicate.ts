import Replicate from "replicate";

if (!process.env.REPLICATE_API_TOKEN) {
  throw new Error("REPLICATE_API_TOKEN environment variable is required");
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function generateStyleTransfer(imageBase64: string): Promise<string> {
  // Convert base64 to URL
  const input = {
    image: `data:image/jpeg;base64,${imageBase64}`,
    prompt: "professional fashion photography style",
    negative_prompt: "ugly, blurry, low quality",
    num_inference_steps: 30,
    guidance_scale: 7.5,
    controlnet_conditioning_scale: 1.0,
    control_guidance_start: 0.0,
    control_guidance_end: 1.0,
  };

  const output = await replicate.run(
    "catio-apps/cog-photoaistudio-generate-v2-pro:7c4f4d1c5ffd43be724de467f2cee830ea1cce7f43a01a0b665fe356bc8c9d57",
    { input }
  );

  // The API returns an array of image URLs, we take the first one
  const generatedImageUrl = Array.isArray(output) ? output[0] : output;

  if (!generatedImageUrl || typeof generatedImageUrl !== 'string') {
    throw new Error("Failed to generate image");
  }

  return generatedImageUrl;
}
