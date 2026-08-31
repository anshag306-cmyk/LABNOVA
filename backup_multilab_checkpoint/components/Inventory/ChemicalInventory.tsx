import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Beaker,
  CheckCircle2,
  FileText,
  Flame,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Skull,
  Sparkles,
  X,
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { ChemicalInventoryItem, GHSHazard } from '../../types';

export const ChemicalInventory: React.FC = () => {
  const {
    inventory,
    updateInventoryQuantity,
    addInventoryItem,
    openAiAssistant,
  } = useLab();

  const [searchQuery, setSearchQuery] = useState('');
  const [hazardFilter, setHazardFilter] = useState<string>('all');
  const [selectedItemForSds, setSelectedItemForSds] = useState<ChemicalInventoryItem | null>(null);

  // New item modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');
  const [casNumber, setCasNumber] = useState('');
  const [quantity, setQuantity] = useState(500);
  const [unit, setUnit] = useState('mL');
  const [minThreshold, setMinThreshold] = useState(100);
  const [location, setLocation] = useState('Flammables Safety Cabinet C-12');
  const [storageTemp, setStorageTemp] = useState('Ambient Room Temp');
  const [selectedHazards, setSelectedHazards] = useState<GHSHazard[]>(['flammable']);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.casNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.formula?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesHazard =
      hazardFilter === 'all' || (item.ghsHazards && item.ghsHazards.includes(hazardFilter as GHSHazard));

    return matchesSearch && matchesHazard;
  });

  const renderHazardBadge = (hazard: GHSHazard) => {
    switch (hazard) {
      case 'flammable':
        return (
          <span
            key={hazard}
            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
          >
            <Flame className="w-3 h-3 text-red-600" />
            <span>Flammable</span>
          </span>
        );
      case 'toxic':
      case 'fatal':
        return (
          <span
            key={hazard}
            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
          >
            <Skull className="w-3 h-3 text-purple-600" />
            <span>Toxic</span>
          </span>
        );
      case 'corrosive':
        return (
          <span
            key={hazard}
            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
          >
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Corrosive</span>
          </span>
        );
      case 'carcinogen':
      case 'mutagen':
        return (
          <span
            key={hazard}
            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
          >
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            <span>Health Hazard</span>
          </span>
        );
      default:
        return (
          <span
            key={hazard}
            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <AlertCircle className="w-3 h-3" />
            <span>{hazard}</span>
          </span>
        );
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !casNumber.trim()) return;

    const newItem: ChemicalInventoryItem = {
      id: `CHM-${Date.now().toString(36).toUpperCase()}`,
      name: name.trim(),
      casNumber: casNumber.trim(),
      formula: formula.trim() || undefined,
      quantity: Number(quantity),
      unit,
      minThreshold: Number(minThreshold),
      location,
      storageTemp,
      ghsHazards: selectedHazards,
      expiryDate: '2028-12-31',
      sdsSummary: {
        signalWord: selectedHazards.includes('toxic') || selectedHazards.includes('flammable') ? 'DANGER' : 'WARNING',
        hazardStatements: ['H225: Highly flammable liquid', 'H319: Causes serious eye irritation'],
        precautionaryStatements: ['P210: Keep away from heat/sparks', 'P305: IF IN EYES rinse cautiously with water'],
        firstAid: 'Flush contaminated areas with copious water for at least 15 minutes. Seek emergency medical evaluation.',
        ppeRequired: ['Safety Spectacles', 'Nitrile Gloves (0.11 mm min)', 'Fume Hood Ventilation'],
      },
    };

    addInventoryItem(newItem);
    setIsAddModalOpen(false);
    setName('');
    setCasNumber('');
    setFormula('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Chemical Inventory & Safety Data Sheets (SDS)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            GHS hazard classifications, CAS registry validation, and AI reagent compatibility analysis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openAiAssistant('chemical-safety')}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>AI Safety & Reactivity</span>
          </button>

          <button
            id="btn-add-reagent"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Catalog Reagent</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search reagents by chemical name, formula, CAS number, or cabinet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={hazardFilter}
            onChange={(e) => setHazardFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All GHS Hazard Classes</option>
            <option value="flammable">Flammable</option>
            <option value="toxic">Toxic / Fatal</option>
            <option value="corrosive">Corrosive</option>
            <option value="irritant">Irritant</option>
            <option value="carcinogen">Carcinogen / Mutagen</option>
          </select>
        </div>
      </div>

      {/* Chemical Inventory Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Chemical & CAS ID</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Storage Location</th>
                <th className="py-3 px-4">GHS Classification</th>
                <th className="py-3 px-4 text-right">Quick Dispense / SDS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredInventory.map((item) => {
                const isLow = item.quantity <= item.minThreshold;

                return (
                  <tr
                    key={item.id}
                    id={`inventory-row-${item.id}`}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {item.name}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        <span>CAS: {item.casNumber}</span>
                        {item.formula && (
                          <>
                            <span>•</span>
                            <span className="font-semibold">{item.formula}</span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono text-sm font-bold ${
                            isLow
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {item.quantity} {item.unit}
                        </span>
                        {isLow && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            LOW
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Min threshold: {item.minThreshold} {item.unit}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {item.location}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.storageTemp}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.ghsHazards && item.ghsHazards.length > 0 ? (
                          item.ghsHazards.map((h) => renderHazardBadge(h))
                        ) : item.ghsTags && item.ghsTags.length > 0 ? (
                          item.ghsTags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              <AlertCircle className="w-3 h-3 text-slate-500" />
                              <span>{tag}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">Non-hazardous</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Dispense button */}
                        <button
                          onClick={() => updateInventoryQuantity(item.id, -25)}
                          disabled={item.quantity <= 0}
                          title="Dispense 25 units"
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold disabled:opacity-30"
                        >
                          -25
                        </button>

                        {/* Restock button */}
                        <button
                          onClick={() => updateInventoryQuantity(item.id, 250)}
                          title="Restock 250 units"
                          className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold"
                        >
                          +250
                        </button>

                        {/* View SDS */}
                        <button
                          onClick={() => setSelectedItemForSds(item)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center space-x-1"
                        >
                          <FileText className="w-3 h-3 text-slate-400" />
                          <span>SDS</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Data Sheet (SDS) Inspector Modal */}
      {selectedItemForSds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  OSHA / GHS Safety Data Sheet Brief
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {selectedItemForSds.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItemForSds(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">CAS Registry:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {selectedItemForSds.casNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Signal Word:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      (selectedItemForSds.sdsSummary?.signalWord || (selectedItemForSds.hazardDiamond && selectedItemForSds.hazardDiamond.flammability >= 3 ? 'DANGER' : 'WARNING')) === 'DANGER'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {selectedItemForSds.sdsSummary?.signalWord || (selectedItemForSds.hazardDiamond && selectedItemForSds.hazardDiamond.flammability >= 3 ? 'DANGER' : 'WARNING')}
                  </span>
                </div>
              </div>

              {/* Hazard Statements */}
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                  Hazard Statements (H-Codes):
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  {(selectedItemForSds.sdsSummary?.hazardStatements || selectedItemForSds.ghsTags || ['Standard laboratory handling precautions apply.']).map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>

              {/* Precautionary */}
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                  Precautionary Measures (P-Codes):
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  {(selectedItemForSds.sdsSummary?.precautionaryStatements || ['P280: Wear protective gloves and eye protection.', 'P264: Wash hands thoroughly after handling.']).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              {/* PPE */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60">
                <span className="font-bold text-blue-900 dark:text-blue-200 block mb-1">
                  Required Personal Protective Equipment (PPE):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedItemForSds.sdsSummary?.ppeRequired || selectedItemForSds.ppe || ['Lab Coat', 'Nitrile Gloves', 'Eye Protection']).map((ppe, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-white dark:bg-blue-900/80 text-blue-900 dark:text-blue-100 font-semibold border border-blue-200 dark:border-blue-800"
                    >
                      {ppe}
                    </span>
                  ))}
                </div>
              </div>

              {/* First aid */}
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                  Emergency First Aid Protocol:
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {selectedItemForSds.sdsSummary?.firstAid || 'Flush affected areas with copious water for at least 15 minutes. Remove contaminated clothing. Seek medical attention if irritation persists.'}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setSelectedItemForSds(null);
                  openAiAssistant('chemical-safety', {
                    reagent: selectedItemForSds.name,
                    casNumber: selectedItemForSds.casNumber,
                  });
                }}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI Reactivity</span>
              </button>

              <button
                onClick={() => setSelectedItemForSds(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Reagent Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Beaker className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Catalog Chemical / Reagent to Inventory
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Chemical Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sodium Dodecyl Sulfate (SDS)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    CAS Registry Number:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 151-21-3"
                    value={casNumber}
                    onChange={(e) => setCasNumber(e.target.value)}
                    className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Molecular Formula (optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NaC12H25SO4"
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Quantity:
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Unit:
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="mL">mL</option>
                    <option value="L">L</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="mg">mg</option>
                    <option value="units">units</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Min Threshold:
                  </label>
                  <input
                    type="number"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(Number(e.target.value))}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Storage Cabinet / Bench Location:
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
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
                  Catalog Chemical
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
