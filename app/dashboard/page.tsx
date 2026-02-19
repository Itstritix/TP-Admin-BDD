import React from 'react';
import Link from 'next/link';
import { ChevronRight, Barcode, Image as ImageIcon, Globe, ChevronLeft, Search } from 'lucide-react';
import FilterBar from '@/components/FilterBar';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; nutriscore?: string; search?: string; country?: string }>;
}) {
  const params = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const currentPage = Number(params.page) || 1;
  
  const queryParams = new URLSearchParams({
    page: currentPage.toString(),
    nutriscore: params.nutriscore || '',
    search: params.search || '',
    country: params.country || ''
  });

  const res = await fetch(`${baseUrl}/api/items?${queryParams.toString()}`, { cache: 'no-store' });
  const data = res.ok ? await res.json() : { items: [], total: 0, pageSize: 20 };

  const totalPages = Math.ceil(data.total / (data.pageSize || 20));

  const getPageUrl = (pageNumber: number) => {
    const newParams = new URLSearchParams(queryParams);
    newParams.set('page', pageNumber.toString());
    return `?${newParams.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <FilterBar 
        initialSearch={params.search}
        initialNutriscore={params.nutriscore}
        initialCountry={params.country}
      />

      <div className="max-w-7xl mx-auto px-6 mt-10">
        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden transition-all">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[11px] font-bold uppercase tracking-widest text-slate-400">Produit</th>
                <th className="px-6 py-6 text-[11px] font-bold uppercase tracking-widest text-slate-400">Catégorie</th>
                <th className="px-6 py-6 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">Qualité</th>
                <th className="px-6 py-6 text-[11px] font-bold uppercase tracking-widest text-slate-400">Origine</th>
                <th className="px-8 py-6 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">Fiche</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.items.map((product: any) => (
                <tr key={product.id} className="group hover:bg-indigo-50/20 transition-all duration-300 cursor-default">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0 relative group-hover:scale-105 transition-transform duration-500 shadow-sm">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          <ImageIcon className="w-full h-full p-5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors truncate max-w-[280px]">
                          {product.products_name || "Produit sans nom"}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1.5 py-0.5 px-2 bg-slate-100 rounded-md w-fit border border-slate-200/50">
                          <Barcode size={12} className="text-slate-500" />
                          <span className="text-[10px] font-mono font-medium text-slate-600 tracking-tight">
                            {product.code || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-5">
                    <span className="text-[12px] font-medium text-slate-500 italic bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                      {product.categories || "Non classé"}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                       <ScoreBadge val={product.nutriscore} label="Nutri-Score" />
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-600">
                      <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-400">
                        <Globe size={14} />
                      </div>
                      <span className="capitalize">{product.countries?.split(',')[0] || "Inconnu"}</span>
                    </div>
                  </td>

                  <td className="px-8 py-5 text-right">
                    <Link 
                      href={`/items/${product.id}`} 
                      className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-600 hover:rotate-6 transition-all shadow-sm active:scale-90"
                    >
                      <ChevronRight size={22} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.items.length === 0 && (
            <div className="py-32 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-200 mb-6">
                <Search size={40} />
              </div>
              <h3 className="text-slate-900 font-bold text-xl mb-2">Aucun résultat</h3>
              <p className="text-slate-400 max-w-xs mx-auto">Essayez d'ajuster vos filtres ou de modifier votre recherche.</p>
            </div>
          )}

          {/* --- BARRE DE PAGINATION ADAPTÉE --- */}
          {totalPages > 1 && (
            <div className="px-10 py-8 bg-[#FDFDFF] border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <span className="text-sm font-bold text-slate-800">Page {currentPage} de {totalPages}</span>
                <span className="text-xs text-slate-400 font-medium tracking-tight">Total : {data.total} produits trouvés</span>
              </div>
              
              <div className="flex items-center gap-3">
                <Link
                  href={getPageUrl(currentPage - 1)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-bold transition-all border ${
                    currentPage <= 1 
                      ? 'bg-slate-50 text-slate-300 border-slate-100 pointer-events-none' 
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-500 hover:text-indigo-600 shadow-sm'
                  }`}
                >
                  <ChevronLeft size={16} /> Précédent
                </Link>

                <div className="hidden md:flex gap-1">
                    {[...Array(Math.min(3, totalPages))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                            <Link 
                                key={pageNum}
                                href={getPageUrl(pageNum)}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-400 hover:bg-indigo-50'}`}
                            >
                                {pageNum}
                            </Link>
                        )
                    })}
                    {totalPages > 3 && <span className="w-10 h-10 flex items-center justify-center text-slate-300">...</span>}
                </div>
                
                <Link
                  href={getPageUrl(currentPage + 1)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-bold transition-all border ${
                    currentPage >= totalPages 
                      ? 'bg-slate-50 text-slate-300 border-slate-100 pointer-events-none' 
                      : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-transform active:scale-95'
                  }`}
                >
                  Suivant <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBadge({ val, label }: { val: string, label: string }) {
  const getColors = (v: string) => {
    switch (v?.toLowerCase()) {
      case 'a': return 'bg-[#008143] text-white ring-4 ring-emerald-50';
      case 'b': return 'bg-[#85BB2F] text-white ring-4 ring-lime-50';
      case 'c': return 'bg-[#FECB02] text-[#8C6D01] ring-4 ring-yellow-50';
      case 'd': return 'bg-[#EE8100] text-white ring-4 ring-orange-50';
      case 'e': return 'bg-[#E63E11] text-white ring-4 ring-red-50';
      default: return 'bg-slate-200 text-slate-400';
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-10 h-10 flex items-center justify-center font-black text-lg rounded-xl shadow-sm transition-transform hover:scale-110 duration-300 ${getColors(val)}`}>
        {val?.toUpperCase() || '?'}
      </div>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
    </div>
  );
}