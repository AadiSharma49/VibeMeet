import React from "react";
import { SignIn, SignUpButton } from "@clerk/clerk-react";

export default function AuthPage() {
  return (
    <div className="min-h-screen w-full bg-neutral-950 relative overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      {/* Subtle Noise Texture */}
      <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]" />

      {/* Animated Dots - Blink Effect */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-neutral-500 rounded-full animate-blink" />
      <div className="absolute top-40 right-32 w-1.5 h-1.5 bg-neutral-600 rounded-full animate-blink animation-delay-1000" />
      <div className="absolute bottom-32 left-40 w-2 h-2 bg-neutral-500 rounded-full animate-blink animation-delay-2000" />
      <div className="absolute bottom-20 right-20 w-1.5 h-1.5 bg-neutral-600 rounded-full animate-blink animation-delay-3000" />
      <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-neutral-700 rounded-full animate-blink animation-delay-1500" />
      <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-neutral-700 rounded-full animate-blink animation-delay-2500" />

      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2 gap-0">
        
        {/* LEFT – AUTH SECTION */}
        <div className="flex items-center justify-center px-6 py-12 lg:px-12">
          <div className="w-full max-w-md">
            
            {/* Logo */}
            <div className="mb-12 flex items-center gap-4 group">
              <div className="relative">
                <div className="absolute inset-0 bg-neutral-800 rounded-xl blur-sm opacity-50" />
                <img
                  src="/vibemeet_logo.png"
                  alt="VibeMeet"
                  className="h-16 w-auto relative z-10"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight text-neutral-100">
                VibeMeet
              </span>
            </div>

            {/* Heading */}
            <div className="mb-8 space-y-3">
              <h1 className="text-4xl md:text-5xl font-bold text-neutral-100 animate-fade-in">
                Welcome back!
              </h1>
              <p className="text-neutral-500 text-base leading-relaxed animate-fade-in animation-delay-200">
                Sign in to continue collaborating with your team.
              </p>
            </div>

            {/* Glass Card Container for Sign In */}
            <div className="relative group">
              {/* Subtle Glow */}
              <div className="absolute -inset-[1px] bg-neutral-800/20 rounded-2xl blur-md" />
              
              <div className="relative bg-neutral-900/60 backdrop-blur-xl rounded-2xl p-8 border border-neutral-800/50 shadow-2xl shadow-black/50">
                <SignIn
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      card: "bg-transparent shadow-none p-0",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      formFieldInput:
                        "bg-neutral-950/50 border border-neutral-800/60 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 transition-all duration-200 backdrop-blur-sm",
                      formFieldLabel:
                        "text-neutral-400 text-sm font-medium mb-2",
                      formButtonPrimary:
                        "bg-neutral-100 hover:bg-white text-neutral-950 rounded-xl py-3 font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.01]",
                      socialButtonsBlockButton:
                        "bg-neutral-950/50 border border-neutral-800/60 hover:border-neutral-700/60 hover:bg-neutral-900/50 text-neutral-100 rounded-xl backdrop-blur-sm transition-all duration-200",
                      socialButtonsBlockButtonText:
                        "text-sm font-medium text-neutral-300",
                      dividerLine: "bg-neutral-800/60",
                      dividerText: "text-neutral-600 text-xs",
                      footerActionText: "hidden",
                      footerActionLink: "hidden",
                      formFieldAction:
                        "text-neutral-400 hover:text-neutral-300 text-sm transition-colors",
                    },
                  }}
                />

                {/* Custom Sign Up Link */}
                <div className="mt-8 pt-6 border-t border-neutral-800/60 text-center">
                  <p className="text-sm text-neutral-500">
                    Don't have an account?{" "}
                    <SignUpButton mode="modal">
                      <button className="text-neutral-100 font-semibold hover:text-white transition-all cursor-pointer inline-flex items-center gap-1 group/signup">
                        Sign up
                        <svg
                          className="w-4 h-4 text-neutral-400 group-hover/signup:translate-x-1 transition-transform"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </button>
                    </SignUpButton>
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 flex items-center justify-center gap-8 text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-blink" />
                <span>Secure & Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-blink animation-delay-1000" />
                <span>Privacy First</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT – TESTIMONIAL SECTION */}
        <div className="hidden lg:flex items-center justify-center relative px-12 py-12">
          
          {/* Darker Background */}
          <div className="absolute inset-0 bg-neutral-950" />
          
          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

          {/* Content Card */}
          <div className="relative z-10 max-w-lg">
            
            {/* Subtle Border Glow */}
            <div className="absolute -inset-[1px] bg-neutral-800/30 rounded-3xl blur-sm" />
            
            <div className="relative bg-neutral-900/70 backdrop-blur-2xl rounded-3xl p-10 border border-neutral-800/60 shadow-2xl shadow-black/50">
              
              {/* Quote Icon */}
              <div className="mb-6">
                <svg className="w-12 h-12 text-neutral-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              {/* Testimonial Text */}
              <p className="text-xl md:text-2xl font-medium leading-relaxed text-neutral-200 mb-8">
                VibeMeet has completely transformed how our team communicates.
                <span className="block mt-2 text-neutral-100">
                  What used to take hours is now effortless.
                </span>
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-neutral-700 rounded-full blur-md opacity-30" />                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              {/* <div className="mt-10 pt-8 border-t border-neutral-800/60 grid grid-cols-3 gap-6">
                <div className="text-center group">
                  <p className="text-3xl font-bold text-neutral-100 group-hover:text-white transition-colors">50K+</p>
                  <p className="text-xs text-neutral-600 mt-1">Active Users</p>
                </div>
                <div className="text-center group">
                  <p className="text-3xl font-bold text-neutral-100 group-hover:text-white transition-colors">99.9%</p>
                  <p className="text-xs text-neutral-600 mt-1">Uptime</p>
                </div>
                <div className="text-center group">
                  <p className="text-3xl font-bold text-neutral-100 group-hover:text-white transition-colors">4.9★</p>
                  <p className="text-xs text-neutral-600 mt-1">Rating</p>
                </div>
              </div>
            </div> */}

            {/* Floating Blinking Dots */}
            <div className="absolute -top-4 -right-4 w-2 h-2 bg-neutral-600 rounded-full animate-blink" />
            <div className="absolute -bottom-4 -left-4 w-2 h-2 bg-neutral-600 rounded-full animate-blink animation-delay-2000" />
            <div className="absolute top-1/2 -right-6 w-1 h-1 bg-neutral-700 rounded-full animate-blink animation-delay-1500" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
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

        .animate-blink {
          animation: blink 3s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-1500 {
          animation-delay: 1.5s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-2500 {
          animation-delay: 2.5s;
        }

        .animation-delay-3000 {
          animation-delay: 3s;
        }
      `}</style>
    </div>
  );
}