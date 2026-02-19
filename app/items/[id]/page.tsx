import { notFound } from "next/navigation";
import { ArrowLeft, Globe, Barcode, Calendar, Leaf, Info } from "lucide-react";
import Link from "next/link";

interface ProductDetail {
  id: string;
  code: string;
  products_name: string;
  categories: string;
  countries: string;
  image_url: string;
  nutriscore: string;
  ecoscore: string;
  enriched_at: string;
}

export default async function ItemPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Déballage des params (Nécessaire pour Next.js 15)
  const { id } = await params;
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const res = await fetch(`${baseUrl}/api/items/${id}`, { cache: 'no-store' });
  
  if (!res.ok) {
    if (res.status === 404) notFound();
    throw new Error("Erreur lors de la récupération du produit");
  }

  const item: ProductDetail = await res.json();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-12">
      <div className="max-w-5xl mx-auto">
        {/* Navigation */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-8 group"
        >
          <div className="p-2 rounded-full group-hover:bg-indigo-50 transition-colors">
            <ArrowLeft size={20} />
          </div>
          <span className="font-semibold">Retour au catalogue</span>
        </Link>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <div className="flex flex-col md:flex-row">
            
            {/* --- SECTION IMAGE --- */}
            <div className="md:w-2/5 bg-slate-50 flex items-center justify-center p-12 border-r border-slate-50">
              {item.image_url ? (
                <div className="relative group">
                  <img 
                    src={item.image_url} 
                    alt={item.products_name} 
                    className="max-h-[400px] w-auto rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 rounded-2xl shadow-inner pointer-events-none"></div>
                </div>
              ) : (
                <div className="text-slate-300 flex flex-col items-center gap-2">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                    <Info size={32} />
                  </div>
                  <span className="font-medium italic">Aucun visuel disponible</span>
                </div>
              )}
            </div>

            {/* --- SECTION CONTENU --- */}
            <div className="md:w-3/5 p-8 md:p-12 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 leading-tight mb-2">
                    {item.products_name || "Produit sans nom"}
                  </h1>
                  <p className="text-indigo-600 font-bold tracking-wide uppercase text-sm">
                    {item.categories || "Catégorie non classée"}
                  </p>
                </div>
              </div>

              {/* Badges de Score */}
              <div className="flex gap-4 mb-10">
                <ScoreCard label="Nutri-Score" value={item.nutriscore} />
              </div>

              {/* Infos Techniques */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-8 border-t border-slate-100">
                <InfoRow 
                  icon={<Barcode className="text-slate-400" />} 
                  label="Code-barres" 
                  value={item.code || "Non renseigné"} 
                  mono 
                />
                <InfoRow 
                  icon={<Globe className="text-slate-400" />} 
                  label="Provenance" 
                  value={item.countries || "Inconnue"} 
                />
                <InfoRow 
                  icon={<Calendar className="text-slate-400" />} 
                  label="Dernière analyse" 
                  value={new Date(item.enriched_at).toLocaleDateString('fr-FR', { 
                    day: 'numeric', month: 'long', year: 'numeric' 
                  })} 
                />
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SOUS-COMPOSANTS ---

function ScoreCard({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) {
  const getScoreColor = (v: string) => {
    switch (v?.toLowerCase()) {
      case 'a': return 'bg-emerald-500 text-white';
      case 'b': return 'bg-lime-500 text-white';
      case 'c': return 'bg-yellow-500 text-white';
      case 'd': return 'bg-orange-500 text-white';
      case 'e': return 'bg-red-500 text-white';
      default: return 'bg-slate-200 text-slate-400';
    }
  };

  return (
    <div className="flex-1 bg-white border border-slate-100 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-sm">
      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
        {icon} {label}
      </span>
      <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-xl font-black shadow-lg ${getScoreColor(value)}`}>
        {value?.toUpperCase() || '?'}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, mono = false }: { icon: any, label: string, value: string, mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1">{icon}</div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{label}</p>
        <p className={`text-sm text-slate-700 font-semibold ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}