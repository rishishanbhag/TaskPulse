import { CheckCircle2, Send, ListChecks } from 'lucide-react';

export default function FeatureSection() {
  return (
    <section className="flex justify-center w-full px-4">
      <div className="flex flex-col lg:flex-row w-full max-w-5xl bg-gray-50/50 backdrop-blur-xl border border-gray-200 rounded-3xl overflow-hidden shadow-sm relative">
        {/* Timeline Left Sidebar */}
        <div className="w-full lg:w-1/3 p-10 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white/60">
          <div className="flex flex-col h-full justify-center space-y-12 relative min-h-[300px]">
            <div className="absolute left-6 top-8 bottom-8 w-px bg-gray-200 -z-10 hidden lg:block" />
            
            {[
              { icon: ListChecks, title: "Task drafted", desc: "Admin assigns inventory check" },
              { icon: Send, title: "Notification sent", desc: "Twilio delivers WhatsApp message" },
              { icon: CheckCircle2, title: "Reply received", desc: "User replied DONE inside chat" }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-6 items-start relative z-10">
                <div className="w-12 h-12 shrink-0 rounded-full bg-[#0f172a] flex items-center justify-center text-white shadow-md ring-4 ring-white">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-medium text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-500 mt-1 font-light">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Simulated Desktop App / Chat View Right Side */}
        <div className="flex-1 p-8 lg:p-12 relative w-full">
          <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Message · Whatsapp</div>
              <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase rounded-full">Delivered</span>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Task Assignment Bubble */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium shrink-0">
                  TP
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm">TaskPulse</span>
                    <span className="text-xs text-gray-400">10:45 AM</span>
                  </div>
                  <div className="bg-gray-100 rounded-2xl p-4 text-sm text-gray-700 leading-relaxed max-w-sm rounded-tl-none">
                    Hello 👋 You've been assigned a new task: "Check shelf A3 inventory."
                    <br /><br />
                    Please reply <strong>DONE</strong> when finished.
                  </div>
                </div>
              </div>

              {/* Reply Bubble */}
              <div className="flex gap-4 flex-row-reverse">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 shrink-0 text-sm">
                  Me
                </div>
                <div className="space-y-1 flex flex-col items-end">
                  <div className="flex items-baseline gap-2 flex-row-reverse">
                    <span className="font-semibold text-sm">Member</span>
                    <span className="text-xs text-gray-400">11:15 AM</span>
                  </div>
                  <div className="bg-[#0f172a] text-white rounded-2xl p-4 text-sm leading-relaxed max-w-sm rounded-tr-none shadow-md">
                    DONE
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
