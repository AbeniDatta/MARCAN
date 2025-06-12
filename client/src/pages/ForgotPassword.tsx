import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import canadianMapleLeaf from "@/assets/canadian-maple-leaf-red.png";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Check your email for password reset instructions.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
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

      {/* Reset Password Form */}
      <main className="flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 w-full max-w-md">
          <h2 className="text-2xl font-bold text-black font-inter mb-6 text-center">
            Reset Your Password
          </h2>

          <p className="text-gray-600 text-sm mb-6 text-center">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleResetPassword}>
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

            <Button
              type="submit"
              className="w-full bg-[#DB1233] hover:bg-[#c10e2b] text-white h-12 text-base font-semibold font-inter"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Email"}
            </Button>
          </form>

          <div className="text-center mt-6 space-y-2">
            <p className="text-gray-600 text-sm">
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-[#DB1233] hover:underline font-semibold"
              >
                Back to Login
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

export default ForgotPassword;
