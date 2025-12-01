
import React from 'react';
import YomirgoGame from './components/YomirgoGame';

const App: React.FC = () => {
  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center bg-[#0a0a0a] relative overflow-hidden">
      
      <div className="relative z-10 w-full flex justify-center py-4">
        <YomirgoGame />
      </div>
        
      <div className="text-center text-[#555] text-xs font-mono mt-4">
          <p>YOMIRGO INC. // AI MEGA PLANT PROJECT</p>
          <p className="mt-1">Controls: Arrows / WASD to Move, Space to Jump</p>
      </div>
    </div>
  );
};

export default App;
