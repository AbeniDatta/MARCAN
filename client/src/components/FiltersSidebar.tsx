import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const FiltersSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const categoryOptions = [
    "Metal Fabrication",
    "Tools & Die",
    "Machining",
    "Welding",
    "CNC Services",
    "Sheet Metal",
    "Custom Manufacturing",
    "Assembly",
    "Quality Control",
    "Engineering Services"
  ];

  const tagOptions = ["Export-ready", "Eco-certified"];

  const capacityOptions = ["Available now", "Limited"];

  // Get visible categories based on expanded state
  const visibleCategories = isExpanded
    ? categoryOptions
    : categoryOptions.slice(0, 3);

  return (
    <aside className="bg-white border border-[#DB1233] p-6 w-48 h-fit rounded-lg">
      <h3 className="text-3xl font-bold text-black font-inter mb-8">Filters</h3>

      {/* Category Section */}
      <div className="mb-8">
        <h4 className="text-xl font-semibold text-black font-inter mb-4">
          Category
        </h4>
        <div className="space-y-3">
          {visibleCategories.map((option, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Checkbox
                id={`category-${index}`}
                className="w-[18px] h-[18px] border border-[#CBCACA] rounded-sm"
              />
              <label
                htmlFor={`category-${index}`}
                className="text-base text-black font-inter cursor-pointer"
              >
                {option}
              </label>
            </div>
          ))}

          {/* Expand/Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#DB1233] font-semibold text-center text-sm hover:underline focus:outline-none"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        </div>
      </div>

      {/* Location Section */}
      <div className="mb-8">
        <h4 className="text-xl font-semibold text-black font-inter mb-4">
          Location
        </h4>
        <Input
          className="w-36 h-10 border border-[#CBCACA] rounded text-sm"
          placeholder="Enter location"
        />
      </div>

      {/* Tags Section */}
      <div className="mb-8">
        <h4 className="text-xl font-semibold text-black font-inter mb-4">
          Tags
        </h4>
        <div className="space-y-3">
          {tagOptions.map((option, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Checkbox
                id={`tag-${index}`}
                className="w-[18px] h-[18px] border border-[#CBCACA] rounded-sm"
              />
              <label
                htmlFor={`tag-${index}`}
                className="text-base text-black font-inter cursor-pointer"
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Capacity Section */}
      <div>
        <h4 className="text-xl font-semibold text-black font-inter mb-4">
          Capacity
        </h4>
        <div className="space-y-3">
          {capacityOptions.map((option, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Checkbox
                id={`capacity-${index}`}
                className="w-[18px] h-[18px] border border-[#CBCACA] rounded-sm"
              />
              <label
                htmlFor={`capacity-${index}`}
                className="text-base text-black font-inter cursor-pointer"
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default FiltersSidebar;
