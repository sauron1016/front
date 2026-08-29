import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Icon, BOUMA_URL } from '../../ui';
import Dither from './Dither';

interface LoginProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const goNext = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/app');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(phone, password);
      goNext();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pine-soft to-blue-50 px-4">
      <div className="relative max-w-md w-full bg-white rounded-2xl shadow-xl border-2 border-line overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-6 h-72">
          <div className="h-full w-full bg-paper [mask-image:linear-gradient(225deg,black_0%,black_35%,transparent_95%)] [-webkit-mask-image:linear-gradient(225deg,black_0%,black_35%,transparent_95%)]">
            <Dither
              waveColor={[0.36, 0.95, 0.83]}
              backgroundColor={[0.985, 0.99, 0.99]}
              colorNum={4}
              pixelSize={2.5}
              waveAmplitude={0.45}
              waveFrequency={3.5}
              waveSpeed={0.12}
              disableAnimation={false}
              enableMouseInteraction={false}
            />
          </div>
        </div>
        <div className="relative z-10 p-8">
          <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <span className="absolute -inset-1 rounded-full border-2 border-dashed border-pine/40" />
              <img src={BOUMA_URL} alt="بوّمة" className="rounded-full border-2 border-line object-cover" style={{ width: 64, height: 64 }} />
            </div>
          </div>
          <h1 className="text-3xl font-bold font-display text-ink mb-2">تسجيل الدخول</h1>
          <p className="text-sub font-medium">مرحباً بعودتك! يرجى إدخال بياناتك</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-tun/10 border-2 border-tun text-tun-dark rounded-xl">
            <div className="flex items-center gap-2">
              <Icon name="alert" size={18} />
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="phone" className="block text-sm font-bold font-display text-sub mb-2">
              رقم الهاتف
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white border-2 border-line rounded-xl shadow-inner focus:ring-2 focus:ring-pine/40 focus:border-pine-dark focus:shadow-none transition-all font-display font-semibold"
              placeholder="+216 XX XXX XXX"
              dir="ltr"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold font-display text-sub mb-2">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white border-2 border-line rounded-xl shadow-inner focus:ring-2 focus:ring-pine/40 focus:border-pine-dark focus:shadow-none transition-all font-display font-semibold"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-pine hover:brightness-95 disabled:bg-line disabled:text-faint text-ink font-bold font-display py-3 rounded-xl border-b-4 border-pine-dark transition-all active:translate-y-[3px] active:border-b-[1px]"
          >
            {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sub font-medium">
            ليس لديك حساب؟{' '}
            {onSwitchToRegister ? (
              <button
                onClick={onSwitchToRegister}
                className="text-pine-dark hover:text-pine-deep font-bold font-display"
              >
                إنشاء حساب جديد
              </button>
            ) : (
              <Link to="/register" className="text-pine-dark hover:text-pine-deep font-bold font-display">
                إنشاء حساب جديد
              </Link>
            )}
          </p>
          <p className="mt-3 text-sub font-medium">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sub hover:text-pine-deep font-bold">
              <Icon name="arrowBack" size={14} /> العودة إلى الرئيسية
            </Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};
