import { useNavigate } from "react-router-dom";
import DefenceLogo from "../assets/Defence.png";
import AutomotiveLogo from "../assets/Automotive_Services.png";

const FeaturedCategories = () => {
  const navigate = useNavigate();

  const categories = [
    { name: "Automotive Services", image: AutomotiveLogo },
    { name: "Defence", image: DefenceLogo },
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-w-6xl">
          {categories.map((category, index) => (
            <div
              key={index}
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => handleCategoryClick(category.name)}
            >
              {/* Image Container with enhanced styling */}
              <div className="w-70 h-70 mb-3 flex items-center justify-center bg-white rounded-2xl shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 p-6">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-60 h-60 object-contain"
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
