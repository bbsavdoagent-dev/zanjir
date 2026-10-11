import React from 'react';

export interface PortalTab<Id extends string> {
  id: Id;
  label: React.ReactNode;
}

interface PortalTabsProps<Id extends string> {
  tabs: PortalTab<Id>[];
  activeTab: Id;
  onChange: (id: Id) => void;
}

/** Kompaniya va do'kon kabinetlari tepasidagi bir xil ko'rinishli tab tugmalari. */
export function PortalTabs<Id extends string>({ tabs, activeTab, onChange }: PortalTabsProps<Id>) {
  return (
    <div className="flex flex-wrap items-center bg-emerald-900/80 p-1.5 rounded-2xl border border-emerald-800/80 text-xs font-bold relative z-10">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === tab.id
              ? 'bg-white text-emerald-950 shadow-md'
              : 'text-emerald-200 hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
