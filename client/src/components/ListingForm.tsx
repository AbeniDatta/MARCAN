import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { api } from "@/services/api";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { auth } from '@/firebase';
import { listingApi, Listing, ListingInput, categoryApi } from '@/services/api';
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
    fileUpload: File | null;
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

// Categories will be fetched from the database
const CATEGORIES: string[] = [];

// Predefined tags
const PREDEFINED_TAGS = [
    "ISO 9001",
    "ISO 14001",
    "AS9100",
    "IATF 16949",
    "CSA Certified",
    "RoHS Compliant",
    "CE Marking",
    "UL Listed",
    "ITAR Registered",
    "NIST 800-171",
    "Custom Design",
];

const MAX_FILE_MB = 20;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const ALLOWED_EXT = new Set(["pdf", "doc", "docx", "xls", "xlsx"]);

const isAllowed = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    return ALLOWED_EXT.has(ext);
};

const ListingForm: React.FC<ListingFormProps> = ({ initialData, onSubmit, onSaveDraft, onCancel, draftCount = 0 }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [tagInput, setTagInput] = useState('');
    const [showOtherTagInput, setShowOtherTagInput] = useState(false);
    const [otherTagInput, setOtherTagInput] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isFileDragOver, setIsFileDragOver] = useState(false);
    const [fileUploadName, setFileUploadName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fileUploadRef = useRef<HTMLInputElement>(null);
    const [manualCity, setManualCity] = useState("");
    const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    const [formData, setFormData] = useState<ListingFormData>({
        title: initialData?.title || '',
        description: initialData?.description || '',
        price: initialData?.price?.toString() || '',
        imageFile: null,
        fileUpload: null,
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

    // Fetch categories from database
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoryApi.getAllCategories();
                setCategories(data.map(cat => cat.name));
            } catch (error) {
                console.error('Error fetching categories:', error);
                // Fallback to hardcoded categories if API fails
                setCategories([
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
                ]);
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchCategories();
    }, []);

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

    const uploadFileToServer = async (file: File, listingId: string): Promise<string> => {
        const form = new FormData();
        form.append("file", file);
        form.append("listingId", listingId);

        // use the shared axios instance so baseURL + auth token apply
        const { data } = await api.post("/files/upload", form, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return data.fileUrl; // server returns public URL
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Check if this is a draft being published
        const isPublishingDraft = initialData?.id && initialData?.isDraft;

        // Validation - different requirements for new listings vs publishing drafts
        if (!formData.title.trim()) {
            setError('Product title is required.');
            return;
        }

        // For new listings, require all fields
        if (!isPublishingDraft) {
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
            // Check if tags are selected OR if "Other" is selected with custom tag filled
            const hasValidTags = formData.tags.length > 0 || (showOtherTagInput && otherTagInput.trim());
            if (!hasValidTags) {
                setError('Please select at least one tag.');
                return;
            }
        } else {
            // For publishing drafts, only require essential fields
            if (!formData.description.trim()) {
                setError('Description is required to publish.');
                return;
            }
            if (!formData.price.trim() || isNaN(Number(formData.price))) {
                setError('A valid price is required to publish.');
                return;
            }
            // Image, city, categories, and tags are optional when publishing drafts
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

            let fileUrl = initialData?.fileUrl || "";
            if (formData.fileUpload) {
                const idForUpload = String(initialData?.id ?? "new");
                fileUrl = await uploadFileToServer(formData.fileUpload, idForUpload);
            }
            // Include custom tag if "Other" is selected and filled
            const finalTags = showOtherTagInput && otherTagInput.trim()
                ? [...formData.tags, otherTagInput.trim()]
                : formData.tags;

            const listingData: ListingInput = {
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price) || 0,
                imageUrl,
                fileUrl,
                tags: finalTags,
                categories: formData.categories,
                city: manualCity.trim() ? manualCity : formData.city
            };

            console.log('=== FRONTEND SUBMISSION ===');
            console.log('Initial data:', initialData);
            console.log('Form data:', formData);
            console.log('Listing data being sent:', listingData);

            let result;
            if (initialData?.id) {
                console.log('Updating listing with ID:', initialData.id);
                // If this is a draft being published, set isDraft to false
                const updateData = isPublishingDraft
                    ? { ...listingData, isDraft: false }
                    : listingData;
                result = await listingApi.updateListing(initialData.id, updateData);
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
        // No validation required for drafts - all fields are optional
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

            let fileUrl = initialData?.fileUrl || "";
            if (formData.fileUpload) {
                const idForUpload = String(initialData?.id ?? "new");
                fileUrl = await uploadFileToServer(formData.fileUpload, idForUpload);
            }

            // Include custom tag if "Other" is selected and filled
            const finalTags = showOtherTagInput && otherTagInput.trim()
                ? [...formData.tags, otherTagInput.trim()]
                : formData.tags;

            const listingData: ListingInput = {
                title: formData.title || '',
                description: formData.description || '',
                price: parseFloat(formData.price) || 0,
                imageUrl,
                fileUrl,
                tags: finalTags,
                categories: formData.categories,
                city: manualCity.trim() ? manualCity : formData.city || ''
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

    const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!isAllowed(file)) return setError("Please upload PDF, DOC, DOCX, XLS, or XLSX");
        if (file.size > MAX_FILE_BYTES) return setError(`File is too large. Max ${MAX_FILE_MB}MB`);
        setFormData(prev => ({ ...prev, fileUpload: file }));
        setFileUploadName(file.name);
    };
    const removeFileUpload = () => {
        setFormData(prev => ({ ...prev, fileUpload: null }));
        setFileUploadName('');
        if (fileUploadRef.current) {
            fileUploadRef.current.value = '';
        }
    };

    const handleFileDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsFileDragOver(true);
    };

    const handleFileDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsFileDragOver(false);
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsFileDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        if (!isAllowed(file)) return setError("Please upload PDF, DOC, DOCX, XLS, or XLSX");
        if (file.size > MAX_FILE_BYTES) return setError(`File is too large. Max ${MAX_FILE_MB}MB`);
        setFormData(prev => ({ ...prev, fileUpload: file }));
        setFileUploadName(file.name);
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
                <label className="text-lg font-semibold">Additional Files (Optional)</label>
                <div className="space-y-4">
                    {fileUploadName ? (
                        <div className="relative">
                            <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-between bg-gray-50">
                                <div className="flex items-center space-x-3">
                                    <Upload className="w-6 h-6 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">{fileUploadName}</p>
                                        <p className="text-xs text-gray-500">File uploaded successfully</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={removeFileUpload}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${isFileDragOver
                                ? 'border-[#DB1233] bg-red-50'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                            onDragOver={handleFileDragOver}
                            onDragLeave={handleFileDragLeave}
                            onDrop={handleFileDrop}
                            onClick={() => fileUploadRef.current?.click()}
                        >
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
                            <p className="text-sm text-gray-500">PDF, DOC, DOCX, XLS, XLSX up to 10MB</p>
                        </div>
                    )}
                    <Input
                        ref={fileUploadRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        onChange={handleFileUploadChange}
                        className="hidden"
                        id="file-upload"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-lg font-semibold">Short Description</label>
                <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter a brief description of your product (max 221 characters)"
                    required
                    maxLength={221}
                    className="w-full min-h-[100px]"
                />
                <div className="text-sm text-gray-500 text-right">
                    {formData.description.length}/221 characters
                </div>
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
                {categoriesLoading ? (
                    <p className="text-gray-500">Loading categories...</p>
                ) : (
                    <Select onValueChange={handleCategoryChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
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
                {initialData?.id && initialData?.isDraft && onSaveDraft && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveDraft}
                        disabled={loading}
                        className="flex-1 border border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                        {loading ? 'Saving...' : 'Update Draft'}
                    </Button>
                )}
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
                    {loading ? 'Saving...' :
                        initialData?.id && initialData?.isDraft ? 'Publish' :
                            initialData?.id ? 'Update Listing' : 'Create Listing'
                    }
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