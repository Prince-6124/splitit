// 📁 split.ts

export async function splitVideo(file: File, length: number): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("length", length.toString());

  const response = await fetch("https://splitit-api.vercel.app/splitit", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to process the video");
  }

  return await response.blob();
}
