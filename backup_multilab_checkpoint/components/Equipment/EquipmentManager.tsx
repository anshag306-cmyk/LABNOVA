import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  FileCheck,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { Equipment, EquipmentReservation } from '../../types';

export const EquipmentManager: React.FC = () => {
  const { equipment, reserveEquipment, updateEquipmentStatus } = useLab();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Reservation modal state
  const [selectedEquipmentForBooking, setSelectedEquipmentForBooking] = useState<Equipment | null>(null);
  const [bookingUser, setBookingUser] = useState('Dr. Elena Rostova');
  const [bookingExpTitle, setBookingExpTitle] = useState('Quantification Assay Run');
  const [bookingDate, setBookingDate] = useState('2026-08-31');
  const [bookingStart, setBookingStart] = useState('14:00');
  const [bookingEnd, setBookingEnd] = useState('16:30');

  const filteredEquipment = equipment.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Equipment['status']) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
      case 'in_use':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
      case 'maintenance':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      case 'calibration_due':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipmentForBooking) return;

    reserveEquipment(selectedEquipmentForBooking.id, {
      userId: 'USER-01',
      userName: bookingUser,
      experimentTitle: bookingExpTitle,
      startTime: `${bookingDate} ${bookingStart}`,
      endTime: `${bookingDate} ${bookingEnd}`,
      status: 'confirmed',
    });

    setSelectedEquipmentForBooking(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Instrument Fleet & Calibration Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Equipment reservations, preventive maintenance tracking, and GLP calibration compliance.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search instruments by name, model, serial, or room location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Operational Statuses</option>
            <option value="available">Available (Ready)</option>
            <option value="in_use">Currently In Use</option>
            <option value="maintenance">Under Maintenance</option>
            <option value="calibration_due">Calibration Due</option>
          </select>
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredEquipment.map((eq) => (
          <div
            key={eq.id}
            id={`equipment-card-${eq.id}`}
            className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {eq.id}
                  </span>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {eq.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Model: {eq.model} • SN: {eq.serialNumber}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(
                      eq.status
                    )}`}
                  >
                    {eq.status.replace('_', ' ')}
                  </span>

                  {/* Status Toggle Dropdown */}
                  <select
                    value={eq.status}
                    onChange={(e) =>
                      updateEquipmentStatus(
                        eq.id,
                        e.target.value as Equipment['status']
                      )
                    }
                    className="text-[10px] py-0.5 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <option value="available">Set: Available</option>
                    <option value="in_use">Set: Running Cycle</option>
                    <option value="maintenance">Set: Maintenance</option>
                    <option value="calibration_due">Set: Calibration Due</option>
                  </select>
                </div>
              </div>

              {/* Maintenance & Location Specs */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Location:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {eq.location}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Service Contact:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {eq.maintenanceContact}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Last Calibrated:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {eq.lastCalibrated}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Next Calibration:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {eq.nextCalibrationDue}
                  </span>
                </div>
              </div>

              {/* Existing Bookings List */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  Upcoming Reservations ({(eq.reservations || []).length})
                </span>

                {(eq.reservations || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No active reservations scheduled today.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {(eq.reservations || []).map((res) => (
                      <div
                        key={res.id}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                            {res.experimentTitle}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {(res as any).userName || res.user || 'Lab Scientist'}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {res.startTime?.includes(' ') ? res.startTime.split(' ')[1] : res.startTime} - {res.endTime?.includes(' ') ? res.endTime.split(' ')[1] : res.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Book Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedEquipmentForBooking(eq)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Reserve Time Slot</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reserve Time Slot Modal */}
      {selectedEquipmentForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Schedule Instrument Run
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedEquipmentForBooking.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEquipmentForBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Operator / Researcher:
                </label>
                <input
                  type="text"
                  required
                  value={bookingUser}
                  onChange={(e) => setBookingUser(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Experiment Run Title:
                </label>
                <input
                  type="text"
                  required
                  value={bookingExpTitle}
                  onChange={(e) => setBookingExpTitle(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Date:
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Start Time:
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingStart}
                    onChange={(e) => setBookingStart(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    End Time:
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingEnd}
                    onChange={(e) => setBookingEnd(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedEquipmentForBooking(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
