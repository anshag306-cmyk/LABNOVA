import React, { useState } from 'react';
import {
  AlertCircle,
  Barcode,
  Boxes,
  Calendar,
  CheckCircle2,
  Database,
  Filter,
  Grid,
  MapPin,
  Plus,
  QrCode,
  Search,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { Sample, SampleType } from '../../types';

export const SampleRegistry: React.FC = () => {
  const { samples, addSample, updateSample, deleteSample } = useLab();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStorage, setSelectedStorage] = useState<string>('all');

  // Selected sample for detail modal
  const [activeSample, setActiveSample] = useState<Sample | null>(null);

  // New Sample modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<SampleType>('DNA');
  const [newConc, setNewConc] = useState('150 ng/µL');
  const [newVol, setNewVol] = useState(50);
  const [newStorage, setNewStorage] = useState('Freezer -80°C Alpha');
  const [newRack, setNewRack] = useState('Rack A1');
  const [newBox, setNewBox] = useState('Box-01');
  const [newWell, setNewWell] = useState('A3');
  const [newBsl, setNewBsl] = useState<'BSL-1' | 'BSL-2' | 'BSL-3'>('BSL-1');

  // Plate map matrix definitions (96-well: Rows A to H, Columns 1 to 12)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const cols = Array.from({ length: 12 }, (_, i) => i + 1);

  const filteredSamples = samples.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.storageUnit.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || s.type === selectedType;
    const matchesStorage = selectedStorage === 'all' || s.storageUnit === selectedStorage;

    return matchesSearch && matchesType && matchesStorage;
  });

  const getSampleColor = (type: SampleType) => {
    switch (type) {
      case 'DNA':
        return 'bg-blue-500 text-white';
      case 'RNA':
        return 'bg-purple-500 text-white';
      case 'Protein':
        return 'bg-amber-500 text-white';
      case 'Cell Line':
        return 'bg-emerald-500 text-white';
      case 'Tissue':
        return 'bg-rose-500 text-white';
      case 'Plasma':
        return 'bg-red-500 text-white';
      default:
        return 'bg-teal-500 text-white';
    }
  };

  const handleCreateSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addSample({
      name: newName.trim(),
      type: newType,
      concentration: newConc.trim(),
      volumeRemainingUl: Number(newVol),
      storageUnit: newStorage,
      rackLocation: {
        rack: newRack,
        box: newBox,
        well: newWell,
      },
      biosafetyLevel: newBsl,
    });

    setIsAddModalOpen(false);
    setNewName('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Ingestion Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Sample & Biospecimen Repository
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            2D DataMatrix barcode tracking, multi-zone cold-storage hierarchy, and 96-well plate mapping.
          </p>
        </div>

        <button
          id="btn-register-sample"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Register Specimen</span>
        </button>
      </div>

      {/* 96-Well Microplate Visualizer Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Grid className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Interactive 96-Well Storage Matrix (Freezer Alpha - Box 01)
            </h2>
          </div>

          {/* Sample Type Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-600 dark:text-slate-400">DNA</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-slate-600 dark:text-slate-400">RNA</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600 dark:text-slate-400">Protein</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400">Cell Line</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
              <span className="text-slate-400">Empty Well</span>
            </div>
          </div>
        </div>

        {/* 96-Well Plate Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-block min-w-[620px] p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            {/* Column Headers: 1 to 12 */}
            <div className="grid grid-cols-13 gap-1.5 mb-1.5 text-center text-[10px] font-mono font-bold text-slate-400">
              <div className="w-6" />
              {cols.map((c) => (
                <div key={c} className="w-8">
                  {c}
                </div>
              ))}
            </div>

            {/* Rows: A to H */}
            {rows.map((row) => (
              <div key={row} className="grid grid-cols-13 gap-1.5 mb-1.5 items-center">
                <div className="w-6 text-center text-xs font-mono font-bold text-slate-400">
                  {row}
                </div>

                {cols.map((col) => {
                  const wellCoord = `${row}${col}`;
                  const sampleInWell = samples.find(
                    (s) => s.rackLocation?.well === wellCoord
                  );

                  return (
                    <button
                      key={col}
                      id={`well-${wellCoord}`}
                      onClick={() => {
                        if (sampleInWell) {
                          setActiveSample(sampleInWell);
                        } else {
                          setNewWell(wellCoord);
                          setIsAddModalOpen(true);
                        }
                      }}
                      title={
                        sampleInWell
                          ? `${sampleInWell.name} (${sampleInWell.type}) - ${sampleInWell.concentration}`
                          : `Empty well ${wellCoord} - click to assign`
                      }
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-inner border text-[10px] font-mono font-bold ${
                        sampleInWell
                          ? `${getSampleColor(
                              sampleInWell.type
                            )} border-transparent hover:scale-110 ring-2 ring-white dark:ring-slate-900`
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-emerald-600'
                      }`}
                    >
                      {sampleInWell ? wellCoord : ''}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search samples by ID, barcode, name, or storage unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Specimen Types</option>
            <option value="DNA">DNA</option>
            <option value="RNA">RNA</option>
            <option value="Protein">Protein</option>
            <option value="Cell Line">Cell Line</option>
            <option value="Plasma/Serum">Plasma/Serum</option>
            <option value="Chemical Compound">Chemical Compound</option>
          </select>

          <select
            value={selectedStorage}
            onChange={(e) => setSelectedStorage(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Storage Freezers</option>
            <option value="Freezer -80°C Alpha">Freezer -80°C Alpha</option>
            <option value="Cryotank LN2 Bravo">Cryotank LN2 Bravo</option>
            <option value="Cold Room 4°C">Cold Room 4°C</option>
          </select>
        </div>
      </div>

      {/* Samples Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Sample ID & Barcode</th>
                <th className="py-3 px-4">Specimen Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Conc / Vol</th>
                <th className="py-3 px-4">Storage Coordinates</th>
                <th className="py-3 px-4">BSL</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredSamples.map((s) => (
                <tr
                  key={s.id}
                  id={`sample-row-${s.id}`}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {s.id}
                    </div>
                    <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono mt-0.5">
                      <Barcode className="w-3.5 h-3.5" />
                      <span>{s.barcode}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 max-w-[200px]">
                    <div className="truncate">{s.name}</div>
                    <div className="text-[11px] font-normal text-slate-400">
                      By {s.createdBy} • {s.createdAt}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getSampleColor(
                        s.type
                      )}`}
                    >
                      {s.type}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {s.concentration}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {s.volumeRemainingUl} µL left
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {s.storageUnit}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {s.rackLocation?.rack || 'Rack 1'} • {s.rackLocation?.box || 'Box 1'} • Well{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {s.rackLocation?.well || 'A1'}
                      </strong>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {s.biosafetyLevel}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setActiveSample(s)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-semibold"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => deleteSample(s.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 transition-colors"
                        title="Archive sample"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Sample Detail Modal */}
      {activeSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Specimen Record: {activeSample.id}
                </h3>
              </div>
              <button
                onClick={() => setActiveSample(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <div className="font-mono text-base font-black text-slate-900 dark:text-slate-100">
                  {activeSample.barcode}
                </div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block mt-0.5">
                  2D DataMatrix Barcode
                </span>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block">Specimen Name</label>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {activeSample.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold block">Type</label>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeSample.type}
                  </p>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block">Biosafety</label>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeSample.biosafetyLevel}
                  </p>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block">Concentration</label>
                  <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {activeSample.concentration}
                  </p>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block">Volume Remaining</label>
                  <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {activeSample.volumeRemainingUl} µL
                  </p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/80">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                  Storage Coordinates
                </span>
                <p className="text-slate-800 dark:text-slate-200 font-mono">
                  {activeSample.storageUnit} &gt; {activeSample.rackLocation?.rack || 'Rack 1'} &gt;{' '}
                  {activeSample.rackLocation?.box || 'Box 1'} &gt; Well {activeSample.rackLocation?.well || 'A1'}
                </p>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block">Notes & Quality</label>
                <p className="text-slate-700 dark:text-slate-300 italic">
                  {activeSample.notes || 'No specific notes recorded.'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveSample(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register New Sample Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Register Biospecimen to Repository
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSample} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Specimen / Target Identifier:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Purified Cas9 Nuclease Clone 4B"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Specimen Type:
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as SampleType)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="DNA">DNA</option>
                    <option value="RNA">RNA</option>
                    <option value="Protein">Protein</option>
                    <option value="Cell Line">Cell Line</option>
                    <option value="Plasma/Serum">Plasma/Serum</option>
                    <option value="Chemical Compound">Chemical Compound</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Biosafety Level:
                  </label>
                  <select
                    value={newBsl}
                    onChange={(e) =>
                      setNewBsl(e.target.value as 'BSL-1' | 'BSL-2' | 'BSL-3')
                    }
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="BSL-1">BSL-1 (Minimal)</option>
                    <option value="BSL-2">BSL-2 (Moderate Hazard)</option>
                    <option value="BSL-3">BSL-3 (High Containment)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Concentration:
                  </label>
                  <input
                    type="text"
                    value={newConc}
                    onChange={(e) => setNewConc(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Remaining Volume (µL):
                  </label>
                  <input
                    type="number"
                    value={newVol}
                    onChange={(e) => setNewVol(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Storage Unit:
                  </label>
                  <select
                    value={newStorage}
                    onChange={(e) => setNewStorage(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Freezer -80°C Alpha">Freezer -80°C Alpha</option>
                    <option value="Cryotank LN2 Bravo">Cryotank LN2 Bravo</option>
                    <option value="Cold Room 4°C">Cold Room 4°C</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Target 96-Well Coordinate:
                  </label>
                  <input
                    type="text"
                    value={newWell}
                    onChange={(e) => setNewWell(e.target.value.toUpperCase())}
                    placeholder="e.g. A3, C7"
                    className="w-full p-2.5 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  Confirm Ingestion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
