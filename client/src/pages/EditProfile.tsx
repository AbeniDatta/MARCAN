import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import { profileApi, UserProfile } from "@/services/api";
import { Upload, X } from "lucide-react";

const EditProfile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        companyName: "",
        address1: "",
        address2: "",
        city: "",
        province: "",
        postalCode: "",
        website: "",
        description: "",
        phone: "",
        chatbotName: "",
    });

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

            // Populate form with existing data
            setFormData({
                companyName: data.companyName || "",
                address1: data.address1 || "",
                address2: data.address2 || "",
                city: data.city || "",
                province: data.province || "",
                postalCode: data.postalCode || "",
                website: data.website || "",
                description: data.description || "",
                phone: data.phone || "",
                chatbotName: data.chatbotName || "",
            });
            setLogoPreview(data.logoUrl || null);
        } catch (err: any) {
            console.error("Failed to fetch profile data", err);
            setError("Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleProvinceChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            province: value,
        }));
    };

    const uploadImageToCloudinary = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

        const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            formData
        );
        return response.data.secure_url;
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

            let logoUrl = logoPreview || "";
            if (logoFile) {
                logoUrl = await uploadImageToCloudinary(logoFile);
            }

            // Update profile data
            const profileData = {
                firebaseUid: user.uid,
                email: user.email || "",
                name: formData.companyName, // Use company name as the display name
                companyName: formData.companyName,
                address1: formData.address1,
                address2: formData.address2,
                city: formData.city,
                province: formData.province,
                postalCode: formData.postalCode,
                website: formData.website,
                description: formData.description,
                phone: formData.phone,
                logoUrl, // Will be implemented later for logo upload
                chatbotName: formData.chatbotName,
            };

            await profileApi.createOrUpdateProfile(profileData);
            setSuccess("Profile updated successfully!");

            // Dispatch custom event to notify chatbot to refresh
            window.dispatchEvent(new CustomEvent('profileUpdated', {
                detail: { chatbotName: formData.chatbotName }
            }));

            // Navigate back to my account after a short delay
            setTimeout(() => {
                navigate("/my-account");
            }, 1500);
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setError(err.message || "Failed to update profile");
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
                <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-[36px] font-bold text-black font-inter">
                            Edit Profile
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

                    <form className="space-y-8" onSubmit={handleSubmit}>
                        {/* Company Name */}
                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">
                                Company Name <span className="text-[#DB1233]">*</span>
                            </label>
                            <Input
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleInputChange}
                                className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                                placeholder="Enter company name"
                                required
                            />
                        </div>

                        {/* Logo */}
                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">Company Logo</label>
                            <div
                                className="w-[173px] h-[139px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#DB1233] transition-colors overflow-hidden"
                                onClick={() => document.getElementById("logoInput")?.click()}
                            >
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                                ) : (
                                    <>
                                        <Upload className="w-12 h-12 text-[#DB1233] mb-2" />
                                        <span className="text-[#DB1233] font-semibold">Upload image</span>
                                    </>
                                )}
                            </div>
                            <input
                                id="logoInput"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setLogoFile(file);
                                        setLogoPreview(URL.createObjectURL(file));
                                    }
                                }}
                            />
                        </div>

                        {/* Location */}
                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">
                                Location <span className="text-[#DB1233]">*</span>
                            </label>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <Input
                                    name="address1"
                                    value={formData.address1}
                                    onChange={handleInputChange}
                                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                                    placeholder="Address line 1"
                                    required
                                />
                                <Input
                                    name="address2"
                                    value={formData.address2}
                                    onChange={handleInputChange}
                                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                                    placeholder="Address line 2 (optional)"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                                    placeholder="City"
                                    required
                                />
                                <Select
                                    onValueChange={handleProvinceChange}
                                    value={formData.province}
                                >
                                    <SelectTrigger className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white">
                                        <SelectValue placeholder="Province" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Alberta">Alberta</SelectItem>
                                        <SelectItem value="British Columbia">British Columbia</SelectItem>
                                        <SelectItem value="Manitoba">Manitoba</SelectItem>
                                        <SelectItem value="New Brunswick">New Brunswick</SelectItem>
                                        <SelectItem value="Newfoundland and Labrador">Newfoundland and Labrador</SelectItem>
                                        <SelectItem value="Northwest Territories">Northwest Territories</SelectItem>
                                        <SelectItem value="Nova Scotia">Nova Scotia</SelectItem>
                                        <SelectItem value="Nunavut">Nunavut</SelectItem>
                                        <SelectItem value="Ontario">Ontario</SelectItem>
                                        <SelectItem value="Prince Edward Island">Prince Edward Island</SelectItem>
                                        <SelectItem value="Quebec">Quebec</SelectItem>
                                        <SelectItem value="Saskatchewan">Saskatchewan</SelectItem>
                                        <SelectItem value="Yukon">Yukon</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleInputChange}
                                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                                    placeholder="Postal Code"
                                    required
                                />
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">
                                Contact Information
                            </label>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <Input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                                    placeholder="Phone Number"
                                />
                                <Input
                                    name="website"
                                    value={formData.website}
                                    onChange={handleInputChange}
                                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                                    placeholder="Website (optional)"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">
                                Company Description
                            </label>
                            <Textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="min-h-[120px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 py-4 font-inter bg-white resize-none"
                                placeholder="Tell us about your company..."
                            />
                        </div>

                        {/* Chatbot Name */}
                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">
                                Your Chatbot Name
                            </label>
                            <Input
                                name="chatbotName"
                                value={formData.chatbotName}
                                onChange={handleInputChange}
                                className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                                placeholder="Give a personalized name for your chatbot assistant"
                            />
                            <p className="text-sm text-gray-600">
                                By default it's "Marcy" and it's totally fine if you don't want to change it.
                            </p>
                        </div>

                        {/* Email (Read-only) */}
                        <div className="space-y-4">
                            <label className="block text-xl font-semibold text-black font-inter">
                                Email Address
                            </label>
                            <Input
                                value={auth.currentUser?.email || ""}
                                className="h-[55px] text-[20px] font-semibold text-gray-500 border border-gray-300 rounded-lg px-6 font-inter bg-gray-100"
                                placeholder="Email"
                                disabled
                            />
                            <p className="text-sm text-gray-600">
                                To change your email address, use the "Change Email" button in your account.
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
                                disabled={saving}
                                className="px-8 py-3 text-lg font-semibold bg-[#DB1233] hover:bg-[#c10e2b] text-white"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default EditProfile; 