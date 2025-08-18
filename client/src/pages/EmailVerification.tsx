import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, AlertCircle, RefreshCw, Edit } from "lucide-react";
import { auth } from "@/firebase";
import { sendEmailVerification, onAuthStateChanged, updateEmail } from "firebase/auth";

const EmailVerification = () => {
    const navigate = useNavigate();
    const [resendLoading, setResendLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [verificationSent, setVerificationSent] = useState(false);
    const [error, setError] = useState("");
    const [showChangeEmail, setShowChangeEmail] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [changeEmailLoading, setChangeEmailLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setEmail(user.email || "");
                if (user.emailVerified) {
                    // If email is already verified, redirect to listings
                    navigate("/listings");
                }
            } else {
                // If no user is signed in, redirect to login
                navigate("/login");
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleResendVerification = async () => {
        setResendLoading(true);
        setError("");

        try {
            const user = auth.currentUser;
            if (user) {
                await sendEmailVerification(user);
                setVerificationSent(true);
                // Auto-hide success message after 5 seconds
                setTimeout(() => setVerificationSent(false), 5000);
            }
        } catch (err: any) {
            console.error("Error sending verification email:", err);
            setError(err.message || "Failed to send verification email");
        } finally {
            setResendLoading(false);
        }
    };



    const handleChangeEmail = async () => {
        if (!newEmail || !newEmail.includes('@')) {
            setError("Please enter a valid email address");
            return;
        }

        setChangeEmailLoading(true);
        setError("");

        try {
            const user = auth.currentUser;
            if (user) {
                await updateEmail(user, newEmail);
                setEmail(newEmail);
                setNewEmail("");
                setShowChangeEmail(false);
                // Send verification email to new address
                await sendEmailVerification(user);
                setVerificationSent(true);
                setTimeout(() => setVerificationSent(false), 5000);
            }
        } catch (err: any) {
            console.error("Error changing email:", err);
            if (err.code === "auth/requires-recent-login") {
                setError("For security reasons, you need to sign out and sign in again before changing your email.");
            } else {
                setError(err.message || "Failed to change email address");
            }
        } finally {
            setChangeEmailLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-[#F9F9F9] flex flex-col">
            <main className="flex-1 flex items-center justify-center px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <Mail className="w-8 h-8 text-blue-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
                        <CardDescription className="text-gray-600">
                            We've sent a verification link to
                        </CardDescription>
                        <div className="font-semibold text-gray-800 mt-2">{email}</div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <span className="text-red-700 text-sm">{error}</span>
                            </div>
                        )}

                        {verificationSent && (
                            <div className="p-3 bg-green-100 border border-green-300 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <span className="text-green-700 text-sm">
                                    Verification email sent successfully!
                                </span>
                            </div>
                        )}

                        <div className="space-y-4">
                            <Button
                                onClick={handleResendVerification}
                                disabled={resendLoading}
                                variant="outline"
                                className="w-full"
                            >
                                {resendLoading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    "Resend verification email"
                                )}
                            </Button>

                            {!showChangeEmail ? (
                                <Button
                                    onClick={() => setShowChangeEmail(true)}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Change email address
                                </Button>
                            ) : (
                                <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-2">
                                        <Edit className="w-4 h-4 text-gray-600" />
                                        <span className="font-medium text-sm">Change email address</span>
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="Enter new email address"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#DB1233] focus:border-transparent"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleChangeEmail}
                                            disabled={changeEmailLoading}
                                            size="sm"
                                            className="flex-1 bg-[#DB1233] hover:bg-[#c10e2b] text-white"
                                        >
                                            {changeEmailLoading ? (
                                                <>
                                                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                "Update Email"
                                            )}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setShowChangeEmail(false);
                                                setNewEmail("");
                                                setError("");
                                            }}
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <Button
                                onClick={() => navigate("/login")}
                                className="w-full bg-[#DB1233] hover:bg-[#c10e2b] text-white"
                            >
                                Go to Login
                            </Button>

                        </div>

                        <div className="text-center text-sm text-gray-500 space-y-3">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                <p className="font-medium text-blue-800 mb-2">Important:</p>
                                <ul className="text-blue-700 text-xs space-y-1">
                                    <li>• Verification links expire after 1 hour</li>
                                    <li>• Each link can only be used once</li>
                                    <li>• If you see "link has expired" error, click "Resend verification email"</li>
                                    <li>• Check your email immediately after clicking resend</li>
                                </ul>
                            </div>
                            <p>Didn't receive the email? Check your spam folder.</p>
                            <p className="text-[#DB1233] font-medium">
                                Once you've verified your email, you can log in to your account.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default EmailVerification;
