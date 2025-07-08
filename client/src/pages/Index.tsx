import { useEffect, useState } from "react";
import { auth } from "@/firebase";
import Header from "@/components/Header";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import Hero from "@/components/Hero";
import FeaturedCategories from "@/components/FeaturedCategories";
import LatestListings from "@/components/LatestListings";
import FiltersSidebar from "@/components/FiltersSidebar";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    categories: [] as string[],
    tags: [] as string[],
    location: "",
    capacity: [] as string[],
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Header */}
      {isAuthenticated ? <AuthenticatedHeader /> : <Header />}

      {/* Hero Section */}
      <Hero />

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
            <LatestListings filters={filters} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
