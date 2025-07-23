import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { auth } from '@/firebase';
import { listingApi, Listing, ListingInput } from '@/services/api';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Upload, X, Plus } from 'lucide-react';
import { CANADIAN_CITIES } from "@/lib/canadianCities";
import {
    Command,
    CommandInput,
    CommandList,
    CommandItem,
    CommandEmpty,
} from "@/components/ui/command";

interface ListingFormData {
    title: string;
    description: string;
    price: string;
    imageFile: File | null;
    tags: string[];
    categories: string[];
    city: string;
}

interface ListingFormProps {
    initialData?: Partial<Listing>;
    onSubmit: (listing: Listing) => void;
    onSaveDraft?: (listing: Listing) => void;
    onCancel?: () => void;
    draftCount?: number;
}

// Categories from the main search page
const CATEGORIES = [
    "Metal Fabrication",
    "Tool & Die",
    "Injection Molding",
    "Precision Machining",
    "Industrial Casting",
    "Consumer Products",
    "Assemblies",
    "Lighting & Fixtures",
    "Automotive Services",
    "Defence"
];

// Predefined tags
const PREDEFINED_TAGS = [
    "Export Ready",
    "In Stock",
    "Custom Design",
    "Bulk Orders",
    "Fast Delivery",
    "Quality Assured",
    "Certified",
    "Eco-Friendly",
    "Made in Canada"
];

