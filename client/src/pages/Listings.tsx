import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import FiltersSidebar from "@/components/FiltersSidebar";

const Listings = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Sample listing data based on the Figma design
  const sampleListings = [
    {
      id: 1,
      title: "Custom Designed Plastic Nozzles",
      company: "Uni-Spray Systems Inc.",
      description:
        "Custom-designed plastic piping systems that incorporate Uni-Spray nozzles and cam-operated couplings.",
      image: "/api/placeholder/69/49",
      tags: ["Export Ready", "In Stock"],
      buttons: [
        { text: "View Supplier", variant: "blue" },
        { text: "Contact Supplier", variant: "red" },
      ],
    },
    {
      id: 2,
      title: "Custom Leather Wallets",
      company: "Leather and Co.",
      description:
        "Custom-designed leather wallets made for all occasions. Our wallets are durable, stylish, and crafted with precision to suit your everyday needs.",
      image: "/api/placeholder/68/68",
      tags: ["Export Ready", "In Stock"],
      buttons: [
        { text: "View Supplier", variant: "blue" },
        { text: "Contact Supplier", variant: "red" },
      ],
    },
    {
      id: 3,
      title: "Industrial Steel Components",
      company: "Steel Works Ltd.",
      description:
        "High-quality industrial steel components manufactured to precise specifications for various applications.",
      image: "/api/placeholder/69/49",
      tags: ["Export Ready", "In Stock"],
      buttons: [
        { text: "View Supplier", variant: "blue" },
        { text: "Contact Supplier", variant: "red" },
      ],
    },
    {
      id: 4,
      title: "Precision Machined Parts",
      company: "Precision Manufacturing Inc.",
      description:
        "CNC machined parts with tight tolerances for automotive and aerospace applications.",
      image: "/api/placeholder/69/49",
      tags: ["Export Ready", "In Stock"],
      buttons: [
        { text: "View Supplier", variant: "blue" },
        { text: "Contact Supplier", variant: "red" },
      ],
    },
    {
      id: 5,
      title: "Custom Injection Molding",
      company: "Mold Tech Solutions",
      description:
        "Custom injection molding services for plastic components in various industries.",
      image: "/api/placeholder/69/49",
      tags: ["Export Ready", "Limited"],
      buttons: [
        { text: "View Supplier", variant: "blue" },
        { text: "Contact Supplier", variant: "red" },
      ],
    },
    {
      id: 6,
      title: "Metal Fabrication Services",
      company: "FabCo Industries",
      description:
        "Complete metal fabrication services including cutting, welding, and finishing.",
      image: "/api/placeholder/69/49",
      tags: ["Export Ready", "In Stock"],
      buttons: [
        { text: "View Supplier", variant: "blue" },
        { text: "Contact Supplier", variant: "red" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Authenticated Header */}
      <AuthenticatedHeader />

      {/* Page Header */}
      <section className="bg-[#F9F9F9] px-4 lg:px-20 py-12">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-[40px] md:text-[50px] font-bold text-black font-inter leading-tight">
            All Listings
          </h1>
          <p className="text-[25px] text-[#4A3F3F] font-inria-sans font-normal mb-8">
            Browse all available products and services from our suppliers
          </p>
        </div>
      </section>

      {/* Listings with Sidebar */}
      <section className="bg-[#F9F9F9] px-4 lg:px-20 pb-16">
        <div className="max-w-screen-xl mx-auto flex gap-8">
          {/* Main Content - Listings Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ">
              {sampleListings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-lg p-6 shadow-sm border border-gray-100"
                >
                  {/* Product Image */}
                  <div className="w-[69px] h-[49px] bg-gray-200 rounded mb-4 flex items-center justify-center overflow-hidden">
                    {listing.image ? (
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 text-xs">Image</span>
                    )}
                  </div>

                  {/* Product Title */}
                  <h3 className="text-[16px] font-semibold text-black font-inter mb-2 leading-tight">
                    {listing.title}
                  </h3>

                  {/* Company Name */}
                  <p className="text-[14px] font-medium text-black font-inter mb-3">
                    {listing.company}
                  </p>

                  {/* Description */}
                  <p className="text-[12px] font-medium text-black font-inter mb-4 leading-tight">
                    {listing.description}
                  </p>

                  {/* Tags */}
                  <div className="flex gap-2 mb-4">
                    {listing.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-[#E0F2FF] rounded-[10px] text-[11px] font-medium text-black font-inter"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {listing.buttons.map((button, index) => (
                      <button
                        key={index}
                        className={`px-3 py-2 rounded text-[13px] font-medium text-white font-inter ${button.variant === "blue"
                          ? "bg-[#2545AB] hover:bg-[#1e3a8a]"
                          : "bg-[#DB1233] hover:bg-[#c10e2b]"
                          } transition-colors`}
                      >
                        {button.text}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters Sidebar */}
          <div className="flex-shrink-0">
            <FiltersSidebar />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Listings;
