'use client';

import Link from 'next/link';
import { useState } from 'react';

const PackageIcon = () => (
  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 005.646 5.646 9.003 9.003 0 0012 2c4.97 0 9.185 3.364 9.88 7.848.11.647.684 1.12 1.39 1.12.728 0 1.31-.593 1.243-1.313-.935-5.974-6.369-10.469-12.513-10.469C6.314 2 2 6.314 2 12s4.314 10 10 10c.898 0 1.755-.98 1.832-1.878.077-.899-.8-1.622-1.678-1.622-.71 0-1.327.55-1.324 1.26.003.437.03.876.089 1.314-5.701-.806-10.088-5.654-10.088-11.56 0-6.368 5.163-11.53 11.53-11.53 6.368 0 11.531 5.163 11.531 11.531 0 1.326-.277 2.589-.804 3.74m-7.9 4.87a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const HamburgerIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <PackageIcon />
            <span className="text-white font-bold text-lg hidden sm:inline">ruby-escrow-js</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">
              Features
            </a>
            <a href="#examples" className="text-gray-400 hover:text-white transition-colors text-sm">
              Examples
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/ruby-escrow-js"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
            >
              View on npm
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden text-gray-400 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-800 py-4 space-y-3">
            <a
              href="#features"
              onClick={closeMenu}
              className="block px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
            >
              Features
            </a>
            <a
              href="#examples"
              onClick={closeMenu}
              className="block px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
            >
              Examples
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/ruby-escrow-js"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors"
            >
              View on npm
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
