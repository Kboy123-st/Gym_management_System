import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';

export const LoginView: React.FC = () => {
  const { login, showToast } = useGym();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Please enter both username and password', 'error');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      login(username.trim(), password);
      setIsLoading(false);
    }, 150);
  };

  const handleQuickLogin = (uname: string, pass: string) => {
    setUsername(uname);
    setPassword(pass);
    setIsLoading(true);
    setTimeout(() => {
      login(uname, pass);
      setIsLoading(false);
    }, 150);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#FAFBFA] text-[#122420]">
      {/* Left Panel - Dark Spruce Brand Hero */}
      <div className="md:w-1/2 min-h-[420px] md:min-h-screen bg-[#0E2B27] p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden select-none">
        {/* Decorative Circles matching screenshot */}
        <div
          className="absolute -top-20 -right-20 w-[440px] h-[440px] rounded-full bg-[#183E36] pointer-events-none opacity-80"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -right-16 w-[400px] h-[400px] rounded-full border border-[#214D44] pointer-events-none opacity-70"
          aria-hidden="true"
        />

        {/* Brand Logo & Name (Top-Left) */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#CFFF3D] text-[#0E2B27] font-black text-sm flex items-center justify-center tracking-wider font-display shrink-0">
            IL
          </div>
          <span className="text-white font-display font-bold text-xl tracking-wider uppercase">
            IRON &amp; LIME
          </span>
        </div>

        {/* Hero Slogan & Subtitle (Center) */}
        <div className="relative z-10 my-auto py-12 md:py-0 max-w-lg">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.08]">
            Run the floor.<br />
            Not the spreadsheets.
          </h1>
          <p className="text-[#8FA39D] text-sm sm:text-base mt-5 leading-relaxed">
            Members, memberships, trainers, classes, payments and equipment — one system for the whole gym.
          </p>
        </div>

        {/* Footer (Bottom-Left) */}
        <div className="relative z-10 text-xs text-[#527068]">
          &copy; 2026 Iron &amp; Lime Fitness. Internal staff system.
        </div>
      </div>

      {/* Right Panel - Clean Minimalist Sign In Form */}
      <div className="md:w-1/2 min-h-screen flex items-center justify-center p-6 sm:p-12 lg:p-20 bg-[#FAFBFA]">
        <div className="w-full max-w-[390px]">
          {/* Header */}
          <div className="mb-7">
            <h2 className="font-display text-3xl font-bold text-[#122420] tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-sm text-[#6B7C77] mt-1.5">
              Enter your staff credentials to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-semibold text-[#122420] mb-1.5"
              >
                Username
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full px-3.5 py-2.5 bg-white border border-[#DCE3DF] rounded-lg text-sm text-[#122420] placeholder-[#9EAFA9] focus:outline-none focus:border-[#122420] transition-colors"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-[#122420] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DCE3DF] rounded-lg text-sm text-[#122420] placeholder-[#9EAFA9] pr-14 focus:outline-none focus:border-[#122420] transition-colors"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#6B7C77] hover:text-[#122420] transition-colors select-none"
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#CFFF3D] hover:bg-[#BEEF2D] text-[#0E2B27] font-semibold text-sm rounded-lg transition-colors mt-5 cursor-pointer disabled:opacity-75 shadow-xs flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#0E2B27] border-t-transparent rounded-full animate-spin" />
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="mt-8 pt-2">
            <p className="text-xs text-[#6B7C77] mb-2.5 font-medium">
              Demo accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="py-1.5 px-3 bg-white border border-[#DCE3DF] hover:bg-[#EEF2EF] hover:border-[#B8C4BF] text-xs font-medium text-[#122420] rounded-lg text-center transition-colors cursor-pointer shadow-2xs"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('reception', 'front123')}
                className="py-1.5 px-3 bg-white border border-[#DCE3DF] hover:bg-[#EEF2EF] hover:border-[#B8C4BF] text-xs font-medium text-[#122420] rounded-lg text-center transition-colors cursor-pointer shadow-2xs"
              >
                Receptionist
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('trainer', 'train123')}
                className="py-1.5 px-3 bg-white border border-[#DCE3DF] hover:bg-[#EEF2EF] hover:border-[#B8C4BF] text-xs font-medium text-[#122420] rounded-lg text-center transition-colors cursor-pointer shadow-2xs"
              >
                Trainer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
