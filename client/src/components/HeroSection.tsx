import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center text-center space-y-8 w-full px-4">
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
        className="flex flex-col sm:flex-row items-center gap-4 mt-4"
      >
        <Link
          to="/signup"
          className="group flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0f172a] text-white text-sm font-semibold rounded-lg hover:bg-[#1e293b] transition-all shadow-lg shadow-black/10"
        >
          Get Started
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#0f172a] text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
        >
          Sign in
        </Link>
      </motion.div>
    </section>
  );
}
