import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [length, setLength] = useState(30);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("length", length.toString());

    const res = await fetch("/api/split", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } else {
      alert("Error splitting video.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 p-6">
          <Input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <Input
            type="number"
            placeholder="Clip length in seconds"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
          />
          <Button onClick={handleUpload} disabled={loading}>
            {loading ? "Splitting..." : "Split Video"}
          </Button>
          {downloadUrl && (
            <a href={downloadUrl} download="clips.zip" className="text-blue-500 underline block">
              Download ZIP
            </a>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
