import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';

const css = `
.scan-page {
  max-width: 620px;
  margin: 0 auto;
  padding: 18px 0 56px;
}

.scan-header {
  text-align: center;
  margin-bottom: 22px;
}

.scan-title {
  font-size: 30px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 4px;
  letter-spacing: -0.01em;
}

.scan-subtitle {
  font-size: 14px;
  color: rgba(255,255,255,0.58);
}

.scanner-wrapper {
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  background: #000;
  border: 1px solid rgba(255,255,255,0.16);
  margin-bottom: 18px;
  box-shadow: 0 24px 70px rgba(0,0,0,0.35);
}

.scanner-wrapper video {
  border-radius: 26px;
}

.scanner-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.scan-corners {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
}

.scan-corner {
  position: absolute;
  width: 28px;
  height: 28px;
  border-color: #C8102E;
  border-style: solid;
}

.scan-corner.tl { top: 0; left: 0; border-width: 3px 0 0 3px; border-radius: 6px 0 0 0; }
.scan-corner.tr { top: 0; right: 0; border-width: 3px 3px 0 0; border-radius: 0 6px 0 0; }
.scan-corner.bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; border-radius: 0 0 0 6px; }
.scan-corner.br { bottom: 0; right: 0; border-width: 0 3px 3px 0; border-radius: 0 0 6px 0; }

.scan-line {
  position: absolute;
  left: 10%;
  width: 80%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #C8102E, transparent);
  animation: scanMove 2s ease-in-out infinite;
  box-shadow: 0 0 12px rgba(200,16,46,0.5);
}

@keyframes scanMove {
  0%, 100% { top: 25%; }
  50% { top: 75%; }
}

.scan-status {
  text-align: center;
  padding: 16px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
}

.status-scanning {
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.15);
}

.status-success {
  background: rgba(16, 185, 129, 0.08);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.15);
}

.status-error {
  background: rgba(239, 68, 68, 0.08);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.scan-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  margin-bottom: 10px;
}

.btn-start {
  background: linear-gradient(135deg, #df1526, #b40724);
  color: #fff;
  box-shadow: 0 18px 32px rgba(200, 16, 46, 0.22);
}
.btn-start:hover { transform: translateY(-1px); filter: brightness(1.04); }

.btn-stop {
  background: #ef4444;
  color: #fff;
}
.btn-stop:hover { background: #dc2626; }

.btn-manual {
  background: rgba(255,255,255,0.06);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.12);
}
.btn-manual:hover { background: rgba(255,255,255,0.09); }

.manual-input-wrap {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.manual-input {
  flex: 1;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.12);
  font-size: 13px;
  outline: none;
  background: rgba(255,255,255,0.06);
  color: #fff;
  transition: border-color 0.2s;
}
.manual-input:focus { border-color: #C8102E; }

.manual-go {
  padding: 12px 20px;
  border-radius: 10px;
  border: none;
  background: #C8102E;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
}
.manual-go:hover { background: #a80e27; }

.scan-instructions {
  padding: 20px;
  border-radius: 22px;
  background: #111515;
  border: 1px solid #222A2A;
  margin-top: 20px;
  box-shadow: 0 18px 55px rgba(0,0,0,0.22);
}

.scan-instructions h3 {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 10px;
}

.scan-instructions ol {
  padding-left: 18px;
  margin: 0;
}

.scan-instructions li {
  font-size: 12px;
  color: rgba(255,255,255,0.58);
  margin-bottom: 6px;
  line-height: 1.5;
}

.scan-instructions strong {
  color: rgba(255,255,255,0.9);
}

.camera-placeholder {
  aspect-ratio: 1;
  max-height: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 13px;
  gap: 12px;
  background: #0a0a0a;
  border-radius: 26px;
}

.camera-placeholder svg {
  opacity: 0.4;
}
`;

