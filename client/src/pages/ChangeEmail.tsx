import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import { updateEmail, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import { Eye, EyeOff, X } from "lucide-react";

const ChangeEmail = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        newEmail: "",
        confirmEmail: "",
        password: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        // Validate emails match
        if (formData.newEmail !== formData.confirmEmail) {
            setError("Email addresses do not match");
            setLoading(false);
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.newEmail)) {
            setError("Please enter a valid email address");
            setLoading(false);
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user || !user.email) {
                setError("User not authenticated");
                return;
            }

            // Re-authenticate user before changing email
            const credential = EmailAuthProvider.credential(
                user.email,
                formData.password
            );

            await reauthenticateWithCredential(user, credential);

            // Update email in Firebase
            await updateEmail(user, formData.newEmail);

            setSuccess("Email updated successfully!");

            // Navigate back to my account after a short delay
            setTimeout(() => {
                navigate("/my-account");
            }, 3000);
        } catch (err: any) {
            console.error('Error updating email:', err);
            if (err.code === 'auth/wrong-password') {
                setError("Current password is incorrect");
            } else if (err.code === 'auth/email-already-in-use') {
                setError("This email address is already in use by another account");
            } else {
                setError(err.message || "Failed to update email");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F9F9]">
            <AuthenticatedHeader />

            <main className="px-4 lg:px-20 py-8 max-w-screen-xl mx-auto">
                <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-[36px] font-bold text-black font-inter">
                            Change Email Address
                        </h1>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate("/my-account")}
                            className="h-8 w-8 text-gray-600 hover:text-gray-900"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                            {success}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Current Email (Read-only) */}
                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">
                                Current Email Address
                            </label>
                            <Input
                                value={auth.currentUser?.email || ""}
                                className="h-[55px] text-[20px] font-semibold text-gray-500 border border-gray-300 rounded-lg px-6 font-inter bg-gray-100"
                                placeholder="Current email"
                                disabled
                            />
                            {auth.currentUser && !auth.currentUser.emailVerified && (
                                <p className="text-sm text-orange-600">
                                    ⚠️ Your current email is not verified. Please verify it before changing.
                                </p>
                            )}
                        </div>

                        {/* New Email */}
                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">
                                New Email Address <span className="text-[#DB1233]">*</span>
                            </label>
                            <Input
                                name="newEmail"
                                type="email"
                                value={formData.newEmail}
                                onChange={handleInputChange}
                                className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                                placeholder="Enter new email address"
                                required
                            />
                        </div>

                        {/* Confirm New Email */}
                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">
                                Confirm New Email Address <span className="text-[#DB1233]">*</span>
                            </label>
                            <Input
                                name="confirmEmail"
                                type="email"
                                value={formData.confirmEmail}
                                onChange={handleInputChange}
                                className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                                placeholder="Confirm new email address"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">
                                Current Password <span className="text-[#DB1233]">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 pr-12 font-inter bg-white"
                                    placeholder="Enter your current password"
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
                            <p className="text-sm text-gray-600">
                                You need to enter your current password to change your email address.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4 pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/my-account")}
                                className="px-8 py-3 text-lg font-semibold"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 text-lg font-semibold bg-[#DB1233] hover:bg-[#c10e2b] text-white"
                            >
                                {loading ? "Updating..." : "Update Email"}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ChangeEmail; 