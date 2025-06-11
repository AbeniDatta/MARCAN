import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import canadianMapleLeaf from "@/assets/canadian-maple-leaf-red.png";

const Login = () => {
  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Header with logo */}
      <header className="bg-[#F9F9F9] px-4 lg:px-20 py-4">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={canadianMapleLeaf}
              alt="Canadian maple leaf"
              className="w-[38px] h-[38px]"
            />
            <h1 className="text-[32px] font-bold text-black font-inter">
              MARCAN
            </h1>
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <main className="flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 w-full max-w-md">
          <h2 className="text-2xl font-bold text-black font-inter mb-6 text-center">
            Log In to MARCAN
          </h2>

          <form className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email Address"
                className="h-12 text-base font-medium text-[#7A7777] border border-gray-300 rounded-lg px-4 font-inter"
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Password"
                className="h-12 text-base font-medium text-[#7A7777] border border-gray-300 rounded-lg px-4 font-inter"
              />
            </div>

            <Button className="w-full bg-[#DB1233] hover:bg-[#c10e2b] text-white h-12 text-base font-semibold font-inter">
              Log In
            </Button>
          </form>

          <p className="text-center text-gray-600 mt-4">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-[#DB1233] hover:underline font-semibold"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
