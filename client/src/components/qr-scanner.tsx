"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";

export function QrScanner({ onResult }: { onResult: (text: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => undefined);
    };
  }, []);

  const start = async () => {
    try {
      setError("");
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          onResult(decoded);
          stop();
        },
        () => undefined
      );
    } catch (err) {
      setScanning(false);
      setError((err as Error).message || "Camera access failed");
    }
  };

  const stop = async () => {
    try {
      await scannerRef.current?.stop();
      await scannerRef.current?.clear();
    } catch {
      // ignore
    }
    scannerRef.current = null;
    setScanning(false);
  };

  return (
    <div className="space-y-3">
      <div id="qr-reader" className="overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900" />
      <div className="flex gap-2">
        {!scanning ? (
          <Button type="button" onClick={start}>
            Scan QR Code
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={stop}>
            Stop scanner
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
