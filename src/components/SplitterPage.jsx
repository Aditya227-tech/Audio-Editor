import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';

function SplitterPage() {
  const [audioFile, setAudioFile] = useState(null);
  const [splitPoints, setSplitPoints] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const audioContextRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setAudioFile(file);
    setSplitPoints([]);

    // Destroy existing wavesurfer instance if it exists
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    // Initialize WaveSurfer
    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'violet',
      progressColor: 'purple',
      responsive: true,
      height: 100,
    });

    wavesurferRef.current.loadBlob(file);

    // Set up event listeners
    wavesurferRef.current.on('ready', () => {
      setDuration(wavesurferRef.current.getDuration());
    });
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

  const addSplitPoint = () => {
    if (!wavesurferRef.current) return;

    const currentTime = wavesurferRef.current.getCurrentTime();

    // Ensure split points are unique and sorted
    if (!splitPoints.includes(currentTime)) {
      const newSplitPoints = [...splitPoints, currentTime].sort((a, b) => a - b);
      setSplitPoints(newSplitPoints);
    }
  };

  const handleSplit = async () => {
    if (!audioFile || splitPoints.length === 0) {
      alert('Please upload a file and set split points');
      return;
    }

    // Ensure AudioContext is created
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    try {
      // Read the audio file
      const arrayBuffer = await readFileAsArrayBuffer(audioFile);
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      // Prepare split points (add start and end of file)
      const points = [0, ...splitPoints, duration].sort((a, b) => a - b);

      // Split the audio into segments
      const splitSegments = points.slice(0, -1).map((start, index) => {
        const end = points[index + 1];
        return splitAudioBuffer(audioBuffer, start, end);
      });

      // Download each segment
      splitSegments.forEach((segment, index) => {
        const wav = bufferToWave(segment, segment.length);
        const segmentBlob = new Blob([wav], { type: 'audio/wav' });

        const url = URL.createObjectURL(segmentBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audio_segment_${index + 1}.wav`;
        link.click();
      });

    } catch (error) {
      console.error('Error splitting audio:', error);
      alert('Failed to split audio file');
    }
  };

  // Utility function to read file as ArrayBuffer
  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Utility function to split AudioBuffer
  function splitAudioBuffer(audioBuffer, start, end) {
    const startSample = Math.floor(start * audioBuffer.sampleRate);
    const endSample = Math.floor(end * audioBuffer.sampleRate);
    const segmentLength = endSample - startSample;

    const splitBuffer = audioContextRef.current.createBuffer(
      audioBuffer.numberOfChannels,
      segmentLength,
      audioBuffer.sampleRate
    );

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const splitChannelData = splitBuffer.getChannelData(channel);

      for (let i = 0; i < segmentLength; i++) {
        splitChannelData[i] = channelData[startSample + i];
      }
    }

    return splitBuffer;
  }

  // Utility function to convert AudioBuffer to WAV (same as in previous components)
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

  const removeSplitPoint = (pointToRemove) => {
    setSplitPoints(splitPoints.filter(point => point !== pointToRemove));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Audio Splitter</h1>

      <input 
        type="file" 
        accept="audio/*" 
        onChange={handleFileUpload} 
        className="mb-4"
      />

      {audioFile && (
        <div>
          <div ref={waveformRef} className="mb-4"></div>

          <div className="flex items-center space-x-4 mb-4">
            <button 
              onClick={togglePlayPause}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <span>Duration: {duration.toFixed(2)} seconds</span>
          </div>

          <button 
            onClick={addSplitPoint}
            className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600 mr-4"
          >
            Add Split Point
          </button>

          {splitPoints.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mt-4 mb-2">Split Points:</h2>
              <ul className="space-y-2 mb-4">
                {splitPoints.map((point, index) => (
                  <li 
                    key={point} 
                    className="flex justify-between items-center bg-gray-100 p-2 rounded"
                  >
                    Split Point {index + 1}: {point.toFixed(2)} seconds
                    <button 
                      onClick={() => removeSplitPoint(point)}
                      className="bg-red-500 text-white p-1 rounded text-sm"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>

              <button 
                onClick={handleSplit}
                className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
              >
                Split and Download Audio Segments
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SplitterPage;