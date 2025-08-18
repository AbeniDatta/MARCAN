import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import canadianMapleLeaf from "@/assets/canadian-maple-leaf-red.png";
import { useState } from "react";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "@/firebase";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        // Sign out the user and show error with option to resend verification
        await auth.signOut();
        setError("Please verify your email before logging in. Check your inbox for a verification link.");
        return;
      }

      navigate("/listings"); // Redirect to listings after successful login
    } catch (err: any) {
      let message = "An error occurred. Please try again.";
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        message = "Invalid Email or Password";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setResendLoading(true);
    setError("");

    try {
      // Try to sign in to get the user object
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user);
        setVerificationSent(true);
        // Sign out after sending verification
        await auth.signOut();
      }
    } catch (err: any) {
      setError("Failed to send verification email. Please check your credentials.");
    } finally {
      setResendLoading(false);
    }
  };

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

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
              {error.includes("verify your email") && (
                <div className="mt-2">
                  <button
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="text-[#DB1233] hover:underline font-semibold text-sm"
                  >
                    {resendLoading ? "Sending..." : "Resend verification email"}
                  </button>
                </div>
              )}
            </div>
          )}

          {verificationSent && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
              Verification email sent successfully! Please check your inbox.
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <Input
                type="email"
                placeholder="Email Address"
                className="h-12 text-base font-medium text-[#7A7777] border border-gray-300 rounded-lg px-4 font-inter"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="h-12 text-base font-medium text-[#7A7777] border border-gray-300 rounded-lg px-4 pr-12 font-inter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#DB1233] hover:bg-[#c10e2b] text-white h-12 text-base font-semibold font-inter"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In"}
            </Button>
          </form>

          <div className="text-center mt-4 space-y-2">
            <p className="text-gray-600 text-sm">
              Forgot your password?{" "}
              <Link
                to="/forgot-password"
                className="text-[#DB1233] hover:underline font-semibold"
              >
                Reset it here
              </Link>
            </p>
            <p className="text-gray-600 text-sm">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-[#DB1233] hover:underline font-semibold"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
