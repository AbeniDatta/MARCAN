import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import Hero from "@/components/Hero";
import FeaturedCategories from "@/components/FeaturedCategories";
import LatestListings from "@/components/LatestListings";
import FiltersSidebar from "@/components/FiltersSidebar";

const Dashboard = () => {
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

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Authenticated Header */}
      <AuthenticatedHeader />

      {/* Hero Section */}
      <Hero />

      {/* Featured Categories */}
      <FeaturedCategories />

      {/* Latest Listings with Sidebar */}
      <section className="bg-[#F9F9F9] px-4 lg:px-20 pb-16">
        <div className="max-w-screen-xl mx-auto flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <LatestListings />
          </div>

          {/* Filters Sidebar */}
          <div className="flex-shrink-0 mt-16">
            <FiltersSidebar />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
