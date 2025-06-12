import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import canadianMapleLeaf from "@/assets/canadian-maple-leaf-red.png";

const AuthenticatedHeader = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-[#F9F9F9] px-4 lg:px-20 py-4">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <img
            src={canadianMapleLeaf}
            alt="Canadian maple leaf"
            className="w-[40px] h-[40px]"
          />
          <h1 className="text-[36px] font-bold text-black font-inter">
            MARCAN
          </h1>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-6">
          <Link to="/listings">
            <span
              className={`text-[20px] font-semibold font-inter cursor-pointer hover:opacity-80 transition-opacity ${isActive("/listings") ? "text-[#DB1233]" : "text-black"
                }`}
            >
              Listings
            </span>
          </Link>
          <Link to="/dashboard">
            <span
              className={`text-[20px] font-semibold font-inter cursor-pointer hover:opacity-80 transition-opacity ${isActive("/dashboard") ? "text-[#DB1233]" : "text-black"
                }`}
            >
              Dashboard
            </span>
          </Link>
          <Link to="/my-account">
            <Button
              className={`bg-[#DB1233] hover:bg-[#c10e2b] text-white text-[20px] font-semibold rounded-lg px-[20px] py-2.5 h-auto font-inter ${isActive("/my-account") ? "bg-[#c10e2b]" : ""
                }`}
            >
              My Account
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default AuthenticatedHeader;
