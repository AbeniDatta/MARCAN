import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { categoryApi, Category } from "@/services/api";
import DefenceLogo from "../assets/Defence.png";
import AutomotiveLogo from "../assets/Automotive_Services.png";

const FeaturedCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedCategories = async () => {
      try {
        const data = await categoryApi.getFeaturedCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching featured categories:', error);
        // Fallback to hardcoded categories if API fails
        setCategories([
          { id: 1, name: "Automotive Services", imageUrl: AutomotiveLogo, isFeatured: true, createdAt: "", updatedAt: "" },
          { id: 2, name: "Defence", imageUrl: DefenceLogo, isFeatured: true, createdAt: "", updatedAt: "" }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCategories();
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/listings?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <section className="bg-[#F9F9F9] px-4 lg:px-20 py-16">
      <div className="max-w-screen-xl mx-auto">
        <h2 className="text-4xl font-medium text-black font-inter mb-12">
          Featured Categories
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-w-6xl">
          {categories.map((category, index) => (
            <div
              key={category.id || index}
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => handleCategoryClick(category.name)}
            >
              {/* Image Container with enhanced styling */}
              <div className="w-60 h-60 overflow-hidden rounded-2xl shadow-lg transform group-hover:scale-105 group-hover:shadow-xl transition-all duration-300">
                <img
                  src={category.imageUrl || (category.name === "Automotive Services" ? AutomotiveLogo : DefenceLogo)}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Enhanced Text Content */}
              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-black font-inter">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 font-inter leading-relaxed max-w-48">
                  {category.name === "Automotive Services"

                  }
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
