import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePosStore } from '../store/posStore';
import { KeyRound, Mail, Lock, Store, ChevronRight, User, ChefHat, Coffee, Shield, ShoppingBag } from 'lucide-react';

const DUMMY_USERS = [
  { id: 1, name: 'Admin User', email: 'admin@appthat.com', password: 'password', role: 'admin' },
  { id: 2, name: 'John Waiter', email: 'waiter@appthat.com', password: 'password', role: 'waiter' },
  { id: 3, name: 'Chef Mario', email: 'kitchen@appthat.com', password: 'password', role: 'kitchen_manager' }
];

const ROLE_CONFIG = {
  admin: { icon: Shield, color: '#fb923c', label: 'Admin', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
  manager: { icon: Store, color: '#60a5fa', label: 'Manager', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.3)' },
  waiter: { icon: Coffee, color: '#a78bfa', label: 'Waiter', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)' },
  kitchen_manager: { icon: ChefHat, color: '#f43f5e', label: 'Kitchen', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.3)' },
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  const login = useAuthStore((state) => state.login);
  const { restaurantDetails } = usePosStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await login(email, password);
      redirectUser(user.role);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail, userPassword) => {
    setError('');
    setIsLoading(true);
    try {
      const user = await login(userEmail, userPassword);
      redirectUser(user.role);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const redirectUser = (role) => {
    if (from !== '/') { navigate(from, { replace: true }); return; }
    switch (role) {
      case 'admin': case 'manager': navigate('/admin', { replace: true }); break;
      case 'waiter': navigate('/waiter', { replace: true }); break;
      case 'kitchen_manager': navigate('/kds', { replace: true }); break;
      default: navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex font-sans relative overflow-hidden" style={{ background: '#f8fafc' }}>
      
      {/* ── LEFT PANEL: Branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden bg-white/70">
        
        {/* Background art */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(249,115,22,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(234,88,12,0.04) 0%, transparent 50%)'
        }} />
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full animate-blob" style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: 'linear-gradient(rgba(15,23,42,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        {/* Top logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              boxShadow: '0 0 20px rgba(249,115,22,0.3)'
            }}>
              {restaurantDetails?.logo_base64 ? (
                <img src={restaurantDetails.logo_base64} alt="Logo" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Store className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="text-surface-100 font-black text-lg">{restaurantDetails?.name || 'AppThat POS'}</span>
          </div>

          {/* Hero text */}
          <div>
            <h1 className="text-5xl xl:text-6xl font-black leading-tight mb-6" style={{
              background: 'linear-gradient(135deg, #090d16 30%, rgba(15,23,42,0.6))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Run your restaurant smarter.
            </h1>
            <p className="text-lg font-medium text-surface-400">
              Orders, billing & kitchen — all in one place.
            </p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="relative z-10 space-y-3">
          {[
            { icon: Coffee, label: 'Waiter Dashboard', desc: 'Take orders from tables instantly' },
            { icon: ChefHat, label: 'Kitchen Display', desc: 'Real-time KOT management' },
            { icon: ShoppingBag, label: 'Quick Billing', desc: 'Takeaway & delivery orders' },
          ].map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.label} className="flex items-center gap-4 p-4 rounded-2xl bg-white/80" style={{
                border: '1px solid rgba(0,0,0,0.06)'
              }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{
                  background: 'rgba(249,115,22,0.1)',
                  border: '1px solid rgba(249,115,22,0.2)'
                }}>
                  <Icon className="w-5 h-5" style={{ color: '#ea580c' }} />
                </div>
                <div>
                  <p className="font-bold text-sm text-surface-100">{feat.label}</p>
                  <p className="text-xs text-surface-400">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="relative z-10 text-xs font-bold tracking-widest uppercase text-surface-400">
          Made by Gaurav Yadav
        </p>
      </div>

      {/* ── RIGHT PANEL: Login Form ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 relative bg-surface-950">
        
        {/* Subtle right glow */}
        <div className="absolute top-0 right-0 w-[60%] h-[60%] rounded-full pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 80% 20%, rgba(249,115,22,0.04) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }} />

        <div className="w-full max-w-md animate-slide-up relative z-10">
          
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              boxShadow: '0 0 25px rgba(249,115,22,0.3)'
            }}>
              <Store className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-xl text-surface-100">{restaurantDetails?.name || 'AppThat POS'}</span>
          </div>

          <h2 className="text-3xl font-black text-surface-100 mb-2">Welcome back</h2>
          <p className="text-sm font-medium mb-8 text-surface-400">Sign in to your workspace</p>

          {/* Error */}
          {error && (
            <div className="mb-5 p-4 rounded-xl text-sm font-bold animate-fade-in flex items-center gap-2" style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#dc2626'
            }}>
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 mb-8">
            
            {/* Email */}
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wider text-surface-400">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                  style={{ color: focusedInput === 'email' ? '#ea580c' : 'rgba(15,23,42,0.35)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium"
                  placeholder="admin@appthat.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wider text-surface-400">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                  style={{ color: focusedInput === 'password' ? '#ea580c' : 'rgba(15,23,42,0.35)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-orange w-full py-4 rounded-xl text-base font-black flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  <span className="relative z-10">Sign In</span>
                  <KeyRound className="w-4 h-4 relative z-10" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-surface-700" />
            <span className="text-xs font-bold uppercase tracking-widest text-surface-400">or quick access</span>
            <div className="flex-1 h-px bg-surface-700" />
          </div>

          {/* Quick login cards */}
          <div className="grid grid-cols-1 gap-3">
            {DUMMY_USERS.map((u) => {
              const config = ROLE_CONFIG[u.role] || ROLE_CONFIG.admin;
              const Icon = config.icon;
              return (
                <button
                  key={u.id}
                  onClick={() => handleQuickLogin(u.email, u.password)}
                  disabled={isLoading}
                  className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 group hover-lift disabled:opacity-50"
                  style={{
                    background: 'rgba(255,255,255,0.85)',
                    border: `1px solid rgba(0,0,0,0.06)`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = config.bg;
                    e.currentTarget.style.border = `1px solid ${config.border}`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.85)';
                    e.currentTarget.style.border = '1px solid rgba(0,0,0,0.06)';
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all" style={{
                    background: config.bg,
                    border: `1px solid ${config.border}`
                  }}>
                    <Icon className="w-5 h-5" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-sm text-surface-100">{u.name}</p>
                    <p className="text-xs font-bold uppercase tracking-wider mt-0.5" style={{ color: config.color }}>{config.label}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-surface-400" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden absolute bottom-4 text-xs font-bold tracking-widest uppercase text-surface-400">
          Made by Gaurav Yadav
        </div>
      </div>

      {/* Vertical divider */}
      <div className="hidden lg:block absolute top-0 left-[45%] w-px h-full" style={{
        background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.05) 20%, rgba(0,0,0,0.05) 80%, transparent)'
      }} />
    </div>
  );
}
