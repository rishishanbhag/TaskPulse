import { motion } from 'framer-motion';

const steps = [
  {
    num: 1, 
    title: "Draft & Assign",
    desc: "As an admin, effortlessly create tasks and assign them to your team inside our dashboard."
  },
  {
    num: 2, 
    title: "Twilio API dispatches",
    desc: "Assigned tasks are processed, formatted, and instantly dispatched via WhatsApp."
  },
  {
    num: 3, 
    title: "Real-time responses",
    desc: "Members reply 'DONE' on WhatsApp. Statuses update in real-time on your dashboard."
  }
];

export default function ProcessSection() {
  return (
    <section className="flex flex-col items-center space-y-20 pt-16 border-t border-gray-100 relative w-full px-4">
      <div className="text-center space-y-4 w-full">
        <h2 className="text-4xl md:text-5xl font-light tracking-tight text-gradient">From drafting to delivery</h2>
        <p className="text-gray-500 font-light max-w-xl mx-auto">
          Your server silently dispatches and organizes every task you assign, building your real-time tracking dashboard instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 w-full max-w-4xl mx-auto">
        {steps.map((step, idx) => (
          <motion.div 
            key={step.num}
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} 
            transition={{ delay: 0.1 * idx, duration: 0.5 }}
            className="flex flex-col items-center text-center gap-6"
          >
            <div className="w-20 h-20 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm relative group overflow-hidden">
              <div className="absolute inset-0 bg-gray-50 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full" />
              <span className="text-2xl font-light text-gray-800 relative z-10">{step.num}</span>
            </div>
            <h3 className="text-xl text-gray-800 font-serif italic">{step.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-light px-2">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
