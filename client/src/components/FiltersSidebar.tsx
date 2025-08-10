import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useState } from "react";
import { listingApi } from "@/services/api";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FiltersSidebarProps {
  filters: {
    categories: string[];
    tags: string[];
    location: string[];
    capacity: string[];
    sortBy: string;
  };
  onFilterChange: (updated: FiltersSidebarProps["filters"]) => void;
}

const FiltersSidebar: React.FC<FiltersSidebarProps> = ({ filters, onFilterChange }) => {
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const sortOptions = [
    { value: "new-to-old", label: "New to Old" },
    { value: "old-to-new", label: "Old to New" }
  ];

  console.log('Sort options defined:', sortOptions);
  console.log('Current filters.sortBy:', filters.sortBy);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const { tags, locations } = await listingApi.getFilterOptions();
        setTagOptions(tags);
        setLocationOptions(locations);
        const allCategories = [
          "Metal Fabrication",
          "Tool & Die",
          "Injection Molding",
          "Precision Machining",
          "Industrial Casting",
          "Consumer Products",
          "Assemblies",
          "Automotive Services",
          "Defence",
        ];
        setCategoryOptions(allCategories);
      } catch (error) {
        console.error("Failed to fetch filter options", error);
      }
    };

    fetchFilterOptions();
  }, []);

  const handleCategoryChange = (value: string) => {
    console.log('Category change detected:', value);
    const current = filters.categories;
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, categories: updated });
  };

  const handleTagChange = (value: string) => {
    const current = filters.tags;
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, tags: updated });
  };

  const removeCategory = (categoryToRemove: string) => {
    const updated = filters.categories.filter((category) => category !== categoryToRemove);
    onFilterChange({ ...filters, categories: updated });
  };

  const removeTag = (tagToRemove: string) => {
    const updated = filters.tags.filter((tag) => tag !== tagToRemove);
    onFilterChange({ ...filters, tags: updated });
  };

  const handleLocationChange = (value: string) => {
    console.log('Location change detected:', value);
    const current = filters.location;
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, location: updated });
  };

  const handleSortChange = (value: string) => {
    console.log('=== SORT CHANGE TRIGGERED ===');
    console.log('Sort change detected:', value);
    console.log('Current filters:', filters);
    console.log('Calling onFilterChange with:', { ...filters, sortBy: value });
    onFilterChange({ ...filters, sortBy: value });
    console.log('=== SORT CHANGE COMPLETED ===');
  };

  const removeLocation = (locationToRemove: string) => {
    const updated = filters.location.filter((location) => location !== locationToRemove);
    onFilterChange({ ...filters, location: updated });
  };

  return (
    <aside className="bg-white border border-[#DB1233] p-6 w-full md:w-48 rounded-lg">
      <h3 className="text-3xl font-bold text-black font-inter mb-8">Filters & Sort</h3>

      <div className="mb-8">
        <h4 className="text-xl font-semibold text-black mb-4">Sort By</h4>
        <Select
          value={filters.sortBy || "new-to-old"}
          onValueChange={(value) => {
            console.log('=== SELECT ONVALUECHANGE TRIGGERED ===');
            console.log('Select value changed to:', value);
            handleSortChange(value);
          }}
        >
          <SelectTrigger className="w-full justify-between text-left border border-input bg-background hover:bg-accent hover:text-accent-foreground">
            <SelectValue
              placeholder="Select sort order"
              className="truncate text-gray-500"
            />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mb-8">
        <h4 className="text-xl font-semibold text-black mb-4">Categories</h4>
        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={categoryOpen}
              className="w-full justify-between text-left"
            >
              <span className={cn("truncate", filters.categories.length === 0 ? "text-gray-500" : "")}>
                {filters.categories.length === 0
                  ? "Select categories..."
                  : `${filters.categories.length} selected`}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search categories..." />
              <CommandList>
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandGroup>
                  {categoryOptions.map((option) => (
                    <CommandItem
                      key={option}
                      onSelect={() => handleCategoryChange(option)}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        checked={filters.categories.includes(option)}
                        className="mr-2"
                      />
                      <span>{option}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Selected Categories */}
        {filters.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.categories.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {category}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeCategory(category)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h4 className="text-xl font-semibold text-black mb-4">Location</h4>
        <Popover open={locationOpen} onOpenChange={setLocationOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={locationOpen}
              className="w-full justify-between text-left"
            >
              <span className={cn("truncate", filters.location.length === 0 ? "text-gray-500" : "")}>
                {filters.location.length === 0
                  ? "Select locations..."
                  : `${filters.location.length} selected`}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search locations..." />
              <CommandList>
                <CommandEmpty>No location found.</CommandEmpty>
                <CommandGroup>
                  {locationOptions.map((option) => (
                    <CommandItem
                      key={option}
                      onSelect={() => handleLocationChange(option)}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        checked={filters.location.includes(option)}
                        className="mr-2"
                      />
                      <span>{option}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Selected Locations */}
        {filters.location.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.location.map((location) => (
              <Badge
                key={location}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {location}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeLocation(location)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h4 className="text-xl font-semibold text-black mb-4">Tags</h4>
        <Popover open={tagOpen} onOpenChange={setTagOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={tagOpen}
              className="w-full justify-between text-left"
            >
              <span className={cn("truncate", filters.tags.length === 0 ? "text-gray-500" : "")}>
                {filters.tags.length === 0
                  ? "Select tags..."
                  : `${filters.tags.length} selected`}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandList>
                <CommandEmpty>No tag found.</CommandEmpty>
                <CommandGroup>
                  {tagOptions.map((option) => (
                    <CommandItem
                      key={option}
                      onSelect={() => handleTagChange(option)}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        checked={filters.tags.includes(option)}
                        className="mr-2"
                      />
                      <span>{option}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Selected Tags */}
        {filters.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default FiltersSidebar;
