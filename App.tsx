
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import RoomPage from './components/RoomPage';

const App: React.FC = () => {
  return (
    <div className="min-h-screen text-corp-gray-800 dark:text-corp-gray-200">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </div>
  );
};

export default App;
