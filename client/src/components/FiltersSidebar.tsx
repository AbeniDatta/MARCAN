import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { listingApi } from "@/services/api";

interface FiltersSidebarProps {
  filters: {
    tags: string[];
    location: string;
    capacity: string[];
  };
  onFilterChange: (updated: FiltersSidebarProps["filters"]) => void;
}

const FiltersSidebar: React.FC<FiltersSidebarProps> = ({ filters, onFilterChange }) => {
  const [tagOptions, setTagOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const { tags } = await listingApi.getFilterOptions();
        setTagOptions(tags);
      } catch (error) {
        console.error("Failed to fetch filter options", error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleCheckboxChange = (type: "tags", value: string) => {
    const current = filters[type];
    const updated = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [type]: updated });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, location: e.target.value });
  };

  return (
    <aside className="bg-white border border-[#DB1233] p-6 w-full md:w-48 rounded-lg">
      <h3 className="text-3xl font-bold text-black font-inter mb-8">Filters</h3>

      <div className="mb-8">
        <h4 className="text-xl font-semibold text-black mb-4">Location</h4>
        <Input
          className="w-full"
          value={filters.location}
          onChange={handleLocationChange}
          placeholder="Enter location"
        />
      </div>

      <div className="mb-8">
        <h4 className="text-xl font-semibold text-black mb-4">Tags</h4>
        <div className="space-y-3">
          {tagOptions.map((option, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Checkbox
                checked={filters.tags.includes(option)}
                onCheckedChange={() => handleCheckboxChange("tags", option)}
                id={`tag-${index}`}
              />
              <label htmlFor={`tag-${index}`} className="text-base cursor-pointer">
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
