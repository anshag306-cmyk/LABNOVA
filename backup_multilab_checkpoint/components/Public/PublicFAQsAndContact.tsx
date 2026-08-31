import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export const PublicFAQsAndContact: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySent, setInquirySent] = useState(false);

  const faqs = [
    {
      q: 'Do I need to fast before my blood collection?',
      a: 'Tests such as Fasting Blood Glucose, Lipid Profile, and Liver Function Tests typically require 10–12 hours of overnight fasting. You may drink plain water, but avoid coffee, tea, milk, or juices. Our phlebotomist will verify your fasting duration before specimen accessioning.',
    },
    {
      q: 'How will I receive my diagnostic report?',
      a: 'As soon as our Consultant Pathologist authorizes your report, a secure digital PDF download link is dispatched directly via SMS and registered email. You can also scan the cryptographic QR code printed on your physical report copy to verify authenticity.',
    },
    {
      q: 'How does LabNova prevent sample mix-up during home collections?',
      a: 'We use pre-printed barcoded vacutainer tubes. At the time of home phlebotomy, the patient verifies their demographic sticker, and the barcode is immediately registered into our LIMS before the tube is sealed in a temperature-controlled transport box.',
    },
    {
      q: 'Can my consulting physician directly discuss findings with your pathologist?',
      a: 'Yes. Our Consultant Pathologists (Dr. Manisha Kulkarni and the medical panel) are available during regular laboratory hours for direct clinician consultations on borderline or critical diagnostic values.',
    },
    {
      q: 'Is LabNova NABL accredited?',
      a: 'Yes, LabNova is accredited as per ISO 15189:2022 by NABL (National Accreditation Board for Testing and Calibration Laboratories), adhering to stringent international clinical laboratory benchmarks.',
    },
  ];

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryPhone.trim()) return;
    setInquirySent(true);
  };

  return (
    <section id="public-faqs" className="py-16 sm:py-24 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* FAQs Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Patient Guidance & Clarity</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Essential guidelines on fasting, sample preservation, turnaround timelines, and report
            verification.
          </p>
        </div>

        {/* FAQ Accordions Grid */}
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-teal-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 mt-1">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact & Location Section */}
        <div
          id="public-contact"
          className="rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-teal-950 text-white p-6 sm:p-10 border border-slate-800 shadow-xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Contact Info & Hours */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold uppercase tracking-wider border border-teal-400/30">
                  Direct Laboratory Access
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Reach Our Diagnostic Desk
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  Have questions about a prescribed investigation, urgent stat reporting, or
                  physician consultations? Connect with our biomedical support team.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <MapPin className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white">Central Pathology Lab</div>
                    <div className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                      4th Floor, Nova Health Tower, Central Med Avenue, Pune - 411004
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <Phone className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white">Phone & Emergency Stat</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Helpline: +91 9675607315
                      <br />
                      Emergency Desk: 9675607315
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <Clock className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white">Sample Draw Timings</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Mon - Sat: 7:00 AM – 9:00 PM
                      <br />
                      Sunday: 7:00 AM – 2:00 PM
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <Mail className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-white">Electronic Reports</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      diagnostics@labnova.com
                      <br />
                      reports@labnova.com
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Patient Inquiry Form */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Send an Investigation Query</h4>
                  <p className="text-[11px] text-slate-400">
                    Our pathology coordinator will respond within 15 minutes
                  </p>
                </div>

                {inquirySent ? (
                  <div className="p-4 rounded-xl bg-teal-950/60 border border-teal-800 text-teal-200 text-xs space-y-2 text-center">
                    <CheckCircle2 className="w-6 h-6 text-teal-400 mx-auto" />
                    <div className="font-bold">Inquiry Transmitted!</div>
                    <p className="text-[11px] text-slate-300">
                      Our desk coordinator will reach out to you shortly.
                    </p>
                    <button
                      type="button"
                      onClick={() => setInquirySent(false)}
                      className="text-[10px] text-teal-400 underline font-semibold"
                    >
                      Send another query
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Your Name</label>
                      <input
                        id="input-inquiry-name"
                        type="text"
                        required
                        value={inquiryName}
                        onChange={(e) => setInquiryName(e.target.value)}
                        placeholder="e.g. Ananya Sen"
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
                      <input
                        id="input-inquiry-phone"
                        type="tel"
                        required
                        value={inquiryPhone}
                        onChange={(e) => setInquiryPhone(e.target.value)}
                        placeholder="+91 98200 00000"
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Inquiry / Prescribed Tests
                      </label>
                      <textarea
                        rows={3}
                        value={inquiryMessage}
                        onChange={(e) => setInquiryMessage(e.target.value)}
                        placeholder="Mention your test names or questions..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <button
                      id="btn-submit-inquiry"
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition transform active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Query</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
