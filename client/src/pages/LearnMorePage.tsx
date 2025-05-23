import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import PageTransition from '@/components/PageTransition';
import Header from '@/components/Header';

export default function LearnMorePage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Initialize AOS animation library if it exists
    if (typeof window !== 'undefined' && (window as any).AOS) {
      (window as any).AOS.init({
        duration: 800,
        once: false
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#121212]">
      <Header showBackButton onBack={() => navigate('/')} />
      
      <PageTransition>
        <main className="flex-grow container max-w-4xl mx-auto px-4 py-12">
          <div className="space-y-12">
            <section className="text-center mb-12" data-aos="fade-up">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">About <span className="text-[#00EEFF]">Chadjee</span></h1>
              <p className="text-xl text-[#E0E0E0] max-w-2xl mx-auto">
                Your ultimate companion for JEE Mains & Advanced preparation
              </p>
            </section>
            
            <section className="grid grid-cols-1 md:grid-cols-2 gap-10" data-aos="fade-up" data-aos-delay="100">
              <div className="bg-[#202020] p-8 rounded-lg border border-[#3A3A3A]">
                <h2 className="text-2xl font-semibold mb-4 text-[#00EEFF]">Our Mission</h2>
                <p className="text-[#E0E0E0] leading-relaxed">
                  Chadjee was created with a singular focus - to help JEE aspirants organize their study journey and maximize their potential. We believe that with the right tools and planning, every student can achieve their dreams.
                </p>
              </div>
              
              <div className="bg-[#202020] p-8 rounded-lg border border-[#3A3A3A]">
                <h2 className="text-2xl font-semibold mb-4 text-[#39FF14]">Why Chadjee?</h2>
                <ul className="text-[#E0E0E0] leading-relaxed space-y-2">
                  <li>• Comprehensive syllabus tracking</li>
                  <li>• Detailed progress monitoring</li>
                  <li>• Smart study planning tools</li>
                  <li>• Personalized statistics and insights</li>
                  <li>• Designed specifically for JEE preparation</li>
                </ul>
              </div>
            </section>
            
            <section className="bg-[#202020] p-8 rounded-lg border border-[#3A3A3A]" data-aos="fade-up" data-aos-delay="200">
              <h2 className="text-2xl font-semibold mb-6 text-[#BF40FF]">Meet the Creator</h2>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00EEFF] via-[#39FF14] to-[#BF40FF] flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-[#202020] flex items-center justify-center">
                    <span className="text-3xl">👨‍💻</span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-white">NH</h3>
                  <p className="text-[#E0E0E0] leading-relaxed mb-4">
                    Hi! I'm NH, the creator of ChadJee. As a JEE aspirant myself, I wanted a focused, streamlined tool 
                    to channel all my energy into preparation. ChadJee is built to help students like us stay sharp, 
                    organized, and on track.
                  </p>
                </div>
              </div>
            </section>
            
            <section className="text-center" data-aos="fade-up" data-aos-delay="300">
              <h2 className="text-2xl font-semibold mb-6 text-white">Ready to Transform Your JEE Preparation?</h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="px-8 py-6 rounded-md bg-[#39FF14] text-[#121212] font-semibold hover:shadow-neon-green transition-all duration-300 text-lg"
                  onClick={() => navigate('/auth')}
                >
                  Get Started Now
                </Button>
                <Button 
                  className="px-8 py-6 rounded-md bg-transparent border border-[#00EEFF] text-[#00EEFF] hover:shadow-neon-blue transition-all duration-300 text-lg"
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </Button>
              </div>
            </section>
          </div>
        </main>
        
        <footer className="py-6 px-8 bg-[#1A1A1A] text-center">
          <p className="text-sm text-[#E0E0E0] opacity-70">© 2023 Chadjee - Your JEE Preparation Partner</p>
        </footer>
      </PageTransition>
    </div>
  );
}