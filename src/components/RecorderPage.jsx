import React, { useState, useRef, useEffect } from 'react';

function RecorderPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
        setAudioBlob(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop timer
      clearInterval(timerRef.current);
    }
  };

  const downloadRecording = () => {
    if (audioBlob) {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(audioBlob);
      link.download = 'recording.wav';
      link.click();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const processAudio = async () => {
    if (!audioBlob) return;

    try {
      // Create AudioContext for audio processing
      const audioContext = new AudioContext();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Example processing: get audio duration and channels
      const duration = audioBuffer.duration;
      const channels = audioBuffer.numberOfChannels;

      // You could add more processing here, like:
      // - Normalize volume
      // - Apply filters
      // - Analyze frequency
      console.log('Audio Processing:', { duration, channels });

    } catch (error) {
      console.error('Audio processing error:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Audio Recorder</h1>

      <div className="flex space-x-4 mb-4 items-center">
        {!isRecording ? (
          <button 
            onClick={startRecording}
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
          >
            Start Recording
          </button>
        ) : (
          <button 
            onClick={stopRecording}
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
          >
            Stop Recording
          </button>
        )}

        {isRecording && (
          <span className="text-red-500 font-bold">
            Recording: {formatTime(recordingTime)}
          </span>
        )}
      </div>

      {audioURL && (
        <div className="space-y-4">
          <audio controls src={audioURL} className="mb-4 w-full"></audio>

          <div className="flex space-x-4">
            <button 
              onClick={downloadRecording}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Download Recording
            </button>

            <button 
              onClick={processAudio}
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
              Process Audio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecorderPage;