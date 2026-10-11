import React, { useState } from 'react';
import {
  X,
  Building2,
  Store as StoreIcon,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  onSuccessRole?: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  onSuccessRole
}) => {
  const { login, register, resetPassword } = useAuth();

  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(initialTab);
  const [role, setRole] = useState<UserRole>('store');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('+998 ');
  const [address, setAddress] = useState('');
  const [category] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Elektron pochta va parolni kiriting');
      return;
    }

    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Kirishda xatolik yuz berdi');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    setIsSubmitting(true);
    const res = await register({
      businessName,
      personName,
      phone,
      email,
      password,
      address,
      role,
      category: role === 'company' ? category : undefined
    });
    setIsSubmitting(false);

    if (res.success) {
      if (onSuccessRole) onSuccessRole(role);
      onClose();
    } else {
      setErrorMsg(res.error || 'Ro\'yxatdan o\'tishda xatolik yuz berdi');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Elektron pochtangizni kiriting');
      return;
    }

    setIsSubmitting(true);
    const res = await resetPassword(email);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Tiklash xabari pochtangizga yuborildi');
    } else {
      setErrorMsg(res.error || 'Xatolik yuz berdi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-scale text-slate-800">
        {/* Header */}
        <div className="bg-emerald-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-emerald-900/80 hover:bg-emerald-800 flex items-center justify-center text-emerald-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center font-black text-2xl mb-3 shadow-lg shadow-emerald-500/20">
            Z
          </div>
          <h3 className="text-xl font-extrabold tracking-tight">Zanjir Platformasi</h3>
          <p className="text-xs text-emerald-300/90 mt-0.5">Agentsiz. To'g'ridan-to'g'ri savdo.</p>

          {/* Tab buttons */}
          <div className="flex bg-emerald-900/70 p-1 rounded-xl mt-4 text-xs font-semibold">
            <button
              onClick={() => {
                setTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                tab === 'login' ? 'bg-white text-emerald-950 shadow' : 'text-emerald-200 hover:text-white'
              }`}
            >
              Kirish
            </button>
            <button
              onClick={() => {
                setTab('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                tab === 'register' ? 'bg-white text-emerald-950 shadow' : 'text-emerald-200 hover:text-white'
              }`}
            >
              Ro'yxatdan o'tish
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* --- LOGIN TAB --- */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Elektron pochta</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="masalan: sardor.registon@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Parol</label>
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    className="text-[11px] text-emerald-700 hover:underline font-semibold"
                  >
                    Parolni unutdingizmi?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-800 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'Tekshirilmoqda...' : 'Tizimga kirish'}
                <ArrowRight className="w-4 h-4" />
              </button>

            </form>
          )}

          {/* --- REGISTER TAB --- */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Role selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Foydalanuvchi roli</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('store')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === 'store'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                      <StoreIcon className="w-4 h-4 text-emerald-700" />
                      <span>Do'kon egasi</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Chakana savdo uchun to'g'ridan-to'g'ri buyurtma</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('company')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === 'company'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs mb-0.5">
                      <Building2 className="w-4 h-4 text-emerald-700" />
                      <span>Kompaniya</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Ishlab chiqaruvchi yoki yirik distribyutor</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {role === 'company' ? 'Korxona yoki zavod nomi' : 'Do\'kon yoki savdo nuqtasi nomi'}
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={role === 'company' ? 'Masalan: Samarqand Bottlers MCHJ' : 'Masalan: Yangi Hayot Mini-Market'}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mas'ul shaxs</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      placeholder="Ism va familiya"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefon</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Elektron pochta</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="namuna@biznes.uz"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Parol (kamida 8 ta belgi)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Manzil</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Shahar, tuman, ko'cha, mo'ljal"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-emerald-800 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'Yaratilmoqda...' : 'Ro\'yxatdan o\'tish va boshlash'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* --- FORGOT PASSWORD TAB --- */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Ro'yxatdan o'tgan elektron pochta manzilingizni kiriting. Biz sizga parolni yangilash havolasini yuboramiz.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Elektron pochta</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pochta@manzil.uz"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-800 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'Yuborilmoqda...' : 'Tiklash havolasini yuborish'}
              </button>

              <button
                type="button"
                onClick={() => setTab('login')}
                className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Kirish sahifasiga qaytish
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
