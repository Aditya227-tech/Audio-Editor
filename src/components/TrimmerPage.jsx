import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

function TrimmerPage() {
  const [audioFile, setAudioFile] = useState(null);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isWaveformReady, setIsWaveformReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const timelineRef = useRef(null);
  const fileRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupWaveSurfer();
    };
  }, []);

  const cleanupWaveSurfer = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.unAll(); // Remove all event listeners
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }
  };

  const resetState = () => {
    setIsWaveformReady(false);
    setIsPlaying(false);
    setTrimStart(0);
    setTrimEnd(0);
    setDuration(0);
    setError(null);
  };

  const initializeWaveSurfer = async (file) => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure complete cleanup
      await cleanupWaveSurfer();

      // Reset all states
      resetState();

      // Create new WaveSurfer instance
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'violet',
        progressColor: 'purple',
        responsive: true,
        height: 100,
        normalize: true,
        backend: 'WebAudio',
      });

      // Store the instance first
      wavesurferRef.current = wavesurfer;

      // Set up event listeners before loading the file
      return new Promise((resolve, reject) => {
        const setupComplete = new Promise((setupResolve) => {
          wavesurfer.once('ready', () => {
            const audioDuration = wavesurfer.getDuration();
            setDuration(audioDuration);
            setTrimEnd(audioDuration);
            setIsWaveformReady(true);
            setIsLoading(false);
            createTimeline(audioDuration);
            setupResolve();
          });

          wavesurfer.once('error', (err) => {
            console.error('WaveSurfer error:', err);
            setError('Error loading audio file. Please try again.');
            setIsLoading(false);
            reject(err);
          });
        });

        // Create a blob URL if we have a File object
        const fileUrl = file instanceof File ? URL.createObjectURL(file) : file;

        // Load the file after setting up event listeners
        wavesurfer.load(fileUrl);

        // Cleanup URL after setup is complete
        setupComplete.finally(() => {
          if (file instanceof File) {
            URL.revokeObjectURL(fileUrl);
          }
        });

        resolve(setupComplete);
      });
    } catch (error) {
      console.error('Error initializing WaveSurfer:', error);
      setError('Failed to initialize audio processor. Please try again.');
      setIsLoading(false);
      throw error;
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Reset the error state
      setError(null);

      // Store file reference
      fileRef.current = file;
      setAudioFile(file);

      // Initialize WaveSurfer with the file
      await initializeWaveSurfer(file);
    } catch (error) {
      console.error('Error handling file upload:', error);
      setError('Failed to process audio file. Please try again.');
      setIsLoading(false);
      resetState();

      // Reset file input
      if (event.target) {
        event.target.value = '';
      }

      // Clear file references
      fileRef.current = null;
      setAudioFile(null);
    }
  };

  const createTimeline = (totalDuration) => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    // Clear existing content
    timeline.innerHTML = '';

    // Create duration display
    const durationDisplay = document.createElement('div');
    durationDisplay.textContent = `Total Duration: ${totalDuration.toFixed(2)} seconds`;
    durationDisplay.className = 'text-sm text-gray-600 mb-2';
    timeline.appendChild(durationDisplay);

    // Create timeline track
    const timelineTrack = document.createElement('div');
    timelineTrack.className = 'relative w-full h-8 bg-gray-200 rounded-full';

    // Create markers
    const startMarker = document.createElement('div');
    startMarker.className = 'absolute left-0 top-0 w-4 h-8 bg-blue-500 rounded-l-full cursor-pointer';
    startMarker.style.transform = 'translateX(0%)';

    const endMarker = document.createElement('div');
    endMarker.className = 'absolute right-0 top-0 w-4 h-8 bg-red-500 rounded-r-full cursor-pointer';
    endMarker.style.transform = 'translateX(100%)';

    // Add markers to track
    timelineTrack.appendChild(startMarker);
    timelineTrack.appendChild(endMarker);
    timeline.appendChild(timelineTrack);

    // Add drag event listeners
    startMarker.addEventListener('mousedown', startDragStart);
    endMarker.addEventListener('mousedown', startDragEnd);
  };

  // Drag handling functions
  const startDragStart = (e) => {
    e.preventDefault();
    setIsDraggingStart(true);
    document.addEventListener('mousemove', dragStart);
    document.addEventListener('mouseup', stopDragStart);
  };

  const startDragEnd = (e) => {
    e.preventDefault();
    setIsDraggingEnd(true);
    document.addEventListener('mousemove', dragEnd);
    document.addEventListener('mouseup', stopDragEnd);
  };

  const dragStart = (e) => {
    if (!isDraggingStart) return;
    const timeline = timelineRef.current;
    const timelineRect = timeline.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - timelineRect.left) / timelineRect.width));
    const newStart = percent * duration;

    if (newStart < trimEnd) {
      setTrimStart(newStart);
      updateTimelineMarkers();
    }
  };

  const dragEnd = (e) => {
    if (!isDraggingEnd) return;
    const timeline = timelineRef.current;
    const timelineRect = timeline.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - timelineRect.left) / timelineRect.width));
    const newEnd = percent * duration;

    if (newEnd > trimStart) {
      setTrimEnd(newEnd);
      updateTimelineMarkers();
    }
  };

  const stopDragStart = () => {
    setIsDraggingStart(false);
    document.removeEventListener('mousemove', dragStart);
    document.removeEventListener('mouseup', stopDragStart);
  };

  const stopDragEnd = () => {
    setIsDraggingEnd(false);
    document.removeEventListener('mousemove', dragEnd);
    document.removeEventListener('mouseup', stopDragEnd);
  };

  const updateTimelineMarkers = () => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const startMarker = timeline.querySelector('div > div:first-child');
    const endMarker = timeline.querySelector('div > div:last-child');

    if (startMarker && endMarker) {
      const startPercent = (trimStart / duration) * 100;
      const endPercent = (trimEnd / duration) * 100;

      startMarker.style.transform = `translateX(${startPercent}%)`;
      endMarker.style.transform = `translateX(${endPercent}%)`;
    }
  };

  const togglePlayPause = () => {
    if (!wavesurferRef.current) return;

    if (isPlaying) {
      wavesurferRef.current.pause();
    } else {
      wavesurferRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTrim = () => {
    if (!audioFile || !wavesurferRef.current) return;

    const audioContext = new AudioContext();
    const reader = new FileReader();

    reader.onload = (e) => {
      audioContext.decodeAudioData(e.target.result, (buffer) => {
        // Trim the audio buffer
        const trimmedBuffer = audioContext.createBuffer(
          buffer.numberOfChannels,
          Math.floor((trimEnd - trimStart) * buffer.sampleRate),
          buffer.sampleRate
        );

        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          const trimmedChannelData = trimmedBuffer.getChannelData(channel);

          const startSample = Math.floor(trimStart * buffer.sampleRate);
          const endSample = Math.floor(trimEnd * buffer.sampleRate);

          for (let i = 0; i < trimmedBuffer.length; i++) {
            trimmedChannelData[i] = channelData[startSample + i];
          }
        }

        // Convert buffer to wav
        const wav = bufferToWave(trimmedBuffer, trimmedBuffer.length);
        const trimmedBlob = new Blob([wav], { type: 'audio/wav' });

        // Create download link
        const url = URL.createObjectURL(trimmedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'trimmed_audio.wav';
        link.click();

        // Cleanup
        URL.revokeObjectURL(url);
      });
    };

    reader.readAsArrayBuffer(audioFile);
  };

  function bufferToWave(abuffer, len) {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);

    // Write WAV header
    writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, length - 8, true);
    writeUTFBytes(view, 8, 'WAVE');
    writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, abuffer.sampleRate, true);
    view.setUint32(28, abuffer.sampleRate * 2 * numOfChan, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    writeUTFBytes(view, 36, 'data');
    view.setUint32(40, len * numOfChan * 2, true);

    // Write audio data
    let offset = 44;
    for (let i = 0; i < abuffer.numberOfChannels; i++) {
      const channelData = abuffer.getChannelData(i);
      const viewData = new Int16Array(buffer, offset, len);

      for (let j = 0; j < len; j++) {
        viewData[j] = Math.max(-1, Math.min(1, channelData[j])) < 0
          ? channelData[j] * 0x8000
          : channelData[j] * 0x7FFF;
      }

      offset += len * 2;
    }

    return buffer;
  }

  function writeUTFBytes(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  useEffect(() => {
    if (audioFile && isWaveformReady) {
      updateTimelineMarkers();
    }
  }, [trimStart, trimEnd, duration, audioFile, isWaveformReady]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Audio Trimmer</h1>

      <input
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="mb-4"
      />

      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}

      {isLoading && (
        <div className="text-blue-500 mb-4">Loading audio file...</div>
      )}

      {audioFile && (
        <div>
          <div ref={waveformRef} className="mb-4"></div>

          {isWaveformReady && (
            <>
              <div
                ref={timelineRef}
                className="w-full h-8 mb-4"
              />

              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={togglePlayPause}
                  className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <span>Duration: {duration.toFixed(2)} seconds</span>
              </div>

              <div className="flex space-x-4 mb-4">
                <div>
                  <label className="block mb-2">Start Time (seconds)</label>
                  <input
                    type="number"
                    value={trimStart}
                    min="0"
                    max={duration}
                    onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                    className="border p-2 w-full"
                  />
                </div>
                <div>
                  <label className="block mb-2">End Time (seconds)</label>
                  <input
                    type="number"
                    value={trimEnd}
                    min={trimStart}
                    max={duration}
                    onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                    className="border p-2 w-full"
                />
                </div>
              </div>

              <button
                onClick={handleTrim}
                className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                disabled={trimStart >= trimEnd}
              >
                Trim and Download Audio
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TrimmerPage;