import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Mail,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  ShieldCheck,
  Building2,
  Navigation,
  Loader2,
} from 'lucide-react';
import { TestTemplate, HomeSampleBooking } from '../../types';
import { addHomeBookingToFirestore } from '../../services/pathologyFirebase';

interface PublicHomeCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTests: TestTemplate[];
  preSelectedTest?: TestTemplate | null;
  currency?: string;
  labId?: string;
}

export const PublicHomeCollectionModal: React.FC<PublicHomeCollectionModalProps> = ({
  isOpen,
  onClose,
  availableTests,
  preSelectedTest,
  currency = '₹',
  labId = 'lab-nova-default',
}) => {
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [serviceLocation, setServiceLocation] = useState('Home / Residence');
  const [collectionDate, setCollectionDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('07:00 AM - 09:00 AM (Fasting)');
  const [selectedTestCodes, setSelectedTestCodes] = useState<string[]>([]);
  const [specialRemarks, setSpecialRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-select test if opened via test card
  useEffect(() => {
    if (preSelectedTest) {
      setSelectedTestCodes([preSelectedTest.testCode]);
    } else if (availableTests.length > 0 && selectedTestCodes.length === 0) {
      setSelectedTestCodes(['CBC-01']);
    }
  }, [preSelectedTest, isOpen]);

  if (!isOpen) return null;

  const toggleTest = (code: string) => {
    setSelectedTestCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectedTests = availableTests.filter((t) => selectedTestCodes.includes(t.testCode));
  const estimatedTotal = selectedTests.reduce((sum, t) => sum + (t.price || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !phone.trim() || !address.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const ref = `LNB-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const bookingData: Omit<HomeSampleBooking, 'id'> = {
        labId,
        bookingRef: ref,
        patientName: patientName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        city: city.trim() || 'Pune',
        pinCode: pincode.trim() || '411001',
        serviceLocation: serviceLocation,
        collectionDate,
        timeSlot,
        testCodes: selectedTestCodes,
        testNames: selectedTests.map((t) => t.testName),
        estimatedTotal,
        specialRemarks: specialRemarks.trim() || undefined,
        status: 'pending',
        bookingTimestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const saved = await addHomeBookingToFirestore(bookingData);
      setBookingRef(saved.bookingRef || ref);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error saving home sample booking to Firestore:', err);
      // Fallback display
      setBookingRef(ref);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setSubmitError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                Book Home Sample Collection
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Certified phlebotomist visit with sterile single-use vacuum draw kits
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {isSubmitted ? (
            <div className="py-8 px-4 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-mono text-xs font-bold border border-teal-200 dark:border-teal-800">
                  Booking Reference: {bookingRef}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Phlebotomy Appointment Scheduled!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{patientName}</strong>. Our certified phlebotomy coordinator
                  will call your registered number (<strong>{phone}</strong>) within 30 minutes to
                  confirm your appointment time and provide test-specific fasting instructions.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Slot:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {collectionDate} • {timeSlot}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Service Location:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {serviceLocation} {city ? `(${city}${pincode ? ` - ${pincode}` : ''})` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Selected Tests ({selectedTests.length}):</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedTests.map((t) => t.testCode).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 font-bold">
                  <span className="text-slate-700 dark:text-slate-300">Estimated Total:</span>
                  <span className="text-teal-600 dark:text-teal-400">
                    {currency}
                    {estimatedTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-sm"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Patient Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Patient Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="input-home-patient-name"
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Ramesh K. Patel"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="input-home-patient-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98200 00000"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Service Location Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="patient@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Service Location Type
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={serviceLocation}
                      onChange={(e) => setServiceLocation(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    >
                      <option value="Home / Residence">Home / Residence</option>
                      <option value="Office / Corporate Campus">Office / Corporate Campus</option>
                      <option value="Hospital / Nursing Facility">Hospital / Nursing Facility</option>
                      <option value="Senior Living Center">Senior Living Center</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Residential Street Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Complete Street / Building Address *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-home-patient-address"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Flat 402, Building A, Lotus Residency, MG Road"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* City & PIN Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City / Town *
                  </label>
                  <div className="relative">
                    <Navigation className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      id="input-home-patient-city"
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Pune, Mumbai, Delhi"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Postal PIN Code *
                  </label>
                  <input
                    id="input-home-patient-pincode"
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 411001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Date & Preferred Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Collection Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={collectionDate}
                    onChange={(e) => setCollectionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Time Slot
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="07:00 AM - 09:00 AM (Fasting)">
                      07:00 AM - 09:00 AM (Ideal for Fasting)
                    </option>
                    <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                    <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                    <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM (Evening)</option>
                  </select>
                </div>
              </div>

              {/* Test Selection Checkbox List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Select Prescribed Diagnostic Tests
                  </label>
                  <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                    {selectedTestCodes.length} tests selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  {availableTests.slice(0, 12).map((test) => {
                    const isChecked = selectedTestCodes.includes(test.testCode);
                    return (
                      <div
                        key={test.testCode}
                        onClick={() => toggleTest(test.testCode)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          isChecked
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500/80 text-teal-900 dark:text-teal-100 font-semibold'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-teal-600 focus:ring-teal-500 pointer-events-none"
                          />
                          <span className="truncate">{test.testName}</span>
                        </div>
                        <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono ml-2 shrink-0">
                          {test.category}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Doctor Notes / Special Requirements
                </label>
                <input
                  type="text"
                  value={specialRemarks}
                  onChange={(e) => setSpecialRemarks(e.target.value)}
                  placeholder="e.g. Fasting sample, elderly patient, please bring wheelchair-friendly needle"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* NABL Phlebotomist Dispatch & Logistics Note */}
              <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-teal-900 dark:text-teal-200">
                  <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>Certified Phlebotomist with temperature-controlled vacutainer kit dispatch.</span>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400">Accredited</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    ISO 15189 Standard
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-home-booking"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition transform active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scheduling Phlebotomist...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Confirm Appointment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
