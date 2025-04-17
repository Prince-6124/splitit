import type { NextApiRequest, NextApiResponse } from "next";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import multer from "multer";
import { promisify } from "util";
import archiver from "archiver";
import { getVideoDuration, splitVideoIntoClips } from "@/lib/ffmpegHelpers";


const UPLOAD_DIR = path.join(process.cwd(), "temp_uploads");
const OUTPUT_DIR = path.join(process.cwd(), "temp_output");

// Make directories if they don't exist
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });
const uploadMiddleware = upload.single("file");

export const config = {
  api: {
    bodyParser: false,
  },
};

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  await runMiddleware(req, res, uploadMiddleware);

  const length = parseInt(req.body.length || "30", 10);
  const filePath = (req as any).file.path;

  const clipsDir = path.join(OUTPUT_DIR, Date.now().toString());
  fs.mkdirSync(clipsDir);

  try {
    const getDuration = () =>
      new Promise<number>((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) return reject(err);
          resolve(metadata.format.duration || 0);
        });
      });

    const duration = await getVideoDuration(filePath);
    const numClips = Math.ceil(duration / length);
    await splitVideoIntoClips(filePath, clipsDir, length);


    const clipPromises = Array.from({ length: numClips }, (_, i) => {
      const start = i * length;
      const output = path.join(clipsDir, `clip_${i + 1}.mp4`);
      return new Promise<void>((resolve, reject) => {
        ffmpeg(filePath)
          .setStartTime(start)
          .setDuration(length)
          .output(output)
          .on("end", resolve)
          .on("error", reject)
          .run();
      });
    });

    await Promise.all(clipPromises);

    const zipPath = `${clipsDir}.zip`;
    const archive = archiver("zip");
    const output = fs.createWriteStream(zipPath);

    archive.pipe(output);
    archive.directory(clipsDir, false);
    await archive.finalize();

    output.on("close", () => {
      const zipStream = fs.createReadStream(zipPath);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename=clips.zip`);
      zipStream.pipe(res);
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
}
