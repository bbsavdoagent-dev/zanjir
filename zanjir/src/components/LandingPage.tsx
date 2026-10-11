import React from 'react';
import {
  ShieldCheck,
  Zap,
  Building2,
  Store,
  ArrowRight,
  Check,
  X,
  Clock,
  Truck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Aloqa ma'lumotlari .env orqali beriladi (ixtiyoriy): VITE_CONTACT_PHONE, VITE_CONTACT_EMAIL
const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE as string | undefined;
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;

interface LandingPageProps {
  onSelectRole: (role: 'company' | 'store') => void;
  onOpenAuth: (tab: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectRole,
  onOpenAuth
}) => {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 border-b border-emerald-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            O'zbekistonda B2B ulgurji savdo inqilobi
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Agentsiz. <span className="text-emerald-400 underline decoration-emerald-500/50 decoration-wavy">To'g'ridan-to'g'ri</span> savdo.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-emerald-100/80 leading-relaxed font-normal">
            Ishlab chiqaruvchi zavodlar va chakana oziq-ovqat do'konlari o'rtasida shaffof, tezkor va ortiqcha vositachilarsiz buyurtma platformasi.
          </p>

          {/* Dual CTAs for Company and Store */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <button
              onClick={() => {
                // Kirgan bo'lsa o'z kabineti, aks holda kirish oynasi
                if (currentUser) onSelectRole(currentUser.role);
                else onOpenAuth('login');
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Building2 className="w-4 h-4 text-slate-950" />
              <span>Kompaniya kabineti</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => {
                // Kirgan bo'lsa o'z kabineti, aks holda kirish oynasi
                if (currentUser) onSelectRole(currentUser.role);
                else onOpenAuth('login');
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm border border-emerald-400/30 backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Store className="w-4 h-4 text-emerald-300" />
              <span>Do'kon egasi sifatida kirish</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Live Platform Proof Badges */}
          <div className="pt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-emerald-200/90 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% rasmiy narxlar</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>24/7 uzluksiz buyurtma</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Real vaqtda ombor nazorati</span>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section: "Agent bilan" vs "Zanjir bilan" */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Nega an'anaviy agentlar eskirmoqda?
          </h2>
          <p className="text-sm text-slate-500">
            Eski usul va Zanjir platformasi o'rtasidagi asosiy farqlar
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Old Method (With Sales Agent) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-rose-200/80 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -z-0"></div>
            <div className="relative z-10 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                <X className="w-3.5 h-3.5 text-rose-600" />
                Eski usul (Savdo agenti bilan)
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    ✕
                  </div>
                  <span>
                    <strong>Agent kutish majburiyati:</strong> Haftada faqat 1-2 marta keladi, qolgan kunlari mahsulot tugab do'kon bo'sh qoladi.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    ✕
                  </div>
                  <span>
                    <strong>Ortiqcha ustama foizlar:</strong> Agent maoshi va xarajatlari sabab narxlar 7-15% qimmatroq bo'ladi.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    ✕
                  </div>
                  <span>
                    <strong>Daftardagi xatoliklar:</strong> Telegramda yoki daftarda qoldirilgan buyurtmalar yo'qoladi, adashadi yoki kechikadi.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                    ✕
                  </div>
                  <span>
                    <strong>Noma'lum ombor qoldig'i:</strong> Buyurtma berilgandan keyingina mahsulot omborda tugagani ma'lum bo'ladi.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* New Method (Zanjir Platform) */}
          <div className="bg-emerald-950 p-6 sm:p-8 rounded-3xl border border-emerald-800 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-900/40 rounded-bl-full -z-0"></div>
            <div className="relative z-10 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Zanjir B2B Platformasi bilan
              </div>

              <ul className="space-y-4 text-xs sm:text-sm text-emerald-100/90">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <span>
                    <strong>Istalgan vaqtda buyurtma:</strong> Ertalab, kechqurun yoki dam olish kunlari telefon orqali 1 daqiqada berish.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <span>
                    <strong>Zavodning haqiqiy narxi:</strong> O'rtakashsiz to'g'ridan-to'g'ri ishlab chiqaruvchi narxida xarid.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <span>
                    <strong>Aniq hisob-kitob va tarix:</strong> Har bir buyurtma, qabul qilingan narxlar va yetkazish sanasi raqamlashtirilgan.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-emerald-950 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <span>
                    <strong>Real vaqtdagi qoldiq nazorati:</strong> Do'kon faqat omborda aniq mavjud bo'lgan mahsulotni buyurtma qiladi.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Simple Process */}
      <section className="bg-slate-100/70 py-20 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              3 oddiy qadamda to'g'ridan-to'g'ri savdo
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Hech qanday murakkab texnik bilimsiz, qulay smartfon interfeysi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg mx-auto">
                1
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">Katalogdan tanlang</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zavod mahsulotlari, ulgurji narxlar va minimal buyurtma miqdorlarini ko'rib chiqing.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg mx-auto">
                2
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">Buyurtma yuboring</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Savatchaga yig'ing va bir tugma orqali yetkazib berish manzilini tasdiqlang.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg mx-auto">
                3
              </div>
              <h4 className="font-extrabold text-sm text-slate-900">Yetkazib berishni kuzating</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kompaniya tasdiqlaydi, omborda yig'adi va to'g'ridan-to'g'ri do'koningizga eltib beradi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Boshlash */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white shadow-xl text-center space-y-4">
          <h3 className="text-xl sm:text-2xl font-black">Zanjir bilan ishlashni boshlang</h3>
          <p className="text-xs text-emerald-100/80 max-w-md mx-auto">
            Ro'yxatdan o'ting: ishlab chiqaruvchi sifatida mahsulotlaringizni joylang yoki do'kon sifatida
            to'g'ridan-to'g'ri buyurtma bering.
          </p>
          <button
            onClick={() => onOpenAuth('register')}
            className="px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-sm transition-all"
          >
            Ro'yxatdan o'tish
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-950 text-emerald-200/80 py-12 px-4 sm:px-6 lg:px-8 border-t border-emerald-900 text-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-sm">
                Z
              </div>
              <span className="font-extrabold text-white text-base">ZANJIR</span>
            </div>
            <p className="text-[11px] text-emerald-300">Agentsiz. To'g'ridan-to'g'ri savdo.</p>
          </div>

          <div className="text-center sm:text-right space-y-1">
            <p className="text-white font-semibold">Toshkent, O'zbekiston</p>
            {(CONTACT_PHONE || CONTACT_EMAIL) && (
              <p>Aloqa: {[CONTACT_PHONE, CONTACT_EMAIL].filter(Boolean).join(' | ')}</p>
            )}
            <p className="text-[10px] text-emerald-400">© 2026 Zanjir B2B Savdo Platformasi. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
