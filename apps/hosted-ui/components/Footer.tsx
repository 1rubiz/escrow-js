const GithubIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401h-4.753c-.834 0-1.18 1.102-.565 1.684L5.04 10.56l-1.89 4.402c-.341.922.755 1.688 1.54 1.064l3.862-2.884 3.862 2.884c.784.624 1.88-.142 1.539-1.064l-1.89-4.402 3.062-2.556c.615-.582.27-1.684-.563-1.684h-4.753l-1.83-4.401z" clipRule="evenodd" />
  </svg>
);

const PackageIcon2 = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BookIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17.25c0 5.105 3.07 9.772 7.5 11.876m0-13c5.5 0 10 4.745 10 11.25 0 5.105-3.07 9.772-7.5 11.876m0 0A21.75 21.75 0 0023.75 17.25c0-5.105-3.07-9.772-7.5-11.876" />
  </svg>
);

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Project Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">ruby-escrow-js</h3>
            <p className="text-gray-400 text-sm">
              A modern TypeScript SDK for secure escrow transactions powered by Payluk
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/yourusername/ruby-escrow-js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2"
                >
                  <GithubIcon /> GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://www.npmjs.com/package/ruby-escrow-js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2"
                >
                  <PackageIcon2 /> npm Package
                </a>
              </li>
              <li>
                <a
                  href="/docs"
                  className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2"
                >
                  <BookIcon /> Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4">Quick Start</h4>
            <ul className="space-y-2">
              <li>
                <a href="#installation" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Installation
                </a>
              </li>
              <li>
                <a href="#examples" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Code Examples
                </a>
              </li>
              <li>
                <a href="#features" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Features
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 ruby-escrow-js. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a
                href="#"
                className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
              >
                Terms
              </a>
              <a
                href="#"
                className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
              >
                License
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