export default function ScanQR() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | scanning | success | error
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const extractSlug = (text) => {
    // Handle full URL like http://localhost:5173/entry/abc123 or just the slug
    const match = text.match(/\/entry\/([a-zA-Z0-9]+)/);
    if (match) return match[1];
    // If it's just a hex slug
    if (/^[a-f0-9]{16,}$/i.test(text)) return text;
    return null;
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try {
        if (html5QrRef.current.isScanning) {
          await html5QrRef.current.stop();
        }
        html5QrRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      html5QrRef.current = null;
    }
    setScanning(false);
    if (status !== 'success') setStatus('idle');
  };

  const handleScanSuccess = async (decodedText) => {
    const slug = extractSlug(decodedText);
    if (slug) {
      setStatus('success');
      toast.success('QR Code detected! Redirecting...');
      await stopScanner();
      navigate(`/entry/${slug}`);
    } else {
      setStatus('error');
      setErrorMsg('Invalid QR code. Please scan a Red Ball sport QR code.');
    }
  };

  const startScanner = async () => {
    setStatus('scanning');
    setErrorMsg('');
    setScanning(true);

    try {
      if (html5QrRef.current) {
        await stopScanner();
      }
      
      const container = document.getElementById('qr-reader');
      if (container) {
        const originalRemoveChild = container.removeChild;
        container.removeChild = function(child) {
          if (child && child.parentNode === this) {
            try {
              return originalRemoveChild.call(this, child);
            } catch (e) {
              console.warn('Ignored removeChild on container:', e);
            }
          }
          return child;
        };
      }

      const html5Qr = new Html5Qrcode('qr-reader');
      html5QrRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        handleScanSuccess,
        () => {} // ignore scan failures (frames without QR)
      );
    } catch (err) {
      console.error('Camera error:', err);
      setStatus('error');
      setErrorMsg('Camera access denied or not available. Try manual entry instead.');
      setScanning(false);
    }
  };

  const handleManualGo = () => {
    const slug = extractSlug(manualCode) || manualCode.trim();
    if (!slug) {
      toast.error('Please enter a valid QR code or entry URL');
      return;
    }
    stopScanner().then(() => {
      navigate(`/entry/${slug}`);
    }).catch(() => {
      navigate(`/entry/${slug}`);
    });
  };

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (html5QrRef.current) {
        const scanner = html5QrRef.current;
        if (scanner.isScanning) {
          // Temporarily patch document.getElementById to return a dummy element
          // with removeChild mocked, preventing library unmount crashes
          const originalGet = document.getElementById;
          document.getElementById = function(id) {
            const el = originalGet.call(document, id);
            if (!el && id === 'qr-reader') {
              const dummy = document.createElement('div');
              dummy.removeChild = (c) => c;
              return dummy;
            }
            return el;
          };

          scanner.stop().then(() => {
            try {
              scanner.clear();
            } catch (e) {}
            document.getElementById = originalGet;
          }).catch(() => {
            document.getElementById = originalGet;
          });
        }
      }
    };
  }, []);

  return (
    <>
      <style>{css}</style>
      <div className="scan-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="scan-header"
        >
          <div className="scan-title">Scan QR Code</div>
          <div className="scan-subtitle">Point your camera at the sport entrance QR code</div>
        </motion.div>

        {/* Scanner Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="scanner-wrapper"
        >
          <div id="qr-reader" ref={scannerRef}>
            {!scanning && (
              <div className="camera-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span>Camera preview will appear here</span>
              </div>
            )}
          </div>
          {scanning && (
            <div className="scanner-overlay">
              <div className="scan-corners">
                <div className="scan-corner tl" />
                <div className="scan-corner tr" />
                <div className="scan-corner bl" />
                <div className="scan-corner br" />
                <div className="scan-line" />
              </div>
            </div>
          )}
        </motion.div>

        {/* Status */}
        {status === 'scanning' && (
          <div className="scan-status status-scanning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}>
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Scanning... Point at a sport QR code
          </div>
        )}
        {status === 'success' && (
          <div className="scan-status status-success">
            QR Code detected! Redirecting to entry...
          </div>
        )}
        {status === 'error' && errorMsg && (
          <div className="scan-status status-error">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        {!scanning ? (
          <button className="scan-btn btn-start" onClick={startScanner}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Open Camera & Scan
          </button>
        ) : (
          <button className="scan-btn btn-stop" onClick={stopScanner}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
            Stop Scanner
          </button>
        )}

        {/* Manual Entry Toggle */}
        {!manualMode ? (
          <button className="scan-btn btn-manual" onClick={() => setManualMode(true)}>
            Or enter code manually
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="manual-input-wrap">
              <input
                className="manual-input"
                placeholder="Paste entry URL or code..."
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualGo()}
              />
              <button className="manual-go" onClick={handleManualGo}>Go</button>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <div className="scan-instructions">
          <h3>How it works</h3>
          <ol>
            <li>Look for the <strong>QR code</strong> displayed at the sport entrance (Badminton, Box Cricket, Gym, etc.)</li>
            <li>Tap <strong>"Open Camera & Scan"</strong> above and point your phone at the QR code</li>
            <li>You'll be taken to the <strong>entry portal</strong> where you can check-in instantly if you have a membership</li>
            <li>No membership? You can <strong>buy one-time access</strong> or <strong>purchase a plan</strong> right from the entry screen</li>
          </ol>
        </div>
      </div>
    </>
  );
}
