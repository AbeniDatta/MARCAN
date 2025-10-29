import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import canadianMapleLeaf from "@/assets/canadian-maple-leaf-red.png";
import { Menu, X, ChevronDown } from "lucide-react";
import { auth } from "@/firebase";
import { UserProfile } from "@/services/api";

const AuthenticatedHeader = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDesktopDropdown = () => {
    setIsDesktopDropdownOpen(!isDesktopDropdownOpen);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target as Node)) {
        setIsDesktopDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult(true); // true = force refresh
          const isAdmin = tokenResult.claims.admin === true;
          setIsAdmin(isAdmin);
          console.log("Admin status:", isAdmin);
        } catch (err) {
          console.error("Failed to fetch custom claims", err);
        }
      }
    };
    checkAdmin();
  }, []);

  // Close dropdowns when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDesktopDropdownOpen(false);
  }, [location.pathname]);

  // Get the current active menu item text
  const getActiveMenuText = () => {
    if (isActive("/")) return "Home";
    if (isActive("/listings")) return "All Listings";
    if (isActive("/saved-listings")) return "Saved Listings";
    if (isActive("/admin")) return "Admin";
    if (isActive("/company-directory")) return "Company Directory";
    return "Navigate";
  };



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

          {/* Desktop Dropdown Menu */}
          <div className="relative" ref={desktopDropdownRef}>
            <Button
              variant="ghost"
              onClick={toggleDesktopDropdown}
              className="flex items-center gap-2 text-base lg:text-[20px] font-semibold font-inter hover:opacity-80 transition-opacity text-black p-2"
            >
              <span className={isActive("/") || isActive("/listings") || isActive("/saved-listings") || isActive("/admin") || isActive("/company-directory") ? "text-[#DB1233]" : ""}>
                {getActiveMenuText()}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isDesktopDropdownOpen ? 'rotate-180' : ''}`} />
            </Button>

            {/* Desktop Dropdown Content */}
            <div
              className={`absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out transform origin-top-left z-50 ${isDesktopDropdownOpen
                ? 'opacity-100 scale-100 translate-y-0'
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}
            >
              <div className="py-2">
                <Link
                  to="/"
                  className={`flex items-center px-4 py-3 transition-colors ${isActive("/")
                    ? "text-[#DB1233] bg-red-50"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                  onClick={() => setIsDesktopDropdownOpen(false)}
                >
                  <span className="font-medium">Home</span>
                </Link>
                <Link
                  to="/listings"
                  className={`flex items-center px-4 py-3 transition-colors ${isActive("/listings")
                    ? "text-[#DB1233] bg-red-50"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                  onClick={() => setIsDesktopDropdownOpen(false)}
                >
                  <span className="font-medium">All Listings</span>
                </Link>
                <Link
                  to="/saved-listings"
                  className={`flex items-center px-4 py-3 transition-colors ${isActive("/saved-listings")
                    ? "text-[#DB1233] bg-red-50"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                  onClick={() => setIsDesktopDropdownOpen(false)}
                >
                  <span className="font-medium">Saved Listings</span>
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`flex items-center px-4 py-3 transition-colors ${isActive("/admin")
                      ? "text-[#DB1233] bg-red-50"
                      : "text-gray-700 hover:bg-gray-50"
                      }`}
                    onClick={() => setIsDesktopDropdownOpen(false)}
                  >
                    <span className="font-medium">Admin</span>
                  </Link>
                )}
                <Link
                  to="/company-directory"
                  className={`flex items-center px-4 py-3 transition-colors ${isActive("/company-directory")
                    ? "text-[#DB1233] bg-red-50"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                  onClick={() => setIsDesktopDropdownOpen(false)}
                >
                  <span className="font-medium">Company Directory</span>
                </Link>
              </div>
            </div>
          </div>

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
        <div className="md:hidden relative" ref={mobileDropdownRef}>
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


            {/* Navigation Links */}
            <div className="py-2">
              <Link
                to="/"
                className={`flex items-center justify-between px-4 py-3 transition-colors ${isActive("/")
                  ? "text-[#DB1233] bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <span className="font-medium">Home</span>
                <ChevronDown className="h-4 w-4 transform rotate-[-90deg] opacity-60" />
              </Link>
              <Link
                to="/listings"
                className={`flex items-center justify-between px-4 py-3 transition-colors ${isActive("/listings")
                  ? "text-[#DB1233] bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <span className="font-medium">All Listings</span>
                <ChevronDown className="h-4 w-4 transform rotate-[-90deg] opacity-60" />
              </Link>
              <Link
                to="/saved-listings"
                className={`flex items-center justify-between px-4 py-3 transition-colors ${isActive("/saved-listings")
                  ? "text-[#DB1233] bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <span className="font-medium">Saved Listings</span>
                <ChevronDown className="h-4 w-4 transform rotate-[-90deg] opacity-60" />
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center justify-between px-4 py-3 transition-colors ${isActive("/admin")
                    ? "text-[#DB1233] bg-red-50"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <span className="font-medium">Admin</span>
                  <ChevronDown className="h-4 w-4 transform rotate-[-90deg] opacity-60" />
                </Link>
              )}
              <Link
                to="/company-directory"
                className={`flex items-center justify-between px-4 py-3 transition-colors ${isActive("/company-directory")
                  ? "text-[#DB1233] bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <span className="font-medium">Company Directory</span>
                <ChevronDown className="h-4 w-4 transform rotate-[-90deg] opacity-60" />
              </Link>
              <Link
                to="/my-account"
                className={`flex items-center justify-between px-4 py-3 transition-colors ${isActive("/my-account")
                  ? "text-[#DB1233] bg-red-50"
                  : "text-gray-700 hover:bg-gray-50"
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
