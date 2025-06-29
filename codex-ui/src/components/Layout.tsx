import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home as HomeIcon, 
  List as ListIcon,
  GitHub as GitHubIcon,
  AutoAwesome as AutoAwesomeIcon 
} from '@mui/icons-material';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/jobs', label: 'Jobs', icon: ListIcon },
  ];

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <AutoAwesomeIcon className="text-accent-primary text-3xl" />
              </motion.div>
              <span className="text-xl font-bold text-neon-blue">
                Codex AI
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-accent-primary/20 text-accent-primary' 
                        : 'text-gray-400 hover:text-gray-100 hover:bg-dark-hover'
                      }
                    `}
                  >
                    <Icon className="text-xl" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* GitHub Link */}
              <a
                href="https://github.com/anthropics/codex"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg
                         text-gray-400 hover:text-gray-100 hover:bg-dark-hover
                         transition-all duration-200 ml-4"
              >
                <GitHubIcon className="text-xl" />
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="glass mt-20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2024 Codex AI. Built with React & TypeScript.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">
                Powered by advanced language models
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;