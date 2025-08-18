import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { auth } from "@/firebase";
import { sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import canadianMapleLeaf from "@/assets/canadian-maple-leaf-red.png";
import { Mail, CheckCircle, RefreshCw } from "lucide-react";

const EmailVerification = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [verificationSent, setVerificationSent] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Get email from URL params if available
        const emailFromParams = searchParams.get('email');
        if (emailFromParams) {
            setEmail(emailFromParams);
        }

        // Listen for auth state changes to check if user is verified
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                if (user.emailVerified) {
                    // User is verified, redirect to login
                    navigate('/login?verified=true');
                } else {
                    // User is not verified, set email if not already set
                    if (!email && user.email) {
                        setEmail(user.email);
                    }
                }
            } else {
                // No user logged in, redirect to signup
                navigate('/signup');
            }
        });

        return () => unsubscribe();
    }, [navigate, searchParams, email]);

    const handleResendVerification = async () => {
        setResendLoading(true);
        setError("");

        try {
            const user = auth.currentUser;
            if (user) {
                await sendEmailVerification(user);
                setVerificationSent(true);
                setTimeout(() => setVerificationSent(false), 5000); // Hide success message after 5 seconds
            }
        } catch (err: any) {
            console.error("Error sending verification email:", err);
            setError("Failed to send verification email. Please try again.");
        } finally {
            setResendLoading(false);
        }
    };

    const handleCheckVerification = async () => {
        setLoading(true);
        setError("");

        try {
            const user = auth.currentUser;
            if (user) {
                // Reload user to get latest verification status
                await user.reload();

                if (user.emailVerified) {
                    navigate('/login?verified=true');
                } else {
                    setError("Email not verified yet. Please check your inbox and click the verification link.");
                }
            }
        } catch (err: any) {
            console.error("Error checking verification:", err);
            setError("Failed to check verification status. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await auth.signOut();
            navigate('/signup');
        } catch (err) {
            console.error("Error signing out:", err);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F9F9]">
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

            <main className="px-4 lg:px-20">
                <div className="max-w-screen-xl mx-auto">
                    <div className="bg-white mx-auto max-w-2xl px-12 py-16 relative">
                        <div className="text-center mb-8">
                            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <Mail className="w-8 h-8 text-blue-600" />
                            </div>
                            <h1 className="text-[32px] font-bold text-black font-inter mb-4">
                                Verify your email
                            </h1>
                            <p className="text-[18px] text-[#4A3F3F] font-inria-sans mb-2">
                                We've sent a verification link to
                            </p>
                            <p className="text-[18px] font-semibold text-black font-inter mb-6">
                                {email}
                            </p>
                            <p className="text-[16px] text-gray-600 font-inter">
                                Please check your email and click the verification link to continue.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {verificationSent && (
                            <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Verification email sent successfully!
                            </div>
                        )}

                        <div className="space-y-4">
                            <Button
                                onClick={handleCheckVerification}
                                disabled={loading}
                                className="w-full bg-[#DB1233] hover:bg-[#c10e2b] text-white text-[18px] font-semibold rounded-[10px] py-4 h-auto font-inter"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        Checking...
                                    </div>
                                ) : (
                                    "I've verified my email"
                                )}
                            </Button>

                            <Button
                                onClick={handleResendVerification}
                                disabled={resendLoading}
                                variant="outline"
                                className="w-full border-[#DB1233] text-[#DB1233] hover:bg-[#DB1233] hover:text-white text-[16px] font-medium rounded-[10px] py-3 h-auto font-inter"
                            >
                                {resendLoading ? (
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </div>
                                ) : (
                                    "Resend verification email"
                                )}
                            </Button>

                            <div className="text-center pt-4">
                                <button
                                    onClick={handleSignOut}
                                    className="text-[#DB1233] hover:underline font-medium text-[16px]"
                                >
                                    Use a different email
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-black mb-2">Didn't receive the email?</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Check your spam or junk folder</li>
                                <li>• Make sure you entered the correct email address</li>
                                <li>• Wait a few minutes before requesting a new email</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EmailVerification;
