
"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, AlertTriangle, X } from "lucide-react";
import { Html5Qrcode, Html5QrcodeError, Html5QrcodeResult, QrcodeErrorCallback, QrcodeSuccessCallback } from "html5-qrcode";

const SCANNER_ID = "barcode-scanner-dialog";

interface BarcodeScannerDialogProps {
  onScanSuccess: (decodedText: string) => void;
}

export function BarcodeScannerDialog({ onScanSuccess }: BarcodeScannerDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  const startScanner = async () => {
    if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(SCANNER_ID);
    }
    const html5Qrcode = scannerRef.current;
    
    try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length) {
            setHasPermission(true);
            const qrCodeSuccessCallback: QrcodeSuccessCallback = (decodedText, decodedResult) => {
                onScanSuccess(decodedText);
                setIsOpen(false); // Close dialog on successful scan
            };
            const qrCodeErrorCallback: QrcodeErrorCallback = (errorMessage, error) => {
                // Ignore 'QR code parse error' which happens on every frame without a QR code.
                 if (!errorMessage.includes('QR code parse error')) {
                    console.warn(`QR Code no longer in front of camera. Error: ${errorMessage}`);
                }
            };
            await html5Qrcode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                qrCodeSuccessCallback,
                qrCodeErrorCallback
            );
        } else {
            setHasPermission(false);
        }
    } catch (err) {
        console.error("Error starting scanner:", err);
        setHasPermission(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner gracefully", err);
      }
    }
  };
  
  useEffect(() => {
    if (isOpen) {
        startScanner();
    } else {
        stopScanner();
    }
    
    return () => {
        stopScanner();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Camera className="h-4 w-4" />
          <span className="sr-only">Pindai Barcode</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pindai Barcode Produk</DialogTitle>
          <DialogDescription>
            Posisikan barcode di dalam kotak untuk memindai SKU produk secara otomatis.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center items-center rounded-lg overflow-hidden border">
           <div id={SCANNER_ID} className="w-full aspect-square"></div>
        </div>
        {!hasPermission && (
            <div className="text-destructive text-sm flex items-center gap-2 p-2 rounded-md bg-destructive/10">
                <AlertTriangle className="h-4 w-4"/>
                <span>Izin kamera ditolak. Aktifkan di pengaturan browser Anda.</span>
            </div>
        )}
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
                <X className="mr-2 h-4 w-4"/> Batal
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
