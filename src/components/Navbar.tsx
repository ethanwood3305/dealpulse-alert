
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tight">PriceWatch</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors">
                Features <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 rounded-md glass opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 p-2">
                <div className="py-1">
                  <Link to="/#price-alerts" className="block px-4 py-2 text-sm hover:bg-primary/10 rounded-md">
                    Price Alerts
                  </Link>
                  <Link to="/#competitor-analysis" className="block px-4 py-2 text-sm hover:bg-primary/10 rounded-md">
                    Competitor Analysis
                  </Link>
                  <Link to="/#reports" className="block px-4 py-2 text-sm hover:bg-primary/10 rounded-md">
                    Reporting
                  </Link>
                </div>
              </div>
            </div>
            <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="rounded-full">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="rounded-full">
                Try for free
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass animate-fade-in">
          <div className="px-4 py-6 space-y-4">
            <Link
              to="/"
              className="block text-lg font-medium hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <div className="space-y-2 pl-4 border-l border-border">
              <Link
                to="/#price-alerts"
                className="block text-lg font-medium hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Price Alerts
              </Link>
              <Link
                to="/#competitor-analysis"
                className="block text-lg font-medium hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Competitor Analysis
              </Link>
              <Link
                to="/#reports"
                className="block text-lg font-medium hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Reporting
              </Link>
            </div>
            <Link
              to="/pricing"
              className="block text-lg font-medium hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              to="/about"
              className="block text-lg font-medium hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              to="/contact"
              className="block text-lg font-medium hover:text-primary"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="pt-4 border-t border-border">
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-center rounded-full">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full justify-center rounded-full">
                    Try for free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
