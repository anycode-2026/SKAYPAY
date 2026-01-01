
import React, { useState, useEffect } from 'react';

const slides = [
  {
    id: 1,
    image: 'https://picsum.photos/seed/bet1/1200/400',
    title: 'Double Your Deposit',
    desc: 'Get up to 100% bonus on your first login today!'
  },
  {
    id: 2,
    image: 'https://picsum.photos/seed/bet2/1200/400',
    title: 'Fly to Win Big',
    desc: 'Experience the thrill of Sky High Aviator'
  },
  {
    id: 3,
    image: 'https://picsum.photos/seed/bet3/1200/400',
    title: 'Instant Withdrawals',
    desc: 'Cash out your winnings in less than 5 minutes'
  }
];

const HeroSlider: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[250px] md:h-[400px] overflow-hidden group">
      {slides.map((slide, index) => (
        <div 
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <img 
            src={slide.image} 
            className="w-full h-full object-cover" 
            alt={slide.title} 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#001529] via-[#001529]/40 to-transparent flex items-center px-8 md:px-20">
            <div className="max-w-xl animate-in slide-in-from-left duration-700">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 drop-shadow-lg leading-tight">
                {slide.title}
              </h2>
              <p className="text-lg md:text-xl text-blue-100 mb-6 font-light drop-shadow">
                {slide.desc}
              </p>
              <button className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-full text-white font-bold hover:scale-105 transition-transform shadow-lg shadow-orange-900/50">
                LEARN MORE
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button 
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-3 h-1.5 rounded-full transition-all ${i === current ? 'bg-orange-500 w-8' : 'bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
