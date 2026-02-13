import React from 'react';

export default function Landing() {
  return (
    <div className="min-h-[200vh]">
      {/* Video section - full viewport height */}
      <div className="h-screen w-full overflow-hidden -mt-11 sticky top-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/HeyLook.mp4" type="video/mp4" />
        </video>

        {/* Centered overlay image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/promise.png"
            alt="HeyLook"
            className="max-w-[80%] max-h-[80%] object-contain"
          />
        </div>
      </div>

      {/* Spacer to allow scrolling to footer */}
      <div className="h-screen" />
    </div>
  );
}
