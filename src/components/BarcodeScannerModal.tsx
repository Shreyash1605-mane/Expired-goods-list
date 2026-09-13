import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Zap, ZapOff, AlertCircle, X, CheckCircle, Upload, Keyboard } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { playScanBeep } from '../utils/audioChime';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onBarcodeDetected,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSecureContext, setIsSecureContext] = useState<boolean>(true);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [manualInput, setManualInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [detectingStatus, setDetectingStatus] = useState<string>('Searching for barcode...');

  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const zxingReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const isDetectedRef = useRef<boolean>(false);

  // Check secure context on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      setIsSecureContext(isHttps);
      if (window.location.protocol === 'file:') {
        setErrorMessage('Camera access is not permitted when opening directly from a file:// path. Please run on HTTPS or localhost.');
      }
    }
  }, []);

  // Stop camera helper
  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (zxingReaderRef.current) {
      try {
        zxingReaderRef.current.reset();
      } catch (e) {
        // ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
    setIsScanning(false);
  };

  // Start camera stream
  const startCamera = async (deviceId?: string) => {
    stopCamera();
    setErrorMessage(null);
    setHasPermission(null);
    isDetectedRef.current = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Camera API is not supported in this browser environment. Please use Manual Entry or Upload Photo.');
      setHasPermission(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (fallbackErr) {
        // Try relaxed video constraints if environment facingMode fails
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
      }

      // Check for torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        setTorchSupported(Boolean(capabilities.torch));
      }

      // Enumerate available cameras
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
        if (!selectedDeviceId && videoTrack) {
          const settings = videoTrack.getSettings();
          if (settings.deviceId) {
            setSelectedDeviceId(settings.deviceId);
          }
        }
      } catch (enumErr) {
        console.warn('Could not enumerate video devices:', enumErr);
      }

      // Start detection engine
      startDetectionEngine();
    } catch (err: any) {
      console.error('Camera launch error:', err);
      setHasPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission was denied. Please allow camera access in your browser settings, or use manual entry below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera found on this device. Please use manual entry.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorMessage('Camera is currently in use by another application or tab.');
      } else {
        setErrorMessage(`Unable to access camera: ${err.message || 'Unknown error'}.`);
      }
    }
  };

  // Toggle flashlight / torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Failed to toggle torch:', e);
    }
  };

  // Switch camera device
  const handleSwitchCamera = () => {
    if (availableDevices.length <= 1) return;
    const currentIndex = availableDevices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % availableDevices.length;
    const nextDevice = availableDevices[nextIndex];
    setSelectedDeviceId(nextDevice.deviceId);
    startCamera(nextDevice.deviceId);
  };

  // Main Detection Engine: uses native BarcodeDetector if available, otherwise @zxing
  const startDetectionEngine = () => {
    const hasNativeBarcodeDetector = 'BarcodeDetector' in window;

    if (hasNativeBarcodeDetector) {
      let barcodeDetector: any;
      try {
        barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'itf'],
        });
      } catch (e) {
        barcodeDetector = null;
      }

      if (barcodeDetector) {
        setDetectingStatus('Ready: Aim at barcode');
        const detectFrame = async () => {
          if (!videoRef.current || !streamRef.current || isDetectedRef.current) return;

          if (videoRef.current.readyState >= 2) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0 && !isDetectedRef.current) {
                const code = barcodes[0].rawValue;
                if (code && code.trim()) {
                  handleSuccessDetected(code.trim());
                  return;
                }
              }
            } catch (err) {
              // Frame dropped, continue loop
            }
          }
          animFrameRef.current = requestAnimationFrame(detectFrame);
        };

        animFrameRef.current = requestAnimationFrame(detectFrame);
        return;
      }
    }

    // Fallback: ZXing MultiFormatReader
    try {
      setDetectingStatus('Using high-accuracy barcode reader...');
      const codeReader = new BrowserMultiFormatReader();
      zxingReaderRef.current = codeReader;

      if (videoRef.current) {
        // Continuous decoding loop using decodeFromVideoElement
        const decodeLoop = async () => {
          if (!videoRef.current || isDetectedRef.current) return;
          try {
            const result = await (codeReader as any).decodeFromVideoElement(videoRef.current);
            if (result && !isDetectedRef.current) {
              const text = typeof result.getText === 'function' ? result.getText() : (result as any).text;
              if (text && text.trim()) {
                handleSuccessDetected(text.trim());
                return;
              }
            }
          } catch (e) {
            // Keep scanning frames
          }
          if (!isDetectedRef.current) {
            animFrameRef.current = requestAnimationFrame(decodeLoop);
          }
        };
        animFrameRef.current = requestAnimationFrame(decodeLoop);
      }
    } catch (zxingErr) {
      console.error('ZXing initialization failed:', zxingErr);
      setDetectingStatus('Live decoding unavailable. Please use photo capture or manual entry.');
    }
  };

  const handleSuccessDetected = (code: string) => {
    if (isDetectedRef.current) return;
    isDetectedRef.current = true;
    playScanBeep();
    stopCamera();
    onBarcodeDetected(code);
    onClose();
  };

  // Decode barcode from an uploaded image / captured photo file
  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDetectingStatus('Analyzing uploaded photo for barcode...');
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.src = dataUrl;
        img.onload = async () => {
          // Try native detector first
          if ('BarcodeDetector' in window) {
            try {
              const detector = new (window as any).BarcodeDetector({
                formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
              });
              const results = await detector.detect(img);
              if (results && results.length > 0) {
                handleSuccessDetected(results[0].rawValue);
                return;
              }
            } catch (nativeErr) {
              // fall through to zxing
            }
          }

          // Try ZXing reader
          try {
            const zxingReader = new BrowserMultiFormatReader();
            const result = await zxingReader.decodeFromImageElement(img);
            if (result && result.getText()) {
              handleSuccessDetected(result.getText());
              return;
            }
          } catch (zxErr) {
            alert('Could not detect barcode from the photo. Please enter the barcode number manually.');
            setActiveTab('manual');
          }
        };
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert('Error reading image file: ' + err.message);
    }
  };

  // Modal lifecycle
  useEffect(() => {
    if (isOpen) {
      isDetectedRef.current = false;
      setActiveTab('camera');
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3 bg-neutral-900/90">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base leading-tight">Barcode Scanner</h3>
              <p className="text-xs text-neutral-400">Scan product barcode in Godown</p>
            </div>
          </div>
          <button
            id="btn-close-scanner-modal"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher: Camera vs Manual Entry */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 p-1">
          <button
            id="btn-tab-camera"
            onClick={() => {
              setActiveTab('camera');
              if (!isScanning) startCamera(selectedDeviceId);
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'camera'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Camera className="h-4 w-4" />
            Live Camera
          </button>
          <button
            id="btn-tab-manual"
            onClick={() => {
              setActiveTab('manual');
              stopCamera();
            }}
            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition ${
              activeTab === 'manual'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Keyboard className="h-4 w-4" />
            Manual Entry / Photo
          </button>
        </div>

        {/* Main View Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-center items-center min-h-[340px]">
          {activeTab === 'camera' ? (
            <div className="w-full flex flex-col items-center">
              {/* Camera Video Container with Target Reticle */}
              <div className="relative w-full aspect-[4/3] max-h-[360px] bg-black rounded-xl overflow-hidden border border-neutral-700 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  autoPlay
                  muted
                />

                {/* Reticle / Viewfinder Frame */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-[78%] h-[55%] border-2 border-emerald-400/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                      {/* Laser scanning line */}
                      <div className="absolute left-1 right-1 h-0.5 bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse top-1/2 -translate-y-1/2" />
                      
                      {/* Corner marks */}
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-300" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-300" />
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-300" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-300" />

                      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-mono font-medium text-emerald-300 bg-black/70 px-2 py-0.5 rounded">
                        Align Barcode Inside Frame
                      </span>
                    </div>
                  </div>
                )}

                {/* Error or Permission State Overlay */}
                {hasPermission === false && (
                  <div className="absolute inset-0 bg-neutral-900/95 p-6 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
                    <h4 className="text-white font-semibold text-base mb-1">Camera Notice</h4>
                    <p className="text-xs text-neutral-300 max-w-xs mb-4">
                      {errorMessage || 'Unable to access the camera stream. Please check camera permissions in your browser.'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startCamera(selectedDeviceId)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry Permission
                      </button>
                      <button
                        onClick={() => setActiveTab('manual')}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5"
                      >
                        <Keyboard className="h-3.5 w-3.5" />
                        Enter Manually
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls Bar */}
              <div className="w-full flex items-center justify-between mt-3 px-1">
                {/* Status Indicator */}
                <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                  <span className={`h-2 w-2 rounded-full ${isScanning ? 'bg-emerald-500 animate-ping' : 'bg-neutral-500'}`} />
                  <span className="text-[11px] text-neutral-400">{detectingStatus}</span>
                </div>

                {/* Action Buttons: Flash & Switch Camera */}
                <div className="flex items-center gap-2">
                  {torchSupported && (
                    <button
                      id="btn-toggle-torch"
                      type="button"
                      onClick={toggleTorch}
                      className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                        torchOn ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                      title={torchOn ? 'Turn Flashlight Off' : 'Turn Flashlight On'}
                    >
                      {torchOn ? <ZapOff className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                      <span className="hidden sm:inline">{torchOn ? 'Torch On' : 'Torch'}</span>
                    </button>
                  )}

                  {availableDevices.length > 1 && (
                    <button
                      id="btn-switch-camera"
                      type="button"
                      onClick={handleSwitchCamera}
                      className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-xs font-medium flex items-center gap-1 transition"
                      title="Switch Camera (Front/Rear)"
                    >
                      <RefreshCw className="h-4 w-4" />
                      <span className="hidden sm:inline">Flip</span>
                    </button>
                  )}

                  <button
                    id="btn-photo-upload-fallback"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-xs font-medium flex items-center gap-1 transition"
                    title="Take or upload photo to scan barcode"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Photo</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileCapture}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Manual Barcode Entry Tab */
            <div className="w-full flex flex-col gap-4 py-2">
              <div className="bg-neutral-800/60 rounded-xl p-4 border border-neutral-700/60">
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Type or Paste Product Barcode Number
                </label>
                <div className="flex gap-2">
                  <input
                    id="input-manual-barcode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="e.g. 8901234567890"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && manualInput.trim()) {
                        handleSuccessDetected(manualInput.trim());
                      }
                    }}
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    id="btn-submit-manual-barcode"
                    type="button"
                    disabled={!manualInput.trim()}
                    onClick={() => {
                      if (manualInput.trim()) {
                        handleSuccessDetected(manualInput.trim());
                      }
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Search
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 mt-2">
                  Use this if camera is unavailable or barcode on the carton is torn/smudged.
                </p>
              </div>

              {/* Photo Upload Option */}
              <div className="bg-neutral-800/40 rounded-xl p-3 border border-neutral-700/40 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-semibold text-neutral-200">Have a photo of the barcode?</h5>
                  <p className="text-[11px] text-neutral-400">Choose an image from gallery or phone storage</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Select Image
                </button>
              </div>

              {/* Quick Test Barcodes from Master */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1.5">
                  Quick Select Sample Warehouse Barcodes:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { code: '8901234567890', name: 'KitKat 45g (₹25)' },
                    { code: '8901234567891', name: 'Munch 10g (₹10)' },
                    { code: '8901030012345', name: 'Maggi 70g (₹14)' },
                    { code: '8901725181234', name: 'Milk Powder (₹240)' },
                  ].map((sample) => (
                    <button
                      key={sample.code}
                      type="button"
                      onClick={() => {
                        setManualInput(sample.code);
                        handleSuccessDetected(sample.code);
                      }}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-md text-[11px] text-neutral-300 transition"
                    >
                      <span className="font-mono text-emerald-400 mr-1">{sample.code.slice(-4)}:</span>
                      {sample.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="border-t border-neutral-800 px-4 py-2.5 bg-neutral-950/80 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Target standard EAN-13, UPC, or Code 128 retail barcodes</span>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-neutral-400 hover:text-white underline text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
