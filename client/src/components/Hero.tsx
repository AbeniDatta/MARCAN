import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const Hero = () => {
  return (
    <section className="bg-[#F9F9F9] px-4 lg:px-20 py-12">
      <div className="max-w-screen-xl mx-auto">
        {/* Main Headline */}
        <h1 className="text-[50px] font-bold text-black font-inter leading-tight max-w-5xl">
          Find manufacturers & suppliers
        </h1>

        {/* Subtitle */}
        <p className="text-[25px] text-[#4A3F3F] font-inria-sans font-normal mb-8 max-w-5xl">
          Connect with trusted Canadian B2B suppliers and service providers
        </p>

        {/* Search Section */}
        <div className="flex items-center gap-0 max-w-5xl">
          <div className="flex-1 relative">
            <Input
              placeholder="Search products, businesses, services..."
              className="h-[79px] !text-[20px] font-medium text-[#7A7777] border border-black rounded-lg rounded-r-none border-r-0 px-6 font-inter placeholder:text-[#7A7777] focus:outline-none focus:ring-0 focus:border-black"
            />
          </div>
          <Button className="bg-[#DB1233] hover:bg-[#c10e2b] text-white h-[80px] px-12 rounded-lg rounded-l-none text-3xl font-semibold font-inter">
            <Search className="h-8 w-8" />
            Search
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
