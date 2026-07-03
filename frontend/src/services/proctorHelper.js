import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

// Load TensorFlow.js and BlazeFace directly from node_modules
export const loadTensorFlowAndBlazeFace = async () => {
  try {
    await tf.ready();
    const model = await blazeface.load();
    return model;
  } catch (err) {
    throw new Error("Failed to initialize BlazeFace model: " + err.message);
  }
};

// Initialize webcam stream
export const startCamera = async (videoElement) => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Webcam access is not supported by this browser.");
  }

  const constraints = {
    video: {
      facingMode: 'user',
      width: { ideal: 640 },
      height: { ideal: 480 }
    },
    audio: false
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  if (videoElement) {
    videoElement.srcObject = stream;
    videoElement.setAttribute("playsinline", "true"); // critical for iOS Safari
    videoElement.muted = true;
    await videoElement.play().catch(err => console.log("Video play interrupted:", err));
  }
  return stream;
};

// Stop webcam stream tracks
export const stopStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
};

// Initialize voice detection using Web Audio API
export const startVoiceDetection = async (onVoiceDetected, threshold = 0.05) => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.warn("Microphone access is not supported by this browser.");
    return null;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    
    // Use Web Audio API
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("Web Audio API is not supported.");
      return { stream };
    }

    const audioContext = new AudioContextClass();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    
    analyser.fftSize = 512;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let isMonitoring = true;

    const checkVolume = () => {
      if (!isMonitoring) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume (RMS-like)
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // Scale average to a 0-1 range (max value is 255)
      const normalizedVolume = average / 255;
      
      if (normalizedVolume > threshold) {
        onVoiceDetected(normalizedVolume);
      }

      requestAnimationFrame(checkVolume);
    };

    checkVolume();

    return {
      stream,
      audioContext,
      stop: () => {
        isMonitoring = false;
        if (audioContext.state !== 'closed') {
          audioContext.close();
        }
        stream.getTracks().forEach(track => track.stop());
      }
    };
  } catch (err) {
    console.warn("Microphone access denied or error:", err);
    return null;
  }
};

// Start recording combined stream using MediaRecorder
export const startMediaRecorder = (stream) => {
  const options = { mimeType: 'video/webm;codecs=vp8,opus' };
  
  // Fallbacks for browser support (e.g. Safari on iOS preferences)
  if (typeof MediaRecorder !== 'undefined') {
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a')) {
        options.mimeType = 'video/mp4;codecs=avc1,mp4a';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options.mimeType = 'video/mp4';
      } else {
        options.mimeType = ''; // Let browser decide
      }
    }
  } else {
    console.warn("MediaRecorder is not supported in this browser.");
    return null;
  }

  const recordedChunks = [];
  const recorder = new MediaRecorder(stream, options);

  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  recorder.start(1000); // slice every 1 second
  console.log("🎥 MediaRecorder started with mimeType:", recorder.mimeType);

  return {
    recorder,
    recordedChunks
  };
};

// Stop recording and return combined Blob
export const stopMediaRecorder = (recorderState) => {
  return new Promise((resolve) => {
    if (!recorderState || !recorderState.recorder) {
      resolve(null);
      return;
    }

    const { recorder, recordedChunks } = recorderState;
    
    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: recorder.mimeType || 'video/webm' });
      resolve(blob);
    };

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
    console.log("🎥 MediaRecorder stopped");
  });
};

// Convert blob to base64
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    if (!blob) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      resolve(reader.result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};
