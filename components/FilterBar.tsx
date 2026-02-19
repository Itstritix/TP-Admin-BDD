"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, Globe, Filter, X } from "lucide-react";

export default function FilterBar({ 
  initialSearch, 
  initialNutriscore, 
  initialCountry 
}: { 
  initialSearch?: string; 
  initialNutriscore?: string; 
  initialCountry?: string; 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fonction pour mettre à jour l'URL proprement
  const updateFilters = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    params.set("page", "1"); // Reset la page à 1 lors d'un filtrage
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-black text-slate-900">Catalogue Qualité</h1>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher un produit ou EAN..."
              defaultValue={initialSearch}
              onKeyDown={(e) => e.key === "Enter" && updateFilters("search", (e.target as HTMLInputElement).value)}
              className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-slate-500 font-bold">
            <Filter size={14} /> <span>Filtrer par :</span>
          </div>

          {/* Nutriscore Pills */}
          <div className="flex gap-1.5">
            {['a', 'b', 'c', 'd', 'e'].map((n) => (
              <button
                key={n}
                onClick={() => updateFilters("nutriscore", initialNutriscore === n ? "" : n)}
                className={`w-8 h-8 flex items-center justify-center rounded-full font-black uppercase transition-all border ${
                  initialNutriscore === n 
                    ? 'ring-2 ring-offset-2 ring-indigo-500 border-transparent scale-110 shadow-md' 
                    : 'border-slate-200 hover:border-slate-400'
                } ${getScoreBg(n)}`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Sélecteur Pays */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
            <Globe size={14} className="text-slate-400" />
            <select 
              value={initialCountry || ""}
              onChange={(e) => updateFilters("country", e.target.value)}
              className="bg-transparent font-semibold text-slate-600 outline-none cursor-pointer"
            >
              <option value="">Tous les pays</option>
              <option value="france">France</option>
              <option value="belgique">Belgique</option>
              <option value="suisse">Suisse</option>
            </select>
          </div>

          {(initialSearch || initialNutriscore || initialCountry) && (
            <button 
              onClick={() => router.push("/dashboard")}
              className="text-red-500 hover:text-red-600 flex items-center gap-1 font-medium ml-auto"
            >
              <X size={14} /> Effacer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getScoreBg(v: string) {
  switch (v?.toLowerCase()) {
    case 'a': return 'bg-emerald-500 text-white';
    case 'b': return 'bg-lime-500 text-white';
    case 'c': return 'bg-yellow-500 text-white';
    case 'd': return 'bg-orange-500 text-white';
    case 'e': return 'bg-red-500 text-white';
    default: return 'bg-slate-100 text-slate-400';
  }
}