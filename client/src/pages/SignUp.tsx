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
import { Link } from "react-router-dom";
import { Upload } from "lucide-react";
import canadianMapleLeaf from "@/assets/canadian-maple-leaf-red.png";

const SignUp = () => {
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
              <h1 className="text-[50px] lg:text-[64px] font-bold text-black font-inter leading-tight mb-6">
                Set up your profile
              </h1>
              <p className="text-[25px] lg:text-[30px] text-[#4A3F3F] font-inria-sans font-normal">
                Set the tone with a strong company profile.
              </p>
            </div>

            {/* Form */}
            <form className="space-y-12">
              {/* Company Name */}
              <div className="space-y-4">
                <label className="block text-2xl font-semibold text-black font-inter">
                  Company Name <span className="text-[#DB1233]">*</span>
                </label>
                <Input
                  className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                  placeholder=""
                />
              </div>

              {/* Location */}
              <div className="space-y-4">
                <label className="block text-2xl font-semibold text-black font-inter">
                  Location <span className="text-[#DB1233]">*</span>
                </label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Input
                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                    placeholder="Address line 1"
                  />
                  <Input
                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                    placeholder="Address line 2 (optional)"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                    placeholder="City"
                  />
                  <Select>
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
                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                    placeholder="Postal code"
                  />
                </div>
              </div>

              {/* Website */}
              <div className="space-y-4">
                <label className="block text-2xl font-semibold text-black font-inter">
                  Website
                </label>
                <Input
                  className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white max-w-2xl"
                  placeholder="Add a link to your website"
                />
              </div>

              {/* Description */}
              <div className="space-y-4">
                <label className="block text-2xl font-semibold text-black font-inter">
                  Description <span className="text-[#DB1233]">*</span>
                </label>
                <Textarea
                  className="min-h-[129px] text-[15px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 py-4 font-inter bg-white resize-none"
                  placeholder="Add a description about your company"
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-4">
                <label className="block text-2xl font-semibold text-black font-inter">
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
                <label className="block text-2xl font-semibold text-black font-inter">
                  Contact Details <span className="text-[#DB1233]">*</span>
                </label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Input
                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                    placeholder="Phone"
                  />
                  <Input
                    type="email"
                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                    placeholder="Email Address"
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="space-y-4">
                <label className="block text-2xl font-semibold text-black font-inter">
                  Password <span className="text-[#DB1233]">*</span>
                </label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Input
                    type="password"
                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                    placeholder="Password"
                  />
                  <Input
                    type="password"
                    className="h-[55px] text-[20px] font-semibold text-[#7A7777] border border-black rounded-lg px-6 font-inter bg-white"
                    placeholder="Re-enter Password"
                  />
                </div>
              </div>
            </form>

            {/* Create Account Button */}
            <div className="flex justify-center pt-8 mt-12">
              <Button className="bg-[#DB1233] hover:bg-[#c10e2b] text-white text-[28px] font-semibold rounded-[15px] py-6 h-auto font-inter min-w-[40px] px-[50px] pl-16">
                Create Account
              </Button>
            </div>

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
