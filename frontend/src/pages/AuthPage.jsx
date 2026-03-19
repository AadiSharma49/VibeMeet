import React, { useState, useEffect } from "react";
import { SignIn } from "@clerk/clerk-react";

export default function AuthPage() {
  const [loading, setLoading] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-neutral-950 flex items-center justify-center overflow-hidden">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-neutral-800 border-t-neutral-100 rounded-full animate-spin"></div>
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
            <div className="w-2 h-2 bg-neutral-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-neutral-500 rounded-full animate-pulse animation-delay-200"></div>
            <div className="w-2 h-2 bg-neutral-500 rounded-full animate-pulse animation-delay-400"></div>
          </div>
        </div>
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-neutral-500 text-sm animate-pulse">
          Loading VibeMeet...
        </div>
        <style jsx>{`
          .animation-delay-200 { animation-delay: 0.2s; }
          .animation-delay-400 { animation-delay: 0.4s; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 relative overflow-hidden">
      {/* Animated Moving Lines Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Horizontal Lines */}
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent top-1/4 animate-move-right"></div>
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent top-2/4 animate-move-left"></div>
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent top-3/4 animate-move-right animation-delay-2000"></div>
        
        {/* Vertical Lines */}
        <div className="absolute h-full w-px bg-gradient-to-b from-transparent via-neutral-700 to-transparent left-1/4 animate-move-down"></div>
        <div className="absolute h-full w-px bg-gradient-to-b from-transparent via-neutral-700 to-transparent left-2/4 animate-move-up"></div>
        <div className="absolute h-full w-px bg-gradient-to-b from-transparent via-neutral-700 to-transparent left-3/4 animate-move-down animation-delay-2000"></div>
        
        {/* Diagonal Lines */}
        <div className="absolute w-full h-full">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-neutral-700/20 via-transparent to-transparent animate-diagonal-1"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-neutral-700/20 via-transparent to-transparent animate-diagonal-2"></div>
        </div>
      </div>

      {/* Animated Wave Background */}
      <div className="absolute inset-0 opacity-30">
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="wave-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path 
                d="M0 50 Q 25 30, 50 50 T 100 50" 
                stroke="rgba(115, 115, 115, 0.1)" 
                strokeWidth="0.5" 
                fill="none"
                className="animate-wave"
              />
              <path 
                d="M0 60 Q 25 40, 50 60 T 100 60" 
                stroke="rgba(115, 115, 115, 0.08)" 
                strokeWidth="0.5" 
                fill="none"
                className="animate-wave-delay"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wave-pattern)" />
        </svg>
      </div>

      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Subtle Noise Texture */}
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      {/* Animated Dots - Blink Effect */}
      <div className="absolute top-16 left-8 sm:top-20 sm:left-20 w-2 h-2 bg-neutral-500 rounded-full animate-blink" />
      <div className="absolute top-32 right-16 sm:top-40 sm:right-32 w-1.5 h-1.5 bg-neutral-600 rounded-full animate-blink animation-delay-1000" />
      <div className="absolute bottom-24 left-16 sm:bottom-32 sm:left-40 w-2 h-2 bg-neutral-500 rounded-full animate-blink animation-delay-2000" />
      <div className="absolute bottom-16 right-8 sm:bottom-20 sm:right-20 w-1.5 h-1.5 bg-neutral-600 rounded-full animate-blink animation-delay-3000" />
      <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-neutral-700 rounded-full animate-blink animation-delay-1500 hidden sm:block" />
      <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-neutral-700 rounded-full animate-blink animation-delay-2500 hidden sm:block" />

      {/* Clerk Sign In Modal */}
      {showSignIn && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto custom-scrollbar cursor-pointer"
          onClick={() => setShowSignIn(false)}
        >
          <div 
            className="relative w-full max-w-md animate-slide-down my-8 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowSignIn(false)}
              className="absolute -top-10 sm:-top-12 right-0 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700/30 text-neutral-400 hover:text-neutral-100 transition-all duration-200 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="bg-neutral-900/95 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-neutral-800/50 shadow-2xl">
              <SignIn
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none p-0",
                    headerTitle: "text-neutral-100 text-2xl font-bold",
                    headerSubtitle: "text-neutral-400",
                    formFieldInput:
                      "bg-neutral-950/50 border border-neutral-800/60 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 transition-all duration-200 cursor-text",
                    formFieldLabel:
                      "text-neutral-400 text-sm font-medium mb-2",
                    formButtonPrimary:
                      "bg-neutral-100 hover:bg-white text-neutral-950 rounded-xl py-3 font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.01] cursor-pointer",
                    socialButtonsBlockButton:
                      "bg-neutral-950/50 border border-neutral-800/60 hover:border-neutral-700/60 hover:bg-neutral-900/50 text-neutral-100 rounded-xl backdrop-blur-sm transition-all duration-200 cursor-pointer",
                    socialButtonsBlockButtonText:
                      "text-sm font-medium text-neutral-300",
                    dividerLine: "bg-neutral-800/60",
                    dividerText: "text-neutral-600 text-xs",
                    footerActionLink:
                      "text-neutral-400 hover:text-neutral-300 transition-colors cursor-pointer",
                    formFieldAction:
                      "text-neutral-400 hover:text-neutral-300 text-sm transition-colors cursor-pointer",
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2 gap-0">
        
        {/* LEFT – HERO SECTION */}
        <div className="flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-12">
          <div className="w-full max-w-md">
            
            {/* Logo */}
            <div className="mb-8 sm:mb-12 flex items-center gap-3 sm:gap-4 animate-fade-in">
              <img
                src="/vibemeet_logo.png"
                alt="VibeMeet"
                className="h-12 sm:h-16 w-auto"
              />
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100">
                VibeMeet
              </span>
            </div>

            {/* Heading */}
            <div className="mb-8 sm:mb-10 space-y-4 sm:space-y-5">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-neutral-100 animate-fade-in animation-delay-200 leading-tight">
                Connect, Collaborate, Create
              </h1>
              <p className="text-base sm:text-lg text-neutral-400 leading-relaxed animate-fade-in animation-delay-400">
                Transform the way your team works together. Start your journey with VibeMeet today.
              </p>
            </div>

            {/* Get Started Button - Enhanced Design */}
            <div className="space-y-6 animate-fade-in animation-delay-600">
              <button
                onClick={() => setShowSignIn(true)}
                className="group relative w-full overflow-hidden rounded-2xl cursor-pointer"
              >
                {/* Animated Border */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-neutral-700 via-neutral-600 to-neutral-700 opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500"></div>
                
                {/* Button Content */}
                <div className="relative bg-neutral-100 hover:bg-white rounded-2xl px-8 py-5 transition-all duration-300 transform group-hover:scale-[1.02]">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-neutral-950 font-bold text-lg sm:text-xl">
                      Get Started
                    </span>
                    <svg 
                      className="w-6 h-6 text-neutral-950 transition-transform group-hover:translate-x-2 duration-300" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                </div>
              </button>

              <p className="text-xs sm:text-sm text-center text-neutral-600 flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 bg-neutral-600 rounded-full animate-pulse"></span>
                Join thousands of teams already using VibeMeet
              </p>
            </div>

            {/* Features Grid */}
            <div className="mt-12 sm:mt-16 space-y-4 animate-fade-in animation-delay-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="group flex items-center gap-3 p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/40 hover:border-neutral-700/60 hover:bg-neutral-900/60 transition-all duration-300 cursor-default">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800/50 flex items-center justify-center flex-shrink-0 border border-neutral-700/30 group-hover:border-neutral-600/50 transition-colors">
                    <svg className="w-5 h-5 text-neutral-400 group-hover:text-neutral-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-neutral-200 font-semibold text-sm">Lightning Fast</h3>
                    <p className="text-neutral-600 text-xs">Real-time collaboration</p>
                  </div>
                </div>

                <div className="group flex items-center gap-3 p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/40 hover:border-neutral-700/60 hover:bg-neutral-900/60 transition-all duration-300 cursor-default">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800/50 flex items-center justify-center flex-shrink-0 border border-neutral-700/30 group-hover:border-neutral-600/50 transition-colors">
                    <svg className="w-5 h-5 text-neutral-400 group-hover:text-neutral-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-neutral-200 font-semibold text-sm">Secure</h3>
                    <p className="text-neutral-600 text-xs">End-to-end encrypted</p>
                  </div>
                </div>

                <div className="group flex items-center gap-3 p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/40 hover:border-neutral-700/60 hover:bg-neutral-900/60 transition-all duration-300 cursor-default">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800/50 flex items-center justify-center flex-shrink-0 border border-neutral-700/30 group-hover:border-neutral-600/50 transition-colors">
                    <svg className="w-5 h-5 text-neutral-400 group-hover:text-neutral-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-neutral-200 font-semibold text-sm">Team Focused</h3>
                    <p className="text-neutral-600 text-xs">Built for teams</p>
                  </div>
                </div>

                <div className="group flex items-center gap-3 p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/40 hover:border-neutral-700/60 hover:bg-neutral-900/60 transition-all duration-300 cursor-default">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800/50 flex items-center justify-center flex-shrink-0 border border-neutral-700/30 group-hover:border-neutral-600/50 transition-colors">
                    <svg className="w-5 h-5 text-neutral-400 group-hover:text-neutral-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-neutral-200 font-semibold text-sm">Easy to Use</h3>
                    <p className="text-neutral-600 text-xs">Intuitive interface</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT – TESTIMONIAL SECTION */}
        <div className="hidden lg:flex items-center justify-center relative px-8 xl:px-12 py-12">
          
          {/* Darker Background */}
          <div className="absolute inset-0 bg-neutral-950" />
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

          {/* Content Card */}
          <div className="relative z-10 max-w-lg w-full animate-fade-in animation-delay-1000">
            
            {/* Subtle Border Glow */}
            <div className="absolute -inset-[1px] bg-neutral-800/30 rounded-3xl blur-sm" />
            
            <div className="relative bg-neutral-900/70 backdrop-blur-2xl rounded-2xl lg:rounded-3xl p-8 lg:p-10 border border-neutral-800/60 shadow-2xl shadow-black/50">
              
              {/* Quote Icon */}
              <div className="mb-6">
                <svg className="w-10 lg:w-12 h-10 lg:h-12 text-neutral-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              {/* Testimonial Text */}
              <p className="text-lg lg:text-xl xl:text-2xl font-medium leading-relaxed text-neutral-200">
                VibeMeet has completely transformed how our team communicates.
                <span className="block mt-2 text-neutral-100">
                  What used to take hours is now effortless.
                </span>
              </p>
            </div>

            {/* Floating Blinking Dots */}
            <div className="absolute -top-4 -right-4 w-2 h-2 bg-neutral-600 rounded-full animate-blink" />
            <div className="absolute -bottom-4 -left-4 w-2 h-2 bg-neutral-600 rounded-full animate-blink animation-delay-2000" />
            <div className="absolute top-1/2 -right-6 w-1 h-1 bg-neutral-700 rounded-full animate-blink animation-delay-1500" />
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(23, 23, 23, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(115, 115, 115, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(115, 115, 115, 0.7);
        }

        /* Global Scrollbar */
        :global(body)::-webkit-scrollbar {
          width: 10px;
        }

        :global(body)::-webkit-scrollbar-track {
          background: #0a0a0a;
        }

        :global(body)::-webkit-scrollbar-thumb {
          background: #404040;
          border-radius: 5px;
        }

        :global(body)::-webkit-scrollbar-thumb:hover {
          background: #525252;
        }

        /* Animations */
        @keyframes blink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes wave {
          0% { d: path("M0 50 Q 25 30, 50 50 T 100 50"); }
          50% { d: path("M0 50 Q 25 70, 50 50 T 100 50"); }
          100% { d: path("M0 50 Q 25 30, 50 50 T 100 50"); }
        }

        @keyframes move-right {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        @keyframes move-left {
          0% { transform: translateX(100%); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateX(-100%); opacity: 0; }
        }

        @keyframes move-down {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateY(100%); opacity: 0; }
        }

        @keyframes move-up {
          0% { transform: translateY(100%); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateY(-100%); opacity: 0; }
        }

        @keyframes diagonal-1 {
          0% { transform: translate(-50%, -50%) rotate(45deg); opacity: 0; }
          50% { opacity: 0.3; }
          100% { transform: translate(50%, 50%) rotate(45deg); opacity: 0; }
        }

        @keyframes diagonal-2 {
          0% { transform: translate(50%, -50%) rotate(-45deg); opacity: 0; }
          50% { opacity: 0.3; }
          100% { transform: translate(-50%, 50%) rotate(-45deg); opacity: 0; }
        }

        .animate-wave {
          animation: wave 8s ease-in-out infinite;
        }

        .animate-wave-delay {
          animation: wave 8s ease-in-out infinite;
          animation-delay: -4s;
        }

        .animate-blink {
          animation: blink 3s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }

        .animate-move-right {
          animation: move-right 8s ease-in-out infinite;
        }

        .animate-move-left {
          animation: move-left 8s ease-in-out infinite;
        }

        .animate-move-down {
          animation: move-down 10s ease-in-out infinite;
        }

        .animate-move-up {
          animation: move-up 10s ease-in-out infinite;
        }

        .animate-diagonal-1 {
          animation: diagonal-1 15s ease-in-out infinite;
        }

        .animate-diagonal-2 {
          animation: diagonal-2 15s ease-in-out infinite;
        }

        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-800 { animation-delay: 0.8s; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-1500 { animation-delay: 1.5s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-2500 { animation-delay: 2.5s; }
        .animation-delay-3000 { animation-delay: 3s; }

        @media (max-width: 1024px) {
          .min-h-screen {
            min-height: 100vh;
            min-height: -webkit-fill-available;
          }
        }
      `}</style>
    </div>
  );
}