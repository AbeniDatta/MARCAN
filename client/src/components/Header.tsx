import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import canadianMapleLeaf from "@/assets/canadian-maple-leaf-red.png";

const Header = () => {
  return (
    <header className="bg-[#F9F9F9] px-4 lg:px-20 py-4">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <img
            src={canadianMapleLeaf}
            alt="Canadian maple leaf"
            className="w-[38px] h-[38px]"
          />
          <h1 className="text-[32px] font-bold text-black font-inter">
            MARCAN
          </h1>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button
              variant="ghost"
              className="text-[20px] font-semibold text-black hover:bg-gray-100 font-inter px-6 py-2.5 h-auto"
            >
              Log In
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-[#DB1233] hover:bg-[#c10e2b] text-white text-[20px] font-semibold rounded-lg px-[20px] py-2.5 h-auto font-inter">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
