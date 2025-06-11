import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const FiltersSidebar = () => {
  const categoryOptions = ["Metal Fabrication", "Tools & Die"];

  const tagOptions = ["Export-ready", "Eco-certified"];

  const capacityOptions = ["Available now", "Limited"];

  return (
    <aside className="bg-white border border-[#7A7777] p-6 w-48 h-fit rounded-lg">
      <h3 className="text-3xl font-bold text-black font-inter mb-8">Filters</h3>

      {/* Category Section */}
      <div className="mb-8">
        <h4 className="text-xl font-semibold text-black font-inter mb-4">
          Category
        </h4>
        <div className="space-y-3">
          {categoryOptions.map((option, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Checkbox
                id={`category-${index}`}
                className="w-[18px] h-[13px] border border-[#CBCACA] rounded-sm"
              />
              <label
                htmlFor={`category-${index}`}
                className="text-base font-semibold text-black font-inter cursor-pointer"
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Location Section */}
      <div className="mb-8">
        <h4 className="text-xl font-semibold text-black font-inter mb-4">
          Location
        </h4>
        <Input
          className="w-36 h-8 border border-[#CBCACA] rounded text-sm"
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
                className="w-[18px] h-[13px] border border-[#CBCACA] rounded-sm"
              />
              <label
                htmlFor={`tag-${index}`}
                className="text-base font-semibold text-black font-inter cursor-pointer"
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
                className="w-[18px] h-[13px] border border-[#CBCACA] rounded-sm"
              />
              <label
                htmlFor={`capacity-${index}`}
                className="text-base font-semibold text-black font-inter cursor-pointer"
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
