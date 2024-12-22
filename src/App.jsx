import './App.css' 
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import HomePage from './components/HomePage';
import TrimmerPage from './components/TrimmerPage';
import JoinerPage from './components/JoinerPage';
import SplitterPage from './components/SplitterPage';
import RecorderPage from './components/RecorderPage';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-audio-background">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 text-white p-6 shadow-lg">
          <div className="flex items-center mb-10">
            <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" clipRule="evenodd" />
            </svg>
            <h1 className="text-2xl font-bold">Audio Editor</h1>
          </div>

          <nav>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Home', icon: '🏠' },
                { to: '/trim', label: 'Trim Audio', icon: '✂️' },
                { to: '/join', label: 'Join Audio', icon: '🔗' },
                { to: '/split', label: 'Split Audio', icon: '📊' },
                { to: '/record', label: 'Record Audio', icon: '🎙️' }
              ].map(({ to, label, icon }) => (
                <li key={to}>
                  <Link 
                    to={to} 
                    className="flex items-center p-3 rounded-lg hover:bg-gray-700 transition-all duration-200"
                  >
                    <span className="mr-3">{icon}</span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/trim" element={<TrimmerPage />} />
              <Route path="/join" element={<JoinerPage />} />
              <Route path="/split" element={<SplitterPage />} />
              <Route path="/record" element={<RecorderPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;