import React, { useState, useRef } from 'react';

function JoinerPage() {
  const [audioFiles, setAudioFiles] = useState([]);
  const [isJoining, setIsJoining] = useState(false);
  const audioContextRef = useRef(null);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setAudioFiles(prevFiles => [...prevFiles, ...files]);
  };

  const removeFile = (index) => {
    setAudioFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleJoin = async () => {
    if (audioFiles.length < 2) {
      alert('Please upload at least two audio files');
      return;
    }

    setIsJoining(true);

    try {
      // Ensure AudioContext is created
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      // Read all audio files
      const audioBuffers = await Promise.all(
        audioFiles.map(file => readAudioFile(file))
      );

      // Calculate total length
      const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0);

      // Create a new buffer to hold joined audio
      const joinedBuffer = audioContextRef.current.createBuffer(
        audioBuffers[0].numberOfChannels,
        totalLength,
        audioBuffers[0].sampleRate
      );

      // Copy audio data to joined buffer
      let offset = 0;
      for (const buffer of audioBuffers) {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
          const channelData = joinedBuffer.getChannelData(channel);
          const sourceData = buffer.getChannelData(channel);
          channelData.set(sourceData, offset);
        }
        offset += buffer.length;
      }

      // Convert to WAV
      const wav = bufferToWave(joinedBuffer, joinedBuffer.length);
      const joinedBlob = new Blob([wav], { type: 'audio/wav' });

      // Create download link
      const url = URL.createObjectURL(joinedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'joined_audio.wav';
      link.click();

    } catch (error) {
      console.error('Error joining audio files:', error);
      alert('Failed to join audio files');
    } finally {
      setIsJoining(false);
    }

    // Utility function to read audio file as AudioBuffer
    function readAudioFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          audioContextRef.current.decodeAudioData(e.target.result, resolve, reject);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    }

    // Utility function to convert AudioBuffer to WAV (same as in trimmer page)
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
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Audio Joiner</h1>

      <input 
        type="file" 
        accept="audio/*" 
        multiple 
        onChange={handleFileUpload} 
        className="mb-4"
      />

      {audioFiles.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Selected Files:</h2>
          <ul className="mb-4">
            {audioFiles.map((file, index) => (
              <li 
                key={index} 
                className="flex justify-between items-center bg-gray-100 p-2 mb-2 rounded"
              >
                {file.name}
                <button 
                  onClick={() => removeFile(index)}
                  className="bg-red-500 text-white p-1 rounded text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <button 
            onClick={handleJoin}
            disabled={isJoining}
            className="bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isJoining ? 'Joining...' : 'Join Audio Files'}
          </button>
        </div>
      )}
    </div>
  );
}

export default JoinerPage;