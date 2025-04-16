import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

export async function getVideoDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

export async function splitVideoIntoClips(
  filePath: string,
  outputDir: string,
  clipLength: number
): Promise<void> {
  const duration = await getVideoDuration(filePath);
  const numClips = Math.ceil(duration / clipLength);

  fs.mkdirSync(outputDir, { recursive: true });

  const promises = Array.from({ length: numClips }, (_, i) => {
    const start = i * clipLength;
    const output = path.join(outputDir, `clip_${i + 1}.mp4`);

    return new Promise<void>((resolve, reject) => {
      ffmpeg(filePath)
        .setStartTime(start)
        .setDuration(clipLength)
        .output(output)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });
  });

  await Promise.all(promises);
}
