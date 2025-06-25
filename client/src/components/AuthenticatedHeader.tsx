import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import canadianMapleLeaf from "@/assets/canadian-maple-leaf-red.png";
import { Menu, X, ChevronDown } from "lucide-react";

const AuthenticatedHeader = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="bg-[#F9F9F9] px-3 sm:px-4 lg:px-20 py-3 sm:py-4 relative">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Logo Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <img
              src={canadianMapleLeaf}
              alt="Canadian maple leaf"
              className="w-8 h-8 sm:w-[38px] sm:h-[38px]"
            />
            <h1 className="text-2xl sm:text-[36px] font-bold text-black font-inter">
              MARCAN
            </h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          <Link to="/listings">
            <span
              className={`text-base lg:text-[20px] font-semibold font-inter cursor-pointer hover:opacity-80 transition-opacity ${isActive("/listings") ? "text-[#DB1233]" : "text-black"
                }`}
            >
              Listings
            </span>
          </Link>
          <Link to="/dashboard">
            <span
              className={`text-base lg:text-[20px] font-semibold font-inter cursor-pointer hover:opacity-80 transition-opacity ${isActive("/dashboard") ? "text-[#DB1233]" : "text-black"
                }`}
            >
              Dashboard
            </span>
          </Link>
          <Link to="/my-account">
            <Button
              className={`bg-[#DB1233] hover:bg-[#c10e2b] text-white text-base lg:text-[20px] font-semibold rounded-lg px-4 lg:px-[20px] py-2 lg:py-2.5 h-auto font-inter ${isActive("/my-account") ? "bg-[#c10e2b]" : ""
                }`}
            >
              My Account
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </Button>

          {/* Enhanced Mobile Dropdown Menu */}
          <div
            className={`absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out transform origin-top-right ${isMobileMenuOpen
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
              }`}
          >
            {/* Dropdown Header */}
            {/*<div className="bg-gradient-to-r from-[#DB1233] to-[#c10e2b] px-4 py-3">
              <div className="flex items-center gap-2">
                <img
                  src={canadianMapleLeaf}
                  alt="Canadian maple leaf"
                  className="w-6 h-6"
                />
                <span className="text-white font-semibold text-sm">Navigation</span>
              </div>
            </div>*/}

            {/* Navigation Links */}
            <div className="py-2">
              <Link
                to="/listings"
                className={`flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors ${isActive("/listings")
                  ? "bg-red-50 text-[#DB1233] border-r-2 border-[#DB1233]"
                  : ""
                  }`}
              >
                <span className="font-medium">Listings</span>
                <ChevronDown className="h-4 w-4 transform rotate-[-90deg] opacity-60" />
              </Link>

              <Link
                to="/dashboard"
                className={`flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors ${isActive("/dashboard")
                  ? "bg-red-50 text-[#DB1233] border-r-2 border-[#DB1233]"
                  : ""
                  }`}
              >
                <span className="font-medium">Dashboard</span>
                <ChevronDown className="h-4 w-4 transform rotate-[-90deg] opacity-60" />
              </Link>

              <Link
                to="/my-account"
                className={`flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors ${isActive("/my-account")
                  ? "bg-red-50 text-[#DB1233] border-r-2 border-[#DB1233]"
                  : ""
                  }`}
              >
                <span className="font-medium">My Account</span>
                <ChevronDown className="h-4 w-4 transform rotate-[-90deg] opacity-60" />
              </Link>
            </div>

            {/* Dropdown Footer */}
            <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
              <div className="text-xs text-gray-500 text-center">
                Welcome to Marcan
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AuthenticatedHeader;
