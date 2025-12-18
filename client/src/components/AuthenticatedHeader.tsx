import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import canadianMapleLeaf from "@/assets/canadian-maple-leaf-red.png";
import { Menu, X, ChevronDown } from "lucide-react";
import { auth } from "@/firebase";
import { profileApi } from "@/services/api";

const AuthenticatedHeader = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [displayName, setDisplayName] = useState("");
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
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (!user) {
      setIsAdmin(false);
      setDisplayName("");
      return;
    }

    // 1) Admin claim
    try {
      const tokenResult = await user.getIdTokenResult(true);
      const adminClaim = tokenResult.claims.admin === true;
      setIsAdmin(adminClaim);
      console.log("Admin status:", adminClaim);
    } catch (err) {
      console.error("Failed to fetch custom claims", err);
      setIsAdmin(false);
    }

    // 2) Display name (profile -> firebase -> email)
    try {
      const profile = await profileApi.getUserProfile(user.uid);

      const name =
        profile.companyName ||
        profile.name ||
        user.displayName ||
        user.email ||
        "User";

      setDisplayName(name);
    } catch (err) {
      console.error("Failed to fetch profile for display name", err);
      setDisplayName(user.displayName || user.email || "User");
    }
  });

  return () => unsubscribe();
}, []);

  // Close dropdowns when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDesktopDropdownOpen(false);
  }, [location.pathname]);

  // Get the current active menu item text
  const getActiveMenuText = () => {
    if (isActive("/admin")) return "Admin";
    if (isActive("/")) return "Home";
    if (isActive("/listings")) return "All Listings";
    if (isActive("/saved-listings")) return "Saved Listings";
    if (isActive("/company-directory")) return "Company Directory";
    if (isActive("/about")) return "About";
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
            <div className="flex flex-col leading-tight">
              <span className="text-2xl sm:text-[36px] font-bold text-black font-inter">
                MARCAN
              </span>
              <span className="text-xs sm:text-sm text-gray-600 font-inter max-w-[280px] sm:max-w-none">
                Manufacturing and Resources Canada – An online marketplace for Canadian manufacturing
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4 lg:gap-8">
          <div className="hidden lg:flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1">
            <span className="text-sm text-gray-600 font-inter">
              Hi, <span className="font-semibold text-black">{displayName || "User"}</span>
            </span>

            {isAdmin ? (
              <span className="text-xs font-semibold text-[#DB1233] bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                Admin
              </span>
            ) : null}
          </div>
          {/* Desktop Dropdown Menu */}
          <div className="relative" ref={desktopDropdownRef}>
            <Button
              variant="ghost"
              onClick={toggleDesktopDropdown}
              className="flex items-center gap-2 whitespace-nowrap text-base lg:text-[20px] font-semibold font-inter hover:opacity-80 transition-opacity text-black p-2"
            >
              <span className={isActive("/admin") || isActive("/") || isActive("/about") || isActive("/listings") || isActive("/saved-listings") || isActive("/company-directory") ? "text-[#DB1233]" : ""}>
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
                  to="/about"
                  className={`flex items-center px-4 py-3 transition-colors ${
                    isActive("/about")
                      ? "text-[#DB1233] bg-red-50"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsDesktopDropdownOpen(false)}
                >
                  <span className="font-medium">About</span>
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

          <div className="px-4 py-3 bg-white border-b border-gray-100">
          <div className="text-xs text-gray-500 font-inter">
            Signed in as
          </div>
          <div className="text-sm font-semibold text-black font-inter">
            {displayName || "User"}{isAdmin ? " (Admin)" : ""}
          </div>
        </div><div className="px-4 py-3 bg-white border-b border-gray-100">
          <div className="text-xs text-gray-500 font-inter">
            Signed in as
          </div>
          <div className="text-sm font-semibold text-black font-inter">
            {displayName || "User"}{isAdmin ? " (Admin)" : ""}
          </div>
        </div>


            {/* Navigation Links */}
            <div className="py-2">
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
                to="/about"
                className={`flex items-center justify-between px-4 py-3 transition-colors ${
                  isActive("/about")
                    ? "text-[#DB1233] bg-red-50"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="font-medium">About</span>
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
