import React, { useState } from 'react';
import { PlayCircle, Share2, Users, Lock, Menu, X, Zap, Shield, Sparkles, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from '../assets/view.jpeg'; // Make sure this path is correct

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    const header = document.querySelector('header'); // Get the fixed header element

    if (element && header) {
      const headerHeight = header.offsetHeight;
      const elementHeight = element.offsetHeight;
      const elementPosition = element.offsetTop;

      // Calculate the available viewport height below the header
      const viewportHeight = window.innerHeight - headerHeight;

      // Calculate the desired scroll position to center the element
      // Target position for the *top* of the element relative to the document top.
      // We want the space above the element (within the visible viewport) to be (viewportHeight - elementHeight) / 2.
      // So the element's top should be at headerHeight + (viewportHeight - elementHeight) / 2 relative to the viewport top.
      // The window's scrollY should therefore be elementPosition - (headerHeight + (viewportHeight - elementHeight) / 2)
      let calculatedScrollY = elementPosition - headerHeight - ((viewportHeight - elementHeight) / 2);

      // Clamp the scroll position:
      // Can't scroll higher than placing the element top just below the header
      const topClamp = elementPosition - headerHeight;
      // Also, ensure we don't try to scroll negative (if element is near the top)
      calculatedScrollY = Math.max(0, calculatedScrollY);

      // If the element is taller than the viewport, just align its top below the header
      if (elementHeight >= viewportHeight) {
          calculatedScrollY = topClamp;
      }

      window.scrollTo({
        top: calculatedScrollY,
        behavior: 'smooth'
      });

      setMobileMenuOpen(false); // Close mobile menu if open
    } else if (element) {
        // Fallback
        element.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
    }
  };


  const faqs = [
    {
      question: "How does Scene-Share work?",
      answer: "Scene-Share uses WebRTC technology to enable real-time screen sharing and video chat. The host shares their screen while all participants can see the content and communicate via video/audio chat in a private room."
    },
    {
      question: "How many people can join a room?",
      answer: "A room can accommodate up to 10 participants simultaneously, including the host. This ensures optimal video quality and smooth streaming for everyone."
    },
    {
      question: "Do my friends need to create an account?",
      answer: "Yes, all participants need to create a free account to join rooms. This helps us maintain security and provide a better experience for everyone."
    },
    {
      question: "Is my content secure and private?",
      answer: "Absolutely! All rooms are private and require a unique room ID to join. Your screen share is encrypted, and only invited participants can access your room. We never record or store your content."
    },
    {
      question: "What can I watch on Scene-Share?",
      answer: "You can share anything from your screen - movies, TV shows, YouTube videos, sports events, or even browse the web together. The host has complete control over what's shared."
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 group cursor-pointer">
              <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Scene-Share</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-neutral-300 hover:text-white transition-colors text-sm font-medium relative group">
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300" />
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-neutral-300 hover:text-white transition-colors text-sm font-medium relative group">
                How it Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300" />
              </button>
              <button onClick={() => scrollToSection('faq')} className="text-neutral-300 hover:text-white transition-colors text-sm font-medium relative group">
                FAQ
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300" />
              </button>
              <Link to="/login">
                <button className="relative inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all h-10 px-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105">
                  Get Started
                  <Sparkles className="ml-2 w-4 h-4" />
                </button>
              </Link>
            </nav>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-white hover:text-neutral-300 transition-colors">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-800">
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left text-white hover:text-blue-400 transition-colors text-sm font-medium py-2">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left text-white hover:text-blue-400 transition-colors text-sm font-medium py-2">
                How it Works
              </button>
              <button onClick={() => scrollToSection('faq')} className="block w-full text-left text-white hover:text-blue-400 transition-colors text-sm font-medium py-2">
                FAQ
              </button>
              <Link to="/login" className="block">
                <button className="w-full inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all h-10 px-6 bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-lg hover:shadow-blue-500/50">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-5xl mx-auto">

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="block bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">Watch Together</span>
              <span className="block bg-gradient-to-r from-purple-200 via-blue-100 to-white bg-clip-text text-transparent">Anywhere</span>
            </h1>

            <p className="text-xl sm:text-2xl text-neutral-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Create private rooms, share your screen, and enjoy <span className="text-blue-400 font-semibold">movies, shows, or anything else</span> with friends in perfect sync.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
              <Link to="/login">
                <button className="group relative inline-flex items-center justify-center rounded-xl text-lg font-bold transition-all h-14 px-10 bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105">
                  <span className="relative z-10">Start Watching</span>
                  <PlayCircle className="ml-2 w-6 h-6 group-hover:rotate-360 transition-transform duration-300" /> {/* <-- Updated rotation */}
                </button>
              </Link>
              <button onClick={() => scrollToSection('how-it-works')} className="inline-flex items-center justify-center rounded-xl text-lg font-semibold transition-all h-14 px-10 bg-neutral-800/50 text-white hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-600">
                Learn More
              </button>
            </div>

            {/* Enhanced Hero Visual */}
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-pink-600/30 rounded-2xl blur-2xl group-hover:blur-3xl transition-all opacity-50" />
              <div className="relative bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 border border-neutral-700 rounded-2xl p-4 shadow-2xl">
                <div className="rounded-xl overflow-hidden relative bg-black">
                  <img
                    src={heroImage}
                    alt="Scene-Share application interface showing a movie being watched"
                    className="block w-full h-auto rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            {/* --- MODIFICATION START: Adjusted text size --- */}
            <h2 className="text-4xl sm:text-6xl font-black mb-6 bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">Powerful Features</h2>
            {/* --- MODIFICATION END --- */}
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">Everything you need for an amazing co-watching experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:to-transparent rounded-2xl transition-all" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/50">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Lightning Fast</h3>
                <p className="text-neutral-400 leading-relaxed">Ultra-low latency streaming ensures everyone watches in perfect sync, no matter where they are.</p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:to-transparent rounded-2xl transition-all" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/50">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Secure & Private</h3>
                <p className="text-neutral-400 leading-relaxed">End-to-end encrypted rooms with unique IDs. Your content stays private, always.</p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-800 rounded-2xl p-8 hover:border-pink-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/10 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-pink-500/0 group-hover:from-pink-500/5 group-hover:to-transparent rounded-2xl transition-all" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/50">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Video Chat</h3>
                <p className="text-neutral-400 leading-relaxed">See and hear your friends with integrated HD video and crystal-clear audio chat.</p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-800 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/5 group-hover:to-transparent rounded-2xl transition-all" />
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/50">
                  <Share2 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Easy Sharing</h3>
                <p className="text-neutral-400 leading-relaxed">One-click screen sharing with full control. Share anything from your browser instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-neutral-900/50 to-transparent">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            {/* --- MODIFICATION START: Adjusted text size --- */}
            <h2 className="text-4xl sm:text-6xl font-black mb-6 bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">Get Started in Seconds</h2>
            {/* --- MODIFICATION END --- */}
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">Three simple steps to watch together</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative">
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent z-0" />

            {/* Step 1 */}
            <div className="relative text-center group z-10">
              <div className="relative inline-flex items-center justify-center mb-8">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-3xl font-black shadow-2xl shadow-blue-500/50 group-hover:scale-110 transition-transform">
                  1
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Create Account</h3>
              <p className="text-neutral-400 text-lg leading-relaxed">
                Sign up in seconds with just your email. No credit card needed, completely free.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center group z-10">
              <div className="relative inline-flex items-center justify-center mb-8">
                <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-black shadow-2xl shadow-purple-500/50 group-hover:scale-110 transition-transform">
                  2
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Create or Join Room</h3>
              <p className="text-neutral-400 text-lg leading-relaxed">
                Start a new room or join friends using a room code. It's that simple.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center group z-10">
              <div className="relative inline-flex items-center justify-center mb-8">
                <div className="absolute inset-0 bg-pink-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-3xl font-black shadow-2xl shadow-pink-500/50 group-hover:scale-110 transition-transform">
                  3
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Watch Together</h3>
              <p className="text-neutral-400 text-lg leading-relaxed">
                Share your screen, turn on video chat, and enjoy the show with your friends!
              </p>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link to="/login">
              <button className="group relative inline-flex items-center justify-center rounded-xl text-lg font-bold transition-all h-14 px-10 bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105">
                <span className="relative z-10">Try It Now</span>
                <Sparkles className="ml-2 w-5 h-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            {/* --- MODIFICATION START: Adjusted text size --- */}
            <h2 className="text-4xl sm:text-6xl font-black mb-6 bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent">Frequently Asked Questions</h2>
            {/* --- MODIFICATION END --- */}
            <p className="text-xl text-neutral-400">Everything you need to know about Scene-Share</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="group bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-all">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-neutral-800/50 transition-colors"
                >
                  <span className="text-lg font-semibold pr-8">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-blue-400 flex-shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="px-8 pb-6 text-neutral-400 leading-relaxed border-t border-neutral-800/50 pt-4">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 sm:px-6 lg:px-8 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">Scene-Share</span>
            </div>
            <p className="text-neutral-400 text-sm">© {new Date().getFullYear()} Scene-Share. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}