import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, User, ArrowRight, Globe } from 'lucide-react';

// Stylized 'X' representing Xisaabiye
const XLogo = ({ className = "w-10 h-10" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 4H15L9 20H6" />
    <path d="M6 4H9L15 20H18" />
  </svg>
);

export const Login = () => {
  const { login } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  // Inputs are completely empty upon loading
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!usernameOrEmail.trim() || !password) {
      setError(t('login.errorRequired'));
      return;
    }

    setLoading(true);
    try {
      await login(usernameOrEmail, password);
    } catch (err) {
      console.error(err);
      setError(t('login.errorInvalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Language Toggle */}
      <button
        onClick={toggleLanguage}
        title={language === 'en' ? 'Ku beddel Af-Soomaali' : 'Switch to English'}
        className="absolute top-4 right-4 z-20 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors flex items-center gap-1.5 text-xs font-extrabold"
      >
        <Globe className="w-4 h-4 text-emerald-400" />
        <span>{language === 'en' ? 'EN' : 'SO'}</span>
      </button>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-tr from-blue-700 to-cyan-500 text-white shadow-xl shadow-blue-950/80 mb-4">
          <XLogo className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">{t('login.title')}</h2>
        <p className="mt-2 text-sm text-slate-400 font-medium">
          {t('login.subtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-xs font-semibold text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                {t('login.usernameLabel')}
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="epraahmhudi@gmail.com"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-sm font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                {t('login.passwordLabel')}
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl glass-input text-sm font-semibold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-950/60 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? t('login.authenticating') : t('login.signIn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
