import {
  Shield,
  Car,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const FeaturedCategories = () => {
  const navigate = useNavigate();

  const categories = [
    { name: "Automotive Services", icon: Car },
    { name: "Defence", icon: Shield }, // You may need to import a suitable icon from lucide-react
  ];

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/listings?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <section className="bg-[#F9F9F9] px-4 lg:px-20 py-16">
      <div className="max-w-screen-xl mx-auto">
        <h2 className="text-4xl font-medium text-black font-inter mb-12">
          Featured Categories
        </h2>

        <div className="flex flex-col gap-12 max-w-6xl">
          {/* First row - 5 categories */}
          <div className="grid grid-cols-5 gap-x-12">
            {categories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity -mr-1"
                  onClick={() => handleCategoryClick(category.name)}
                >
                  <div className="w-20 h-20 mb-4 flex items-center justify-center">
                    <IconComponent
                      className="w-16 h-16 text-[#DB1233]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="text-center text-base font-medium text-black font-inter leading-tight">
                    {category.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Second row - 4 categories aligned under first 4 */}
          <div className="grid grid-cols-5 gap-x-12">
            {categories.slice(5, 9).map((category, index) => {
              const IconComponent = category.icon;
              return (
                <div
                  key={index + 5}
                  className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity -mr-1"
                  onClick={() => handleCategoryClick(category.name)}
                >
                  <div className="w-20 h-20 mb-4 flex items-center justify-center">
                    <IconComponent
                      className="w-16 h-16 text-[#DB1233]"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="text-center text-base font-medium text-black font-inter leading-tight">
                    {category.name}
                  </span>
                </div>
              );
            })}
            {/* Empty column to maintain grid alignment */}
            <div></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
