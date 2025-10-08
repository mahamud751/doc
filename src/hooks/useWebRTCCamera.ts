import { useEffect, useRef } from "react";

export const useWebRTCCamera = (enabled: boolean) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (enabled && videoRef.current && !streamRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            console.log("✅ Camera activated!");
          }
        })
        .catch((err) => {
          console.log("❌ Camera access denied:", err);
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [enabled]);

  return videoRef;
};
