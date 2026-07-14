import React, { useState, useEffect, useRef } from 'react';

const DualRangeSlider = ({ min, max, step = 1, value, onChange, formatValue = (v) => `₱${v.toLocaleString()}` }) => {
  const [minVal, setMinVal] = useState(value[0]);
  const [maxVal, setMaxVal] = useState(value[1]);
  const minValRef = useRef(minVal);
  const maxValRef = useRef(maxVal);

  useEffect(() => {
    setMinVal(value[0]);
    setMaxVal(value[1]);
  }, [value]);

  const getPercent = (value) => Math.round(((value - min) / (max - min)) * 100);

  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), maxVal - step);
    setMinVal(value);
    minValRef.current = value;
    onChange([value, maxValRef.current]);
  };

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), minVal + step);
    setMaxVal(value);
    maxValRef.current = value;
    onChange([minValRef.current, value]);
  };

  return (
    <div className="relative w-full h-[50px] flex items-center">
      {/* Underlying unselected track */}
      <div className="absolute left-0 right-0 h-[4px] bg-[#E5E7EB] rounded-full pointer-events-none"></div>
      
      {/* Selected track (black) */}
      <div 
        className="absolute h-[4px] bg-[#111827] rounded-full pointer-events-none"
        style={{
          left: `${getPercent(minVal)}%`,
          width: `${getPercent(maxVal) - getPercent(minVal)}%`
        }}
      ></div>

      {/* Min Input */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minVal}
        onChange={handleMinChange}
        className="absolute left-0 w-full appearance-none bg-transparent pointer-events-auto z-10"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Max Input */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxVal}
        onChange={handleMaxChange}
        className="absolute left-0 w-full appearance-none bg-transparent pointer-events-auto z-20"
        style={{ pointerEvents: 'none' }}
      />

      <style>{`
        /* WebKit specific styles */
        input[type=range]::-webkit-slider-thumb {
          pointer-events: auto;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #111827;
          border: 4px solid #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
          cursor: pointer;
        }
        input[type=range]::-moz-range-thumb {
          pointer-events: auto;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #111827;
          border: 4px solid #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
          cursor: pointer;
        }
      `}</style>
      
      <div className="absolute top-[32px] w-full flex justify-between items-center text-[12px] font-semibold text-[#9CA3AF]">
        <span>{formatValue(minVal)}</span>
        <span>{formatValue(maxVal)}{maxVal === max ? '+' : ''}</span>
      </div>
    </div>
  );
};

export default DualRangeSlider;
