import React, { useRef, useState, useEffect } from 'react';
import { Camera, Sparkles, Check, X, AlertTriangle, Upload, RefreshCw } from 'lucide-react';
import { OCRResult } from '../types';

interface BatchDateOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  onApplyOcr: (result: { batchNo: string; mfgDate: string; expDate: string }) => void;
}

export const BatchDateOcrModal: React.FC<BatchDateOcrModalProps> = ({
  isOpen,
  onClose,
  productName,
  onApplyOcr,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  // Extracted values state (editable by user)
  const [batchNo, setBatchNo] = useState<string>('');
  const [mfgDate, setMfgDate] = useState<string>('');
  const [expDate, setExpDate] = useState<string>('');
  const [rawTextSnippet, setRawTextSnippet] = useState<string>('');
  const [confidenceNote, setConfidenceNote] = useState<string>('');

  // Start camera for capturing packaging stamp
  const startCamera = async () => {
    setErrorMessage(null);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera error for OCR:', err);
      setCameraActive(false);
      setErrorMessage('Unable to start live camera preview. You can upload a photo directly instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setBatchNo('');
      setMfgDate('');
      setExpDate('');
      setConfidenceNote('');
      setRawTextSnippet('');
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Resize image to max dimension 1280px to ensure fast, reliable OCR upload without network issues
  const compressImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  // Capture current video frame to base64
  const handleSnapPhoto = async () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCamera();
      setCapturedImage(rawDataUrl);

      const optimizedImage = await compressImage(rawDataUrl);
      processImageOcr(optimizedImage);
    } catch (err: any) {
      setErrorMessage('Failed to capture snapshot: ' + err.message);
    }
  };

  // Upload photo from file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      stopCamera();
      setCapturedImage(dataUrl);
      const optimizedImage = await compressImage(dataUrl);
      processImageOcr(optimizedImage);
    };
    reader.readAsDataURL(file);
  };

  // Send snapshot to /api/ocr-details
  const processImageOcr = async (base64Img: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ocr-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Img,
          mimeType: 'image/jpeg',
        }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('OCR API is unavailable. Start the app with "npm run dev" or "npm start".');
        }
        throw new Error(`OCR service returned ${res.status}`);
      }

      let data: OCRResult;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned unexpected response (${res.status})`);
      }

      if (data.batchNo) setBatchNo(data.batchNo);
      if (data.mfgDate) setMfgDate(data.mfgDate);
      if (data.expDate) setExpDate(data.expDate);
      if (data.rawTextFound) setRawTextSnippet(data.rawTextFound);

      if (data.confidenceNotes) {
        setConfidenceNote(data.confidenceNotes);
      } else if (data.batchNo || data.expDate) {
        setConfidenceNote('Details extracted from package stamp');
      }

      if (data.success === false) {
        setErrorMessage(data.message || 'AI model could not clearly detect text. You can enter details directly in the fields below.');
      } else if (!data.batchNo && !data.expDate && !data.mfgDate) {
        setErrorMessage(data.message || 'Could not clearly distinguish batch or dates. You can type them directly in the fields below.');
      }
    } catch (err: any) {
      console.warn('OCR Request Notice:', err);
      setErrorMessage(
        'Could not scan package stamp automatically (' +
          (err.message || 'connection issue') +
          '). You can enter the Batch No & Dates manually below.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    onApplyOcr({
      batchNo: batchNo.trim(),
      mfgDate: mfgDate.trim(),
      expDate: expDate.trim(),
    });
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3 bg-neutral-900">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base leading-tight">Batch &amp; Date OCR Reader</h3>
              <p className="text-xs text-neutral-400 truncate max-w-[240px]">
                {productName || 'Scan printed package stamp'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-ocr-modal"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Instructions banner */}
          <div className="bg-neutral-800/60 rounded-xl p-3 border border-neutral-700/60 text-xs text-neutral-300">
            <p className="font-medium text-white mb-0.5">How it works:</p>
            <p className="text-neutral-400">
              Point camera at the printed stamp (e.g. &ldquo;B.No B240817, MFD 08/26, EXP 08/27&rdquo;) and tap &ldquo;Take Photo&rdquo;. You can review and edit detected details before applying.
            </p>
          </div>

          {/* Camera View or Captured Snapshot */}
          <div className="relative aspect-[4/3] w-full max-h-[260px] bg-black rounded-xl overflow-hidden border border-neutral-700 flex items-center justify-center">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  autoPlay
                  muted
                />
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[85%] h-[40%] border-2 border-dashed border-indigo-400/70 rounded-lg flex items-center justify-center">
                      <span className="text-[11px] font-mono text-indigo-300 bg-black/60 px-2 py-0.5 rounded">
                        Aim at Batch &amp; Expiry Stamp
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Captured package stamp"
                className="w-full h-full object-contain bg-neutral-950"
              />
            )}

            {isLoading && (
              <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mb-2" />
                <span className="text-xs font-semibold text-white">Reading printed stamp with AI OCR...</span>
                <span className="text-[11px] text-neutral-400 mt-1">Detecting Batch No, MFG Date &amp; EXP Date</span>
              </div>
            )}
          </div>

          {/* Photo Capture Actions */}
          <div className="flex items-center gap-2">
            {!capturedImage ? (
              <>
                <button
                  id="btn-snap-ocr-photo"
                  type="button"
                  disabled={!cameraActive || isLoading}
                  onClick={handleSnapPhoto}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Camera className="h-4 w-4" />
                  Take Photo &amp; Read
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCapturedImage(null);
                  startCamera();
                }}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retake Photo
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {errorMessage && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {confidenceNote && (
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-lg px-2.5 py-1.5">
              <Check className="h-3.5 w-3.5 shrink-0" />
              <span>{confidenceNote}</span>
            </div>
          )}

          {/* Editable Results Form */}
          <div className="bg-neutral-950 rounded-xl p-3 border border-neutral-800 space-y-3">
            <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Verify / Edit Detected Values
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Batch No
                </label>
                <input
                  id="input-ocr-batch"
                  type="text"
                  placeholder="e.g. B240817"
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  MFG Date
                </label>
                <input
                  id="input-ocr-mfg"
                  type="text"
                  placeholder="e.g. 08/2026"
                  value={mfgDate}
                  onChange={(e) => setMfgDate(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  EXP Date
                </label>
                <input
                  id="input-ocr-exp"
                  type="text"
                  placeholder="e.g. 08/2027"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {rawTextSnippet && (
              <div className="text-[11px] text-neutral-500 font-mono truncate">
                Raw read: {rawTextSnippet}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 px-4 py-3 bg-neutral-950 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-apply-ocr"
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
          >
            <Check className="h-4 w-4" />
            Apply to Item
          </button>
        </div>
      </div>
    </div>
  );
};
