import { useState } from "react";
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
import { Link, useNavigate } from "react-router-dom";
import { Upload, Eye, EyeOff } from "lucide-react";
import canadianMapleLeaf from "@/assets/canadian-maple-leaf-red.png";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import { profileApi } from "@/services/api";

const SignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    email: "",
    password: "",
    confirmPassword: "",
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      console.log('Creating Firebase user with email:', formData.email);
      // Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      console.log('Firebase user created successfully:', userCredential.user.uid);

      // Save profile data to database
      const profileData = {
        firebaseUid: userCredential.user.uid,
        email: formData.email,
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
        logoUrl: "", // Will be implemented later for logo upload
      };

      console.log('Saving profile data:', profileData);
      await profileApi.createOrUpdateProfile(profileData);
      console.log('Profile saved successfully');

      // If successful, navigate to dashboard
      navigate("/dashboard");
    } catch (err: any) {
      console.error('Error during signup:', err);
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Header with logo - same format as homepage */}
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

      {/* Main Content */}
      <main className="px-4 lg:px-20">
        <div className="max-w-screen-xl mx-auto">
          {/* White content area */}
          <div className="bg-white mx-auto max-w-5xl px-12 py-16 relative">
            {/* Hero Section */}
            <div className="mb-16">
              <h1 className="text-[50px] lg:text-[50px] font-bold text-black font-inter leading-tight mb-6">
                Set up your profile
              </h1>
              <p className="text-[25px] lg:text-[25px] text-[#4A3F3F] font-inria-sans font-normal">
                Set the tone with a strong company profile.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form className="space-y-12" onSubmit={handleSubmit}>
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
                  placeholder=""
                  required
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
                    <SelectTrigger className="h-[55px] text-[15px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white">
                      <SelectValue
                        placeholder="Province"
                        className="text-[14px] opacity-50"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ab">Alberta</SelectItem>
                      <SelectItem value="bc">British Columbia</SelectItem>
                      <SelectItem value="mb">Manitoba</SelectItem>
                      <SelectItem value="nb">New Brunswick</SelectItem>
                      <SelectItem value="nl">
                        Newfoundland and Labrador
                      </SelectItem>
                      <SelectItem value="ns">Nova Scotia</SelectItem>
                      <SelectItem value="nt">Northwest Territories</SelectItem>
                      <SelectItem value="nu">Nunavut</SelectItem>
                      <SelectItem value="on">Ontario</SelectItem>
                      <SelectItem value="pe">Prince Edward Island</SelectItem>
                      <SelectItem value="qc">Quebec</SelectItem>
                      <SelectItem value="sk">Saskatchewan</SelectItem>
                      <SelectItem value="yt">Yukon</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                    placeholder="Postal code"
                    required
                  />
                </div>
              </div>

              {/* Website */}
              <div className="space-y-4">
                <label className="block text-xl font-semibold text-black font-inter">
                  Website
                </label>
                <Input
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white max-w-2xl"
                  placeholder="Add a link to your website"
                />
              </div>

              {/* Description */}
              <div className="space-y-4">
                <label className="block text-xl font-semibold text-black font-inter">
                  Description <span className="text-[#DB1233]">*</span>
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="min-h-[129px] text-[15px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 py-4 font-inter bg-white resize-none"
                  placeholder="Add a description about your company"
                  required
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-4">
                <label className="block text-xl font-semibold text-black font-inter">
                  Logo <span className="text-[#DB1233]">*</span>
                </label>
                <div className="w-[173px] h-[139px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#DB1233] transition-colors">
                  <Upload className="w-12 h-12 text-[#DB1233] mb-2" />
                  <span className="text-[#DB1233] font-inter font-semibold">
                    Upload image
                  </span>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-4">
                <label className="block text-xl font-semibold text-black font-inter">
                  Contact Details <span className="text-[#DB1233]">*</span>
                </label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                    placeholder="Phone"
                    required
                  />
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                    placeholder="Email Address"
                    required
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="space-y-4">
                <label className="block text-xl font-semibold text-black font-inter">
                  Password <span className="text-[#DB1233]">*</span>
                </label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 pr-12 font-inter bg-white"
                      placeholder="Password"
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
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 pr-12 font-inter bg-white"
                      placeholder="Re-enter Password"
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
              </div>

              {/* Create Account Button */}
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

            {/* Login Link */}
            <p className="text-center text-gray-600 mt-8 text-lg">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#DB1233] hover:underline font-semibold"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUp;
