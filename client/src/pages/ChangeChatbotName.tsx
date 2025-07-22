import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import { profileApi, UserProfile } from "@/services/api";
import { X } from "lucide-react";

const ChangeChatbotName = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [currentChatbotName, setCurrentChatbotName] = useState("");
    const [newChatbotName, setNewChatbotName] = useState("");

    useEffect(() => {
        // Check if user is logged in
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user) {
                navigate("/login");
            } else {
                // Fetch current profile data
                fetchProfileData(user.uid);
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const fetchProfileData = async (firebaseUid: string) => {
        try {
            setLoading(true);
            const data = await profileApi.getUserProfile(firebaseUid);
            setCurrentChatbotName(data.chatbotName || "Marcy");
            setNewChatbotName(data.chatbotName || "");
        } catch (err: any) {
            console.error("Failed to fetch profile data", err);
            setError("Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setSaving(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                setError("User not authenticated");
                return;
            }

            // Get current profile data
            const currentProfile = await profileApi.getUserProfile(user.uid);

            // Update profile data with new chatbot name
            const profileData = {
                ...currentProfile,
                chatbotName: newChatbotName.trim() || undefined, // Set to undefined if empty to use default
            };

            await profileApi.createOrUpdateProfile(profileData);
            setSuccess("Chatbot name updated successfully!");

            // Navigate back to my account after a short delay
            setTimeout(() => {
                navigate("/my-account");
            }, 1500);
        } catch (err: any) {
            console.error('Error updating chatbot name:', err);
            setError(err.message || "Failed to update chatbot name");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9F9F9]">
                <AuthenticatedHeader />
                <div className="flex items-center justify-center min-h-screen">
                    <p className="text-gray-500">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9F9F9]">
            <AuthenticatedHeader />

            <main className="px-4 lg:px-20 py-8 max-w-screen-xl mx-auto">
                <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-[36px] font-bold text-black font-inter">
                            Change Chatbot Name
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">
                                Current Chatbot Name
                            </label>
                            <div className="bg-gray-50 rounded-lg px-4 py-3">
                                <span className="text-lg font-medium text-gray-700">
                                    {currentChatbotName}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">
                                New Chatbot Name
                            </label>
                            <Input
                                type="text"
                                value={newChatbotName}
                                onChange={(e) => setNewChatbotName(e.target.value)}
                                placeholder="Enter your new chatbot name"
                                className="h-12 text-lg"
                            />
                            <p className="text-sm text-gray-600">
                                Leave empty to use the default name "Marcy"
                            </p>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <Button
                                type="submit"
                                className="bg-[#DB1233] hover:bg-[#c10e2b] text-white text-lg font-semibold rounded-lg px-8 py-3 h-auto"
                                disabled={saving}
                            >
                                {saving ? "Updating..." : "Update Chatbot Name"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/my-account")}
                                className="text-lg font-semibold rounded-lg px-8 py-3 h-auto"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default ChangeChatbotName; 