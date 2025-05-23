import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import Typed from 'typed.js';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const typedElement = useRef<HTMLSpanElement>(null);
  const typed = useRef<Typed | null>(null);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Initialize Typed.js
    if (typedElement.current) {
      typed.current = new Typed(typedElement.current, {
        strings: ['Master Your JEE Preparation.', 'Track Your Progress.', 'Achieve Your Dreams.'],
        typeSpeed: 50,
        backSpeed: 30,
        backDelay: 1500,
        startDelay: 500,
        loop: true
      });
    }

    // Clean up
    return () => {
      typed.current?.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12 text-center" data-aos="fade-up">
        <h1 className="text-4xl md:text-6xl font-poppins font-bold mb-6">
          <span ref={typedElement} className="neon-text-blue"></span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl text-[#E0E0E0]">
          The ultimate study companion for your JEE Mains & Advanced preparation journey.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <button 
            className="px-8 py-3 rounded-md bg-[#39FF14] text-[#121212] font-semibold hover:shadow-neon-green transition-all duration-300 text-lg"
            onClick={() => navigate('/auth')}
          >
            Get Started
          </button>
          <button 
            className="px-8 py-3 rounded-md bg-transparent border border-[#BF40FF] hover:shadow-neon-purple transition-all duration-300 text-[#BF40FF] text-lg"
            onClick={() => navigate('/learn-more')}
          >
            Learn More
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full" data-aos="fade-up" data-aos-delay="200">
          <div className="bg-[#252525] p-6 rounded-lg hover:shadow-neon-blue transition-all duration-300 border border-[#1E1E1E] hover:border-[#00EEFF]">
            <i className="fas fa-tasks text-[#00EEFF] text-3xl mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">Study Planner</h3>
            <p className="text-[#E0E0E0] opacity-80">Organize your subjects, topics and study sessions efficiently.</p>
          </div>
          <div className="bg-[#252525] p-6 rounded-lg hover:shadow-neon-green transition-all duration-300 border border-[#1E1E1E] hover:border-[#39FF14]">
            <i className="fas fa-chart-line text-[#39FF14] text-3xl mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
            <p className="text-[#E0E0E0] opacity-80">Monitor your progress with visual indicators and statistics.</p>
          </div>
          <div className="bg-[#252525] p-6 rounded-lg hover:shadow-neon-purple transition-all duration-300 border border-[#1E1E1E] hover:border-[#BF40FF]">
            <i className="fas fa-calendar-alt text-[#BF40FF] text-3xl mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">Calendar & Goals</h3>
            <p className="text-[#E0E0E0] opacity-80">Set and achieve daily, weekly and monthly goals with reminders.</p>
          </div>
        </div>
      </main>
      
      <footer className="py-6 px-8 bg-[#1E1E1E] text-center">
        <p className="text-sm text-[#E0E0E0] opacity-70">© 2023 Chadjee - Your JEE Preparation Partner</p>
      </footer>
    </div>
  );
}
