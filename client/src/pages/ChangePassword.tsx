import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import { Eye, EyeOff } from "lucide-react";

const ChangePassword = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
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

        // Validate passwords match
        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords do not match");
            setLoading(false);
            return;
        }

        // Validate password strength
        if (formData.newPassword.length < 6) {
            setError("New password must be at least 6 characters long");
            setLoading(false);
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user || !user.email) {
                setError("User not authenticated");
                return;
            }

            // Re-authenticate user before changing password
            const credential = EmailAuthProvider.credential(
                user.email,
                formData.currentPassword
            );

            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, formData.newPassword);

            setSuccess("Password updated successfully!");

            // Navigate back to my account after a short delay
            setTimeout(() => {
                navigate("/my-account");
            }, 1500);
        } catch (err: any) {
            console.error('Error updating password:', err);
            if (err.code === 'auth/wrong-password') {
                setError("Current password is incorrect");
            } else if (err.code === 'auth/weak-password') {
                setError("New password is too weak");
            } else {
                setError(err.message || "Failed to update password");
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
                            Change Password
                        </h1>
                        <Button
                            variant="outline"
                            onClick={() => navigate("/my-account")}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            Cancel
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
                        {/* Current Password */}
                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">
                                Current Password <span className="text-[#DB1233]">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    name="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={formData.currentPassword}
                                    onChange={handleInputChange}
                                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 pr-12 font-inter bg-white"
                                    placeholder="Enter your current password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">
                                New Password <span className="text-[#DB1233]">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    name="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    value={formData.newPassword}
                                    onChange={handleInputChange}
                                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 pr-12 font-inter bg-white"
                                    placeholder="Enter new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <p className="text-sm text-gray-600">
                                Password must be at least 6 characters long.
                            </p>
                        </div>

                        {/* Confirm New Password */}
                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">
                                Confirm New Password <span className="text-[#DB1233]">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 pr-12 font-inter bg-white"
                                    placeholder="Confirm new password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-6">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-3 text-lg font-semibold bg-[#DB1233] hover:bg-[#c10e2b] text-white"
                            >
                                {loading ? "Updating..." : "Update Password"}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ChangePassword; 