import { useState } from "react";
import axios from 'axios';
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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
    chatbotName: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-[#DB1233]', 'bg-red-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-[#DB1233]', 'bg-red-50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-[#DB1233]', 'bg-red-50');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      }
    }
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

    // Check if logo is uploaded
    if (!logoFile) {
      setError("Please upload a company logo");
      setLoading(false);
      return;
    }

    // Check if province is selected
    if (!formData.province) {
      setError("Please select a province");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      //const logoUrl = logoPreview || "";
      let logoUrl = "";
      if (logoFile) {
        logoUrl = await uploadImageToCloudinary(logoFile);
      }

      const profileData = {
        firebaseUid: userCredential.user.uid,
        email: formData.email,
        name: formData.companyName,
        companyName: formData.companyName,
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        province: formData.province,
        postalCode: formData.postalCode,
        website: formData.website,
        description: formData.description,
        phone: formData.phone,
        logoUrl,
        chatbotName: formData.chatbotName,
      };

      await profileApi.createOrUpdateProfile(profileData);
      navigate("/listings");
    } catch (err: any) {
      console.error("Error during signup:", err);
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
          <div className="bg-white mx-auto max-w-5xl px-12 py-16 relative">
            <div className="mb-16">
              <h1 className="text-[50px] font-bold text-black font-inter mb-6">
                Set up your profile
              </h1>
              <p className="text-[25px] text-[#4A3F3F] font-inria-sans">
                Set the tone with a strong company profile.
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
                  Company Name <span className="text-red-500">*</span>
                </label>
                <Input
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="text-xl font-semibold text-black">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Input
                    name="address1"
                    value={formData.address1}
                    onChange={handleInputChange}
                    placeholder="Address line 1"
                    required
                  />
                  <Input
                    name="address2"
                    value={formData.address2}
                    onChange={handleInputChange}
                    placeholder="Address line 2 (optional)"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                    required
                  />
                  <Select
                    onValueChange={handleProvinceChange}
                    value={formData.province}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ab">Alberta</SelectItem>
                      <SelectItem value="bc">British Columbia</SelectItem>
                      <SelectItem value="mb">Manitoba</SelectItem>
                      <SelectItem value="nb">New Brunswick</SelectItem>
                      <SelectItem value="nl">Newfoundland and Labrador</SelectItem>
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
                    placeholder="Postal Code"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xl font-semibold text-black">Website</label>
                <Input
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="Add your company website"
                />
              </div>

              <div className="space-y-4">
                <label className="text-xl font-semibold text-black">
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your company and services..."
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="text-xl font-semibold text-black">
                  Logo <span className="text-red-500">*</span>
                </label>
                <div
                  className="w-[173px] h-[139px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#DB1233] transition-colors overflow-hidden relative"
                  onClick={() => document.getElementById("logoInput")?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {logoPreview ? (
                    <>
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white font-semibold text-sm">Change logo</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-[#DB1233] mb-2" />
                      <span className="text-[#DB1233] font-semibold">
                        Upload image
                      </span>
                      <span className="text-gray-500 text-xs mt-1">
                        or drag & drop
                      </span>
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
                <p className="text-sm text-gray-600">By default it's "Marcy" and it's totally fine if you don't want tochange it.</p>
              </div>

              <div className="space-y-4">
                <label className="text-xl font-semibold text-black">
                  Contact Details <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone"
                    required
                  />
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xl font-semibold text-black">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
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
                      placeholder="Confirm Password"
                      required
                    />
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

export default SignUp;