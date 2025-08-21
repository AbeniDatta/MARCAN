import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, X } from "lucide-react";
import { categoryApi, Category } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface AddCategoryProps {
    onCategoryAdded: () => void;
}

const AddCategory = ({ onCategoryAdded }: AddCategoryProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        isFeatured: false,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const { toast } = useToast();

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const uploadImageToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        const data = await response.json();
        return data.secure_url;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast({
                title: "Error",
                description: "Category name is required",
                variant: "destructive",
            });
            return;
        }

        if (formData.isFeatured && !imageFile) {
            toast({
                title: "Error",
                description: "Image is required for featured categories",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            let imageUrl = formData.imageUrl;

            // Upload image if a file was selected
            if (imageFile) {
                imageUrl = await uploadImageToCloudinary(imageFile);
            }

            await categoryApi.createCategory({
                name: formData.name.trim(),
                imageUrl: imageUrl || undefined,
                isFeatured: formData.isFeatured,
            });

            toast({
                title: "Success",
                description: "Category created successfully",
            });

            // Reset form
            setFormData({
                name: "",
                isFeatured: false,
            });
            setImageFile(null);
            setImagePreview(null);
            setIsDragOver(false);
            setIsOpen(false);
            onCategoryAdded();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create category",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: "",
            isFeatured: false,
        });
        setImageFile(null);
        setImagePreview(null);
        setIsDragOver(false);
        setIsOpen(false);
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="w-full h-12 text-base border-2 border-dashed border-gray-300 hover:border-gray-400 bg-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                variant="outline"
            >
                <Plus className="w-5 h-5 mr-2" />
                Add New Category
            </Button>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    Add New Category
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </CardTitle>
                <CardDescription>
                    Create a new category for the marketplace. Featured categories will appear on the homepage.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Category Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter category name"
                            required
                        />
                    </div>

                    {formData.isFeatured && (
                        <div className="space-y-2">
                            <Label htmlFor="imageFile">Category Image (Required for Featured Categories)</Label>
                            <div className="space-y-4">
                                {imagePreview ? (
                                    <div className="relative">
                                        <div
                                            className="w-[173px] h-[139px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#DB1233] transition-colors overflow-hidden relative"
                                            onClick={() => document.getElementById('imageFile')?.click()}
                                        >
                                            <img
                                                src={imagePreview}
                                                alt="Category Preview"
                                                className="w-full h-full object-contain"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <span className="text-white font-semibold text-sm">Change image</span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setImageFile(null);
                                                setImagePreview(null);
                                            }}
                                            className="mt-2 text-red-500 hover:text-red-700 text-sm"
                                        >
                                            Remove image
                                        </button>
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
                                        onClick={() => document.getElementById('imageFile')?.click()}
                                    >
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-600 mb-2">Drag and drop an image here, or click to browse</p>
                                        <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                                    </div>
                                )}
                                <Input
                                    id="imageFile"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="isFeatured"
                            checked={formData.isFeatured}
                            onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                        />
                        <Label htmlFor="isFeatured">Featured Category</Label>
                    </div>

                    {formData.isFeatured && (
                        <div className="p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-700">
                                Featured categories appear on the homepage and require an image.
                            </p>
                        </div>
                    )}

                    <div className="flex space-x-2 pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1"
                        >
                            {loading ? "Creating..." : "Create Category"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default AddCategory;
