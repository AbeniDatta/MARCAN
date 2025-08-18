import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import { Listing } from "@/services/api";
import Header from "@/components/Header";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import Hero from "@/components/Hero";
import FeaturedCategories from "@/components/FeaturedCategories";
import LatestListings from "@/components/LatestListings";
import FiltersSidebar from "@/components/FiltersSidebar";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedListings, setSelectedListings] = useState<Listing[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [filters, setFilters] = useState({
    categories: [] as string[],
    tags: [] as string[],
    location: [] as string[],
    capacity: [] as string[],
    sortBy: "new-to-old",
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthenticated(true);
        setEmailVerified(user.emailVerified);
      } else {
        setIsAuthenticated(false);
        setEmailVerified(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectionChange = (listings: Listing[]) => {
    setSelectedListings(listings);
  };

  const handleSelectionModeChange = (mode: boolean) => {
    setIsSelectionMode(mode);
    if (!mode) {
      setSelectedListings([]);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Header */}
      {isAuthenticated && emailVerified ? <AuthenticatedHeader /> : <Header />}

      {/* Hero Section */}
      <Hero onSearch={(query) => navigate(`/listings?search=${encodeURIComponent(query)}`)} />

      {/* Featured Categories */}
      <FeaturedCategories />

      {/* Latest Listings with Sidebar */}
      <section className="bg-[#F9F9F9] px-4 lg:px-20 pb-16">
        <div className="max-w-screen-xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-[220px]">
            <FiltersSidebar
              filters={filters}
              onFilterChange={(updated) => setFilters(updated)}
            />
          </div>
          {/* Main Content */}
          <div className="flex-1">
            <LatestListings
              filters={filters}
              onSelectionChange={handleSelectionChange}
              selectedListings={selectedListings}
              onSelectionModeChange={handleSelectionModeChange}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
