import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import canadianMapleLeaf from "@/assets/canadian-maple-leaf-red.png";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import { profileApi } from "@/services/api";

const BuyerSignUp = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        city: "",
        country: "",
        interests: "",
        chatbotName: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

            const profileData = {
                firebaseUid: userCredential.user.uid,
                email: formData.email,
                name: formData.name,
                city: formData.city,
                country: formData.country,
                description: formData.interests,
                phone: formData.phone,
                chatbotName: formData.chatbotName,
                accountType: 'individual' as const,
                isVerified: true,
            };

            await profileApi.createOrUpdateProfile(profileData);

            navigate("/my-account");
        } catch (err: any) {
            setError(err.message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F9F9]">
            <header className="bg-[#F9F9F9] px-4 lg:px-20 py-4">
                <div className="flex items-center justify-between max-w-screen-xl mx-auto">
                    <Link to="/" className="flex items-center gap-3">
                        <img src={canadianMapleLeaf} alt="Canadian maple leaf" className="w-[38px] h-[38px]" />
                        <h1 className="text-[32px] font-bold text-black font-inter">MARCAN</h1>
                    </Link>
                </div>
            </header>

            <main className="px-4 lg:px-20">
                <div className="max-w-screen-xl mx-auto">
                    <div className="bg-white mx-auto max-w-5xl px-12 py-16 relative">
                        <div className="mb-16">
                            <h1 className="text-[50px] font-bold text-black font-inter mb-6">
                                Set up your individual account
                            </h1>
                            <p className="text-[25px] text-[#4A3F3F] font-inria-sans">
                                Create your individual account to browse the marketplace and save listings.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form className="space-y-12" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <label className="text-xl font-semibold text-black">
                                    Your name <span className="text-red-500">*</span>
                                </label>
                                <Input name="name" value={formData.name} onChange={handleInputChange} required placeholder="Enter your full name" />
                            </div>

                            <div className="space-y-4">
                                <label className="text-xl font-semibold text-black">
                                    Location <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input name="city" value={formData.city} onChange={handleInputChange} required placeholder="City" />
                                    <Input name="country" value={formData.country} onChange={handleInputChange} required placeholder="Country" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xl font-semibold text-black">Interests</label>
                                <Input name="interests" value={formData.interests} onChange={handleInputChange} placeholder="What are you looking for? (optional)" />
                            </div>

                            <div className="space-y-4">
                                <label className="text-xl font-semibold text-black">
                                    Your chatbot name
                                </label>
                                <Input
                                    name="chatbotName"
                                    value={formData.chatbotName}
                                    onChange={handleInputChange}
                                    placeholder="Give a personalized name for your chatbot assistant"
                                />
                                <p className="text-sm text-gray-600">By default it's "Marcy" and it's totally fine if you don't want to change it.</p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xl font-semibold text-black">
                                    Contact Details <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <Input name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="Phone number" />
                                    <Input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="Email address" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xl font-semibold text-black">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} required placeholder="Password" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required placeholder="Confirm password" />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                        >
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center pt-8 mt-12">
                                <Button
                                    type="submit"
                                    className="bg-[#DB1233] hover:bg-[#c10e2b] text-white text-[24px] font-semibold rounded-[15px] py-6 h-auto font-inter min-w-[40px] px-[50px] pl-16"
                                    disabled={loading}
                                >
                                    {loading ? "Creating Account..." : "Create Account"}
                                </Button>
                            </div>
                        </form>

                        <p className="text-center text-gray-600 mt-8 text-lg">
                            Already have an account?{" "}
                            <Link to="/login" className="text-[#DB1233] hover:underline font-semibold">
                                Log In
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default BuyerSignUp;