const ListingForm: React.FC<ListingFormProps> = ({ initialData, onSubmit, onSaveDraft, onCancel, draftCount = 0 }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [tagInput, setTagInput] = useState('');
    const [showOtherTagInput, setShowOtherTagInput] = useState(false);
    const [otherTagInput, setOtherTagInput] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [manualCity, setManualCity] = useState("");
    const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

    const [formData, setFormData] = useState<ListingFormData>({
        title: initialData?.title || '',
        description: initialData?.description || '',
        price: initialData?.price?.toString() || '',
        imageFile: null,
        tags: initialData?.tags || [],
        categories: initialData?.categories || [],
        city: initialData?.city || ''
    });

    // Close city dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('[data-command-wrapper]')) {
                setCityDropdownOpen(false);
            }
        };

        if (cityDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [cityDropdownOpen]);

    const uploadImageToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

        const response = await axios.post(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            formData
        );

        return response.data.secure_url;
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation for all required fields
        if (!formData.title.trim()) {
            setError('Product title is required.');
            return;
        }
        if (!imagePreview && !formData.imageFile) {
            setError('Product image is required.');
            return;
        }
        if (!formData.description.trim()) {
            setError('Description is required.');
            return;
        }
        if (!formData.price.trim() || isNaN(Number(formData.price))) {
            setError('A valid price is required.');
            return;
        }
        if (!manualCity.trim() && !formData.city.trim()) {
            setError('Please select a city or enter one manually.');
            return;
        }
        if (formData.categories.length === 0) {
            setError('Please select at least one category.');
            return;
        }
        if (formData.tags.length === 0) {
            setError('Please select at least one tag.');
            return;
        }

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('You must be logged in to create a listing');
            }
            const token = await user.getIdToken();
            let imageUrl = initialData?.imageUrl || '';
            if (formData.imageFile) {
                imageUrl = await uploadImageToCloudinary(formData.imageFile);
            }
            const listingData: ListingInput = {
                ...formData,
                price: parseFloat(formData.price) || 0,
                imageUrl,
                city: manualCity.trim() ? manualCity : formData.city
            };
            let result;
            if (initialData?.id) {
                result = await listingApi.updateListing(initialData.id, listingData);
            } else {
                result = await listingApi.createListing(listingData);
            }
            onSubmit(result);
        } catch (err: any) {
            setError(err.message || 'Failed to submit listing');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDraft = async () => {
        setLoading(true);
        setError('');
        // Validation for all required fields (except draft count logic)
        if (!formData.title.trim()) {
            setError('Product title is required.');
            setLoading(false);
            return;
        }
        if (!imagePreview && !formData.imageFile) {
            setError('Product image is required.');
            setLoading(false);
            return;
        }
        if (!formData.description.trim()) {
            setError('Description is required.');
            setLoading(false);
            return;
        }
        if (!formData.price.trim() || isNaN(Number(formData.price))) {
            setError('A valid price is required.');
            setLoading(false);
            return;
        }
        if (!manualCity.trim() && !formData.city.trim()) {
            setError('Please select a city or enter one manually.');
            setLoading(false);
            return;
        }
        if (formData.categories.length === 0) {
            setError('Please select at least one category.');
            setLoading(false);
            return;
        }
        if (formData.tags.length === 0) {
            setError('Please select at least one tag.');
            setLoading(false);
            return;
        }
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('You must be logged in to save a draft');
            }
            if (!initialData?.id && draftCount >= 10) {
                throw new Error('You have reached the maximum limit of 10 drafts. Please delete some drafts before creating new ones.');
            }
            let imageUrl = initialData?.imageUrl || '';
            if (formData.imageFile) {
                imageUrl = await uploadImageToCloudinary(formData.imageFile);
            }
            const listingData: ListingInput = {
                ...formData,
                price: parseFloat(formData.price) || 0,
                imageUrl,
                city: manualCity.trim() ? manualCity : formData.city
            };
            let result;
            if (initialData?.id) {
                result = await listingApi.updateListing(initialData.id, { ...listingData, isDraft: true });
            } else {
                result = await listingApi.saveDraft(listingData);
            }
            if (onSaveDraft) {
                onSaveDraft(result);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to save draft');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                imageFile: file
            }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                setFormData(prev => ({
                    ...prev,
                    imageFile: file
                }));
                setImagePreview(URL.createObjectURL(file));
            }
        }
    }, []);

    const removeImage = () => {
        setFormData(prev => ({
            ...prev,
            imageFile: null
        }));
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCategoryChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.includes(value)
                ? prev.categories.filter(c => c !== value)
                : [...prev.categories, value]
        }));
    };

    const handleTagSelect = (tag: string) => {
        if (tag === 'Other') {
            if (formData.tags.length >= 3) {
                setError('You can only select up to 3 tags');
                return;
            }
            setShowOtherTagInput(true);
            return;
        }

        if (formData.tags.includes(tag)) {
            // Remove tag if already selected
            setFormData(prev => ({
                ...prev,
                tags: prev.tags.filter(t => t !== tag)
            }));
        } else {
            // Add tag if under limit
            if (formData.tags.length >= 3) {
                setError('You can only select up to 3 tags. Please remove one before adding another.');
                return;
            }
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, tag]
            }));
        }
        setError(''); // Clear any previous error
    };

    const handleOtherTagSubmit = () => {
        if (formData.tags.length >= 3) {
            setError('You can only select up to 3 tags. Please remove one before adding another.');
            return;
        }

        if (otherTagInput.trim() && !formData.tags.includes(otherTagInput.trim())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, otherTagInput.trim()]
            }));
            setOtherTagInput('');
            setShowOtherTagInput(false);
            setError(''); // Clear any previous error
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
        setError(''); // Clear any error when removing tags
    };

    const removeCategory = (categoryToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.filter(cat => cat !== categoryToRemove)
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6">
            {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <label className="text-lg font-semibold">Product Title</label>
                <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter product title"
                    required
                    className="w-full"
                />
            </div>

            <div className="space-y-2">
                <label className="text-lg font-semibold">Product Image</label>
                <div className="space-y-4">
                    {imagePreview ? (
                        <div className="relative">
                            <div
                                className="w-[173px] h-[139px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#DB1233] transition-colors overflow-hidden relative"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <img
                                    src={imagePreview}
                                    alt="Product Preview"
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <span className="text-white font-semibold text-sm">Change image</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isDragOver
                                ? 'border-[#DB1233] bg-red-50'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600 mb-2">Drag and drop an image here, or click to browse</p>
                            <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                    )}
                    <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-lg font-semibold">Short Description</label>
                <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter a brief description of your product"
                    required
                    className="w-full min-h-[100px]"
                />
            </div>

            <div className="space-y-2">
                <label className="text-lg font-semibold">Price (CAD)</label>
                <Input
                    name="price"
                    type="text"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Enter price in CAD"
                    required
                    className="w-full"
                />
            </div>

            <div className="space-y-2">
                <label className="text-lg font-semibold">City</label>
                {/* Autocomplete city input */}
                <Command className="border border-input rounded-md bg-background" data-command-wrapper>
                    <CommandInput
                        placeholder="Start typing a city name..."
                        value={formData.city}
                        onValueChange={(value) => {
                            setFormData((prev) => ({ ...prev, city: value }));
                            setCityDropdownOpen(true);
                        }}
                        onFocus={() => setCityDropdownOpen(true)}
                    />
                    {cityDropdownOpen && formData.city && (
                        <CommandList>
                            <CommandEmpty>No cities found.</CommandEmpty>
                            {CANADIAN_CITIES.filter(city =>
                                city.toLowerCase().includes(formData.city.toLowerCase())
                            ).map(city => (
                                <CommandItem
                                    key={city}
                                    value={city}
                                    onSelect={() => {
                                        setFormData((prev) => ({ ...prev, city }));
                                        setCityDropdownOpen(false);
                                    }}
                                >
                                    {city}
                                </CommandItem>
                            ))}
                        </CommandList>
                    )}
                </Command>
                <div className="mt-2">
                    <label className="block text-sm text-gray-600 mb-1">If your city is not in the list, enter it here:</label>
                    <Input
                        name="manual-city"
                        value={manualCity}
                        onChange={e => setManualCity(e.target.value)}
                        placeholder="Enter your city name"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-lg font-semibold">Categories</label>
                <Select onValueChange={handleCategoryChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                                {category}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                    {formData.categories.map((category) => (
                        <div
                            key={category}
                            className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                            {category}
                            <button
                                type="button"
                                onClick={() => removeCategory(category)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-lg font-semibold">Tags (Select up to 3)</label>
                <div className="space-y-4">
                    {/* Predefined tags */}
                    <div className="flex flex-wrap gap-2">
                        {PREDEFINED_TAGS.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => handleTagSelect(tag)}
                                disabled={!formData.tags.includes(tag) && formData.tags.length >= 3}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${formData.tags.includes(tag)
                                    ? 'bg-[#DB1233] text-white'
                                    : formData.tags.length >= 3
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => handleTagSelect('Other')}
                            disabled={!showOtherTagInput && formData.tags.length >= 3}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${showOtherTagInput
                                ? 'bg-[#DB1233] text-white'
                                : formData.tags.length >= 3
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Other
                        </button>
                    </div>

                    {/* Tag limit indicator */}
                    <div className="text-sm text-gray-600">
                        {formData.tags.length}/3 tags selected
                    </div>

                    {/* Custom tag input */}
                    {showOtherTagInput && (
                        <div className="flex gap-2">
                            <Input
                                value={otherTagInput}
                                onChange={(e) => setOtherTagInput(e.target.value)}
                                placeholder="Enter custom tag"
                                className="flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleOtherTagSubmit();
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                onClick={handleOtherTagSubmit}
                                disabled={formData.tags.length >= 3}
                                className="bg-[#DB1233] hover:bg-[#c10e2b] text-white px-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* Selected tags display */}
                    <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                            <div
                                key={tag}
                                className="bg-[#DB1233] text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="text-white hover:text-gray-200"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                {!initialData?.id && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={loading}
                        className="flex-1 border border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                        {loading ? 'Saving...' : 'Save Draft'}
                    </Button>
                )}
                <Button
                    type="submit"
                    className="flex-1 bg-[#DB1233] hover:bg-[#c10e2b] text-white"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : initialData?.id ? 'Update Listing' : 'Create Listing'}
                </Button>
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-100"
                    >
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
};

export default ListingForm; 