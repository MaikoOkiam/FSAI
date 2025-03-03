import Replicate from "replicate";

if (!process.env.REPLICATE_API_TOKEN) {
  throw new Error("REPLICATE_API_TOKEN environment variable is required");
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function generateStyleTransfer(imageBase64: string): Promise<string> {
  const input = {
    width: 768,
    gender: "male",
    height: 1152,
    prompt: "A photo of a person img",
    num_steps: 20,
    scheduler: "DPM++ SDE Karras",
    style_name: "(No style)",
    num_outputs: 1,
    slider_zoom: 0.5,
    slider_hands: 0.5,
    slider_viewer: 5,
    guidance_scale: 5,
    enable_fix_face: true,
    negative_prompt: "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
    slider_lighting: 2,
    slider_add_detail: 2,
    style_strength_ratio: 25,
    image: `data:image/jpeg;base64,${imageBase64}`
  };

  const output = await replicate.run(
    "catio-apps/cog-photoaistudio-generate-v2-pro:bd6e2354e39651808b1491cd39a763025a9614e17b09e58c3bab4b64f98a80a1",
    { input }
  );

  // The API returns an array of image URLs, we take the first one
  const generatedImageUrl = Array.isArray(output) ? output[0] : output;

  if (!generatedImageUrl || typeof generatedImageUrl !== 'string') {
    throw new Error("Failed to generate image");
  }

  return generatedImageUrl;
}