import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  const features = [
    { 
      to: '/trim', 
      title: 'Trim Audio', 
      description: 'Cut and edit specific portions of your audio files',
      bg: 'bg-blue-500',
      hover: 'hover:bg-blue-600'
    },
    { 
      to: '/join', 
      title: 'Join Audio', 
      description: 'Combine multiple audio files into one',
      bg: 'bg-green-500',
      hover: 'hover:bg-green-600'
    },
    { 
      to: '/split', 
      title: 'Split Audio', 
      description: 'Divide audio files into multiple segments',
      bg: 'bg-purple-500',
      hover: 'hover:bg-purple-600'
    },
    { 
      to: '/record', 
      title: 'Record Audio', 
      description: 'Create new audio recordings',
      bg: 'bg-red-500',
      hover: 'hover:bg-red-600'
    }
  ];

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
        Welcome to Audio Editor
      </h1>
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature) => (
          <Link 
            key={feature.to}
            to={feature.to} 
            className={`
              ${feature.bg} ${feature.hover} 
              text-white p-6 rounded-xl 
              transform transition-all duration-300 
              hover:-translate-y-2 
              shadow-lg
              flex flex-col items-center
            `}
          >
            <h2 className="text-xl font-semibold mb-2">{feature.title}</h2>
            <p className="text-sm text-center opacity-80">{feature.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default HomePage;