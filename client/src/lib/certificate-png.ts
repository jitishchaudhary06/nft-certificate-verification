export async function downloadCertificatePng(input: {
  title: string;
  studentName: string;
  course: string;
  university: string;
  grade?: string;
  issueDate?: string;
  tokenId?: string;
  fileName?: string;
}) {
  const width = 1200;
  const height = 850;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#ecfdf5");
  gradient.addColorStop(1, "#f8fafc");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#0f766e";
  ctx.lineWidth = 8;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  ctx.fillStyle = "#0f766e";
  ctx.font = "600 28px Georgia, serif";
  ctx.fillText("CertChain", 80, 120);

  ctx.fillStyle = "#0b1220";
  ctx.font = "700 48px Georgia, serif";
  ctx.fillText(input.title.slice(0, 48), 80, 220);

  ctx.fillStyle = "#334155";
  ctx.font = "400 28px system-ui, sans-serif";
  ctx.fillText(input.studentName, 80, 300);
  ctx.fillText(input.university, 80, 350);
  ctx.fillText(`Course: ${input.course}`, 80, 420);
  if (input.grade) ctx.fillText(`Grade: ${input.grade}`, 80, 470);
  if (input.issueDate) ctx.fillText(`Issued: ${input.issueDate}`, 80, 520);
  if (input.tokenId) ctx.fillText(`Token: ${input.tokenId}`, 80, 570);

  ctx.fillStyle = "#64748b";
  ctx.font = "400 18px system-ui, sans-serif";
  ctx.fillText("Verified NFT academic credential", 80, height - 80);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Failed to create PNG");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = input.fileName || `certificate-${input.tokenId || "export"}.png`;
  a.click();
  URL.revokeObjectURL(url);
}
