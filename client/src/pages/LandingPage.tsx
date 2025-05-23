import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import Typed from 'typed.js';
import { useAuth } from '@/services/AuthService';

function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const typedElementRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<Typed | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
    
    // Initialize Typed.js
    if (typedElementRef.current) {
      typedRef.current = new Typed(typedElementRef.current, {
        strings: ['JEE Preparation', 'Physics Mastery', 'Chemistry Excellence', 'Mathematics Success'],
        typeSpeed: 50,
        backSpeed: 30,
        backDelay: 2000,
        loop: true
      });
    }

    return () => {
      if (typedRef.current) {
        typedRef.current.destroy();
      }
    };
  }, [isAuthenticated, navigate]);

  return (
    <div id="landing-page" className="page active flex flex-col min-h-screen">
      <header className="py-6 px-6 md:px-16 flex justify-between items-center border-b border-[#3A3A3A]">
        <div className="flex items-center">
          <h1 className="text-2xl md:text-3xl font-orbitron font-bold">
            <span className="text-[#00EEFF]">Chad</span><span className="text-[#0FFF50]">jee</span>
          </h1>
        </div>
        <nav>
          <div className="flex space-x-4">
            <Link href="/login">
              <button className="px-5 py-2 rounded-md bg-transparent border border-[#00EEFF] text-[#00EEFF] hover:bg-[#00EEFF] hover:bg-opacity-10 transition duration-300">
                Login
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-5 py-2 rounded-md bg-[#00EEFF] text-[#121212] neon-blue-glow hover:bg-opacity-90 transition duration-300">
                Sign Up
              </button>
            </Link>
          </div>
        </nav>
      </header>
      
      <main className="flex-grow">
        <section className="py-12 md:py-24 px-6 md:px-16 flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 md:pr-16" data-aos="fade-right">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-orbitron font-bold mb-6">
              <div>Ace Your</div>
              <div className="text-[#00EEFF]" ref={typedElementRef}></div>
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              The ultimate companion for JEE aspirants. Track progress, manage time, and achieve your goals with Chadjee's powerful tools.
            </p>
            <div className="flex space-x-4">
              <Link href="/signup">
                <button className="px-8 py-3 rounded-md bg-[#5E17EB] text-white neon-purple-glow font-medium transition duration-300">
                  Get Started
                </button>
              </Link>
              <button className="px-8 py-3 rounded-md bg-transparent border border-[#0FFF50] text-[#0FFF50] hover:bg-[#0FFF50] hover:bg-opacity-10 transition duration-300">
                Learn More
              </button>
            </div>
          </div>
          <div className="w-full md:w-1/2 mt-12 md:mt-0" data-aos="fade-left">
            <div className="rounded-xl overflow-hidden neon-blue-glow">
              <img src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1974&q=80" alt="Student studying" className="w-full h-auto rounded-xl" />
            </div>
          </div>
        </section>
        
        <section className="py-16 px-6 md:px-16 bg-[#1E1E1E]" data-aos="fade-up">
          <h3 className="text-2xl md:text-3xl font-orbitron font-bold text-center mb-12">
            <span className="text-[#0FFF50]">Elevate</span> Your Preparation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-[#121212] border border-[#3A3A3A]" data-aos="fade-up" data-aos-delay="100">
              <div className="text-[#00EEFF] text-4xl mb-4">
                <i className="fas fa-tasks"></i>
              </div>
              <h4 className="text-xl font-orbitron font-semibold mb-3">Smart Study Planner</h4>
              <p className="text-gray-400">Organize your study sessions effectively with personalized schedules tailored to your pace.</p>
            </div>
            <div className="p-6 rounded-xl bg-[#121212] border border-[#3A3A3A]" data-aos="fade-up" data-aos-delay="200">
              <div className="text-[#5E17EB] text-4xl mb-4">
                <i className="fas fa-chart-line"></i>
              </div>
              <h4 className="text-xl font-orbitron font-semibold mb-3">Progress Tracking</h4>
              <p className="text-gray-400">Visualize your improvement across subjects with detailed analytics and performance insights.</p>
            </div>
            <div className="p-6 rounded-xl bg-[#121212] border border-[#3A3A3A]" data-aos="fade-up" data-aos-delay="300">
              <div className="text-[#0FFF50] text-4xl mb-4">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <h4 className="text-xl font-orbitron font-semibold mb-3">Exam Countdown</h4>
              <p className="text-gray-400">Stay focused with real-time countdowns to JEE Mains and Advanced examination dates.</p>
            </div>
          </div>
        </section>
        
        <section className="py-16 px-6 md:px-16" data-aos="fade-up">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-2xl md:text-3xl font-orbitron font-bold mb-6">
              Ready to <span className="text-[#00EEFF]">Transform</span> Your Preparation?
            </h3>
            <p className="text-gray-300 max-w-2xl mb-8">
              Join thousands of successful JEE aspirants who have elevated their study routine with Chadjee.
            </p>
            <Link href="/signup">
              <button className="px-8 py-3 rounded-md bg-[#0FFF50] text-[#121212] neon-green-glow font-medium transition duration-300">
                Create Free Account
              </button>
            </Link>
          </div>
        </section>
      </main>
      
      <footer className="py-8 px-6 md:px-16 border-t border-[#3A3A3A]">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h1 className="text-xl font-orbitron font-bold">
              <span className="text-[#00EEFF]">Chad</span><span className="text-[#0FFF50]">jee</span>
            </h1>
          </div>
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} Chadjee. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
