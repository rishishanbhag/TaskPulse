import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Globe, MessageCircle } from 'lucide-react';

export default function HeroSection() {
  const [email, setEmail] = useState('');

  return (
    <section className="flex flex-col items-center text-center space-y-8 mt-12 w-full px-4">
      {/* Tagline snippet */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white/50 text-sm text-gray-600 shadow-sm backdrop-blur-sm"
      >
        <MessageCircle className="w-4 h-4" />
        <span>Never miss a task again</span>
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="text-6xl md:text-8xl font-medium tracking-tight text-gradient max-w-4xl leading-[1.1]"
      >
        We <span className="italic text-gray-400">Deliver</span> Tasks Directly to WhatsApp
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}
        className="text-xl text-gray-600 max-w-2xl font-light"
      >
        TaskPulse is your actionable task assignment system, sending tasks to your team via Twilio WhatsApp and tracking their completion in real-time.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col items-center w-full max-w-sm gap-4 mt-8"
      >
        <div className="flex w-full overflow-hidden rounded-md border border-gray-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-black/5 bg-white">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm font-medium"
          />
          <button className="px-6 py-3 bg-gray-50 text-sm font-semibold tracking-wider text-black border-l border-gray-200 hover:bg-gray-100 transition-colors uppercase">
            Join Waitlist
          </button>
        </div>
        
        <p className="text-xs text-gray-400">Be among the first ones to experience TaskPulse.</p>

        <div className="flex items-center w-full gap-4 my-2">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase tracking-widest">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white border border-gray-200 text-sm font-semibold rounded-md hover:bg-gray-50 transition-all text-black shadow-sm">
          <Globe className="w-4 h-4" />
          Self-host
        </button>

        <Link
          to="/login"
          className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#0f172a] text-white text-sm font-semibold rounded-md hover:opacity-95 transition-all shadow-sm"
        >
          Sign in
        </Link>
      </motion.div>
    </section>
  );
}
