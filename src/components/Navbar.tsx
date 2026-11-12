import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';
import { ThemeToggle } from './ThemeToggle';
import { Saturn02Icon } from './Saturn02Icon';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Manifiesto', href: '#manifiesto' },
    { label: 'Capítulos', href: '#capitulos' },
    { label: 'Pilares', href: '#pilares' },
    { label: 'Frases', href: '#frases' },
    { label: 'Galería', href: '#galeria' },
    { label: 'Cine', href: '#cine' },
    { label: 'Avatares', href: '#avatares' },
  ];

  return (
    <header className="fixed top-4 inset-x-0 z-50 mx-auto max-w-4xl px-4 pointer-events-none">
      <nav
        className={`pointer-events-auto flex items-center justify-between rounded-full transition-all duration-300 py-2.5 px-4 md:px-5 ${
          scrolled
            ? 'liquid-pill bg-white/95 dark:bg-[#0b1526]/90 shadow-md shadow-sky-950/5 dark:shadow-black/40 border-sky-200/80 dark:border-white/10'
            : 'liquid-pill bg-white/85 dark:bg-[#0b1526]/75 border-sky-100/70 dark:border-white/10'
        }`}
      >
        {/* Brand Logo */}
        <a
          href="#inicio"
          className="flex items-center gap-1.5 group"
          aria-label="Inicio — recuerdos"
        >
          <Saturn02Icon
            size={20}
            className="text-[#0284c7] dark:text-[#38bdf8] transition-transform duration-300 group-hover:rotate-12"
          />
          <span className="font-hand normal-case text-base text-slate-900 dark:text-white group-hover:text-[#0284c7] dark:group-hover:text-[#38bdf8] transition-colors font-normal">
            Recuerdos
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#0284c7] dark:hover:text-[#38bdf8] transition-colors font-medium tracking-wide"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions (Sound toggle & Theme toggle) */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <AudioPlayer />

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-full text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white/80 dark:bg-white/10 border border-sky-200 dark:border-white/10 cursor-pointer"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto md:hidden mt-2 p-4 liquid-glass bg-white/95 dark:bg-[#0b1526]/95 rounded-2xl border border-sky-200 dark:border-white/10 flex flex-col gap-2.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-[#0284c7] dark:hover:text-[#38bdf8] py-1.5 px-3 rounded-lg hover:bg-sky-50 dark:hover:bg-white/5 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
};
