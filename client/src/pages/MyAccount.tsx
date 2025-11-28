import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import AddListingCard from "@/components/AddListingCard";
import MyListingCard from "@/components/MyListingCard";
import AddCategory from "@/components/AddCategory";
import { Button } from "@/components/ui/button";
import { listingApi, Listing } from "@/services/api";
import { profileApi, UserProfile, categoryApi, Category, VerificationHistory } from "@/services/api";
import { api } from "@/services/api";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { Eye, EyeOff, Trash2, Star, StarOff, X, Upload } from "lucide-react";

const MyAccount = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [drafts, setDrafts] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showImageOptionsModal, setShowImageOptionsModal] = useState(false);
  const [selectedCategoryForImage, setSelectedCategoryForImage] = useState<Category | null>(null);
  // Restore two-dialog logic: showDeleteDialog for confirmation, showPasswordPrompt for password entry
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyName, setVerifyName] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/login");
      } else {
        // Fetch profile data when user is authenticated
        fetchProfileData(user.uid);
        // Check admin status
        checkAdminStatus(user);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    fetchMyListings();
    fetchMyDrafts();
  }, []);

  const checkAdminStatus = async (user: any) => {
    try {
      console.log("🔍 Checking admin status for user:", user.email);
      const tokenResult = await user.getIdTokenResult(true);
      const adminStatus = tokenResult.claims.admin === true;
      console.log("👤 Admin status:", adminStatus, "Claims:", tokenResult.claims);
      setIsAdmin(adminStatus);

      if (adminStatus) {
        console.log("✅ User is admin, fetching categories...");
        fetchCategories();
      } else {
        console.log("❌ User is not admin, skipping category fetch");
      }
    } catch (err) {
      console.error("❌ Failed to fetch custom claims", err);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log("🔄 Starting to fetch categories...");
      setCategoriesLoading(true);
      const data = await categoryApi.getAllCategories();
      console.log("✅ Categories fetched successfully:", data);
      setCategories(data);
    } catch (err: any) {
      console.error("❌ Failed to fetch categories", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await categoryApi.deleteCategory(categoryId);
      console.log("✅ Category deleted successfully");
      // Refresh the categories list
      fetchCategories();
    } catch (err: any) {
      console.error("❌ Failed to delete category", err);
      alert(`Failed to delete category: ${err.message}`);
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

  const handleToggleFeatured = async (categoryId: number, categoryName: string, currentFeatured: boolean) => {
    const action = currentFeatured ? "remove from featured" : "make featured";

    // If making featured and no image exists, prompt for image
    if (!currentFeatured) {
      const currentCategory = categories.find(cat => cat.id === categoryId);
      if (!currentCategory?.imageUrl) {
        const shouldContinue = confirm(
          `To make "${categoryName}" a featured category, an image is required. Would you like to add an image now?`
        );
        if (shouldContinue && currentCategory) {
          // Open image upload modal
          setSelectedCategory(currentCategory);
          setShowImageModal(true);
          return;
        } else {
          return;
        }
      }
    }

    if (!confirm(`Are you sure you want to ${action} the category "${categoryName}"?`)) {
      return;
    }

    try {
      // Find the current category data
      const currentCategory = categories.find(cat => cat.id === categoryId);
      if (!currentCategory) {
        alert("Category not found");
        return;
      }

      // Update the category with the new featured status
      await categoryApi.updateCategory(categoryId, {
        name: currentCategory.name,
        imageUrl: currentCategory.imageUrl,
        isFeatured: !currentFeatured
      });

      console.log(`✅ Category ${action} successfully`);
      // Refresh the categories list
      fetchCategories();
    } catch (err: any) {
      console.error(`❌ Failed to ${action} category`, err);
      alert(`Failed to ${action} category: ${err.message}`);
    }
  };

  const handleImageUploadAndMakeFeatured = async () => {
    if (!selectedCategory || !imageFile) {
      alert("Please select an image first");
      return;
    }

    try {
      // Upload image to Cloudinary
      const imageUrl = await uploadImageToCloudinary(imageFile);

      // Update category with image and make it featured
      await categoryApi.updateCategory(selectedCategory.id, {
        name: selectedCategory.name,
        imageUrl: imageUrl,
        isFeatured: true
      });

      console.log("✅ Category updated with image and made featured successfully");

      // Close modal and refresh categories
      setShowImageModal(false);
      setSelectedCategory(null);
      setImageFile(null);
      setImagePreview(null);
      setIsDragOver(false);
      fetchCategories();
    } catch (err: any) {
      console.error("❌ Failed to upload image and update category", err);
      alert(`Failed to upload image and update category: ${err.message}`);
    }
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedCategory(null);
    setImageFile(null);
    setImagePreview(null);
    setIsDragOver(false);
  };

  const handleImageOptions = (category: Category) => {
    setSelectedCategoryForImage(category);
    setShowImageOptionsModal(true);
  };

  const handleRemoveImage = async () => {
    if (!selectedCategoryForImage) return;

    if (!confirm(`Are you sure you want to remove the image from "${selectedCategoryForImage.name}"?`)) {
      return;
    }

    try {
      await categoryApi.updateCategory(selectedCategoryForImage.id, {
        name: selectedCategoryForImage.name,
        imageUrl: null,
        isFeatured: selectedCategoryForImage.isFeatured
      });

      console.log("✅ Image removed successfully");
      setShowImageOptionsModal(false);
      setSelectedCategoryForImage(null);
      fetchCategories();
    } catch (err: any) {
      console.error("❌ Failed to remove image", err);
      alert(`Failed to remove image: ${err.message}`);
    }
  };

  const handleChangeImage = () => {
    if (!selectedCategoryForImage) return;

    // Close the options modal and open the image upload modal
    setShowImageOptionsModal(false);
    setSelectedCategory(selectedCategoryForImage);
    setShowImageModal(true);
  };

  const handleCloseImageOptionsModal = () => {
    setShowImageOptionsModal(false);
    setSelectedCategoryForImage(null);
  };

  const fetchVerificationHistory = async () => {
    try {
      setHistoryLoading(true);
      const history = await profileApi.getVerificationHistory();
      setVerificationHistory(history);
    } catch (err: any) {
      console.error("Failed to fetch verification history", err);
      // Don't show error to user, just log it
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchProfileData = async (firebaseUid: string) => {
    try {
      setProfileLoading(true);
      console.log('Fetching profile for Firebase UID:', firebaseUid);
      const data = await profileApi.getUserProfile(firebaseUid);
      console.log('Profile data received:', data);
      setProfileData(data);

      // Fetch verification history for corporate accounts
      if (data.accountType === 'corporate') {
        fetchVerificationHistory().catch(err => {
          console.error("Error fetching verification history:", err);
          // Don't break the page if history fetch fails
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch profile data", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      // If profile doesn't exist, create a default one
      if (err.message.includes('User not found') || err.response?.status === 404) {
        console.log('Creating default profile display');
        const defaultProfile: UserProfile = {
          id: 0,
          name: auth.currentUser?.email?.split('@')[0] || 'User',
          email: auth.currentUser?.email || '',
          firebaseUid: firebaseUid,
          companyName: 'Company Name Not Set',
          address1: 'Address Not Set',
          city: 'City Not Set',
          province: 'Province Not Set',
          postalCode: 'Postal Code Not Set',
          website: '',
          phone: 'Phone Not Set',
          description: 'Description Not Set',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfileData(defaultProfile);
      } else {
        // For other errors, still show a default profile but log the error
        console.log('Showing default profile due to error');
        const defaultProfile: UserProfile = {
          id: 0,
          name: auth.currentUser?.email?.split('@')[0] || 'User',
          email: auth.currentUser?.email || '',
          firebaseUid: firebaseUid,
          companyName: 'Error Loading Profile',
          address1: 'Error Loading Profile',
          city: 'Error Loading Profile',
          province: 'Error Loading Profile',
          postalCode: 'Error Loading Profile',
          website: '',
          phone: 'Error Loading Profile',
          description: 'Error Loading Profile',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfileData(defaultProfile);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const data = await listingApi.getMyListings();
      setListings(data);
    } catch (err: any) {
      console.error("Failed to fetch my listings", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyDrafts = async () => {
    try {
      setDraftsLoading(true);
      const data = await listingApi.getMyDrafts();
      setDrafts(data);
    } catch (err: any) {
      console.error("Failed to fetch my drafts", err);
    } finally {
      setDraftsLoading(false);
    }
  };

  // Format address for display
  const formatAddress = () => {
    if (!profileData) return '';

    const parts = [
      profileData.address1,
      profileData.address2,
      profileData.city,
      profileData.province?.toUpperCase(),
      profileData.postalCode
    ].filter(Boolean);

    return parts.join(', ');
  };

  // Handle account verification
  const handleVerifyAccount = async () => {
    if (!verifyName.trim()) {
      setVerifyError('Please enter your name');
      return;
    }

    setVerifyError('');
    setVerifyLoading(true);

    try {
      const updatedProfile = await profileApi.verifyAccount(verifyName.trim());
      setProfileData(updatedProfile);
      setShowVerifyDialog(false);
      setVerifyName('');
      // Refresh verification history
      await fetchVerificationHistory();
    } catch (err: any) {
      console.error('Error verifying account:', err);
      setVerifyError(err.message || 'Failed to verify account. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Format verification date and time
  const formatVerificationInfo = () => {
    if (!profileData?.verifiedAt || !profileData?.verifiedBy) return null;

    const date = new Date(profileData.verifiedAt);
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    if (profileData.isVerified) {
      return `Verified by ${profileData.verifiedBy} on ${formattedDate} at ${formattedTime}`;
    } else {
      return `Unverified by ${profileData.verifiedBy} on ${formattedDate} at ${formattedTime}`;
    }
  };

  // Add this function to handle account deletion
  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleteLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        setDeleteError('No user is currently signed in.');
        setDeleteLoading(false);
        return;
      }

      // Re-authenticate
      await signInWithEmailAndPassword(auth, user.email, password);

      // Delete user from backend database FIRST (while token is still valid)
      try {
        await api.delete('/users/delete');
        console.log('User deleted from database successfully');
      } catch (backendError: any) {
        console.error('Backend deletion error:', backendError);
        // Continue with Firebase deletion even if backend fails
      }

      // Delete user from Firebase Auth AFTER backend deletion
      await deleteUser(user);

      setDeleteLoading(false);
      setShowPasswordPrompt(false);
      setShowDeleteDialog(false);

      // Sign out and redirect
      await auth.signOut();
      navigate('/');
    } catch (err: any) {
      // Firebase error for wrong password is 'auth/wrong-password' or 'auth/invalid-credential'
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setDeleteError('Your password is incorrect.');
        setDeleteLoading(false);
        return;
      }
      if (err.code === 'auth/requires-recent-login') {
        setDeleteError('For security, please sign out, log in again, and then try deleting your account.');
        setDeleteLoading(false);
        return;
      }
      setDeleteError('Failed to delete account. Please try again.');
      setDeleteLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <AuthenticatedHeader />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <AuthenticatedHeader />

      <main className="px-4 lg:px-20 py-8 max-w-screen-xl mx-auto">
        <h1 className="text-[40px] md:text-[50px] font-bold text-black font-inter mb-8">
          My Account
        </h1>

        {/* Account Content */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 w-full">
          <h1 className="text-[36px] font-bold text-black font-inter mb-8">
            My Account
          </h1>

          <div className="space-y-8">
            {/* Profile Section */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Profile Image Placeholder (corporate only) */}
              {profileData?.accountType !== 'individual' && (
                <div className="w-[130px] h-[130px] bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                  {profileData?.logoUrl ? (
                    <img
                      src={profileData.logoUrl}
                      alt="Company Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">No Logo</span>
                  )}
                </div>
              )}

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <h2 className="text-[22px] md:text-[26px] font-bold text-black font-inter">
                  {profileData?.accountType === 'individual' ? (profileData?.name || 'Name Not Set') : (profileData?.companyName || 'Company Name Not Set')}
                </h2>
                <p className="text-[18px] md:text-[22px]] font-semibold text-black font-inter">
                  {formatAddress()}
                </p>
                {profileData?.accountType !== 'individual' && (
                  <p className="text-[16px] md:text-[20px] font-semibold text-black font-inter">
                    {profileData?.website || ''}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <h3 className="text-[28px] md:text-[32px] font-bold text-black font-inter mb-4">
                Contact Details:
              </h3>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="bg-gray-50 rounded-[10px] px-4 py-3 flex-shrink-0">
                  <span className="text-[16px] md:text-[20px] font-semibold text-black font-inter">
                    {profileData?.phone || 'Phone Not Set'}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-10px] px-4 py-3 flex-shrink-0">
                  <span className="text-[16px] md:text-[20px] font-semibold text-black font-inter">
                    {profileData?.email || auth.currentUser?.email || 'Email Not Set'}
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Status (Corporate Accounts Only) */}
            {profileData?.accountType === 'corporate' && (
              <div>
                <h3 className="text-[28px] md:text-[32px] font-bold text-black font-inter mb-4">
                  Verification Status:
                </h3>
                {profileData?.isVerified ? (
                  <div className="bg-green-50 border border-green-200 rounded-[10px] px-6 py-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-green-600 font-semibold text-[16px] md:text-[20px]">
                        ✓ Verified
                      </span>
                    </div>
                    {formatVerificationInfo() && (
                      <p className="text-[14px] md:text-[16px] text-gray-700 font-inter">
                        {formatVerificationInfo()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-[10px] px-6 py-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-yellow-800 font-semibold text-[16px] md:text-[20px]">
                        ⚠ Not Verified
                      </span>
                    </div>
                    {profileData?.verifiedBy === 'Marcan Admin' && formatVerificationInfo() ? (
                      <div className="mb-4">
                        <p className="text-[14px] md:text-[16px] text-gray-700 font-inter mb-2">
                          {formatVerificationInfo()}
                        </p>
                        <p className="text-[13px] md:text-[15px] text-gray-600 font-inter italic">
                          If you think this is a mistake, please contact the Marcan administrator at{" "}
                          <a
                            href="mailto:marcan.initiative@gmail.com"
                            className="text-[#DB1233] hover:underline font-semibold"
                          >
                            marcan.initiative@gmail.com
                          </a>
                          {" "}to verify your account.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[16px] md:text-[20px] font-semibold text-yellow-800 font-inter mb-4">
                        Your account is not verified. Verify your account to make it visible to the public.
                      </p>
                    )}
                    {profileData?.verifiedBy !== 'Marcan Admin' && (
                      <AlertDialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
                        <AlertDialogTrigger asChild>
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Verify Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Verify Your Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              Please enter your name to verify your corporate account. Once verified, your account will be visible to the public.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="mt-4">
                            <Input
                              type="text"
                              placeholder="Enter your name"
                              value={verifyName}
                              onChange={(e) => {
                                setVerifyName(e.target.value);
                                setVerifyError('');
                              }}
                              className="w-full"
                            />
                            {verifyError && (
                              <p className="text-red-600 text-sm mt-2">{verifyError}</p>
                            )}
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => {
                              setShowVerifyDialog(false);
                              setVerifyName('');
                              setVerifyError('');
                            }}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleVerifyAccount}
                              disabled={verifyLoading}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {verifyLoading ? 'Verifying...' : 'Verify'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )}

                {/* Verification History */}
                {verificationHistory.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-[20px] md:text-[24px] font-semibold text-black font-inter mb-4">
                      Verification History:
                    </h4>
                    <div className="bg-white border border-gray-200 rounded-[10px] px-6 py-4 max-h-96 overflow-y-auto">
                      {historyLoading ? (
                        <p className="text-gray-500">Loading history...</p>
                      ) : (
                        <div className="space-y-3">
                          {verificationHistory.map((entry, index) => {
                            const date = new Date(entry.performedAt);
                            const formattedDate = date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            });
                            const formattedTime = date.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            });

                            return (
                              <div
                                key={entry.id}
                                className={`flex items-start gap-3 pb-3 ${index !== verificationHistory.length - 1 ? 'border-b border-gray-200' : ''
                                  }`}
                              >
                                <div
                                  className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${entry.action === 'verified' ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                />
                                <div className="flex-1">
                                  <p className="text-[14px] md:text-[16px] font-semibold text-gray-900">
                                    {entry.action === 'verified' ? '✓ Verified' : '✗ Unverified'} by {entry.performedBy}
                                  </p>
                                  <p className="text-[12px] md:text-[14px] text-gray-600">
                                    {formattedDate} at {formattedTime}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description / Interests */}
            <div>
              <h3 className="text-[28px] md:text-[32px] font-bold text-black font-inter mb-4">
                {profileData?.accountType === 'individual' ? 'Interests:' : 'Description:'}
              </h3>
              <div className="bg-gray-50 rounded-[10px] px-6 py-4">
                <p className="text-[16px] md:text-[20px] font-semibold text-black font-inter leading-relaxed">
                  {profileData?.description || 'Description Not Set'}
                </p>
              </div>
            </div>

            {/* Category Management (Admin Only) */}
            {isAdmin && (
              <div>
                <h3 className="text-[28px] md:text-[32px] font-bold text-black font-inter mb-4">
                  Category Management:
                </h3>

                {/* Add Category Form */}
                <div className="mb-6">
                  <AddCategory onCategoryAdded={fetchCategories} />
                </div>

                {/* Categories List */}
                <div>
                  <h4 className="text-[20px] font-semibold text-black font-inter mb-4">
                    All Available Categories ({categories.length}):
                  </h4>

                  {categoriesLoading ? (
                    <p className="text-gray-500">Loading categories...</p>
                  ) : categories.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">No categories found.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Featured Categories */}
                      {categories.filter(cat => cat.isFeatured).length > 0 && (
                        <div>
                          <h5 className="text-lg font-semibold text-black mb-3 flex items-center">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                              Featured
                            </span>
                            Featured Categories ({categories.filter(cat => cat.isFeatured).length})
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories
                              .filter(category => category.isFeatured)
                              .map((category) => (
                                <div key={category.id} className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm relative">
                                  <div className="flex items-start justify-between mb-2">
                                    <h6 className="font-semibold text-black">{category.name}</h6>
                                    <div className="flex items-center space-x-2">
                                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                        Featured
                                      </span>
                                      <button
                                        onClick={() => handleToggleFeatured(category.id, category.name, true)}
                                        className="text-yellow-600 hover:text-yellow-700 p-1 rounded-full hover:bg-yellow-50 transition-colors"
                                        title={`Remove ${category.name} from featured`}
                                      >
                                        <StarOff className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCategory(category.id, category.name)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                        title={`Delete ${category.name}`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  {category.imageUrl && (
                                    <div className="relative group cursor-pointer" onClick={() => handleImageOptions(category)}>
                                      <img
                                        src={category.imageUrl}
                                        alt={category.name}
                                        className="w-full h-32 object-cover rounded-md mb-2"
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md mb-2">
                                        <span className="text-white font-semibold text-sm">Image Options</span>
                                      </div>
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    Created: {new Date(category.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Regular Categories */}
                      {categories.filter(cat => !cat.isFeatured).length > 0 && (
                        <div>
                          <h5 className="text-lg font-semibold text-black mb-3">
                            Regular Categories ({categories.filter(cat => !cat.isFeatured).length})
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories
                              .filter(category => !category.isFeatured)
                              .map((category) => (
                                <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm relative">
                                  <div className="flex items-start justify-between mb-2">
                                    <h6 className="font-semibold text-black">{category.name}</h6>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => handleToggleFeatured(category.id, category.name, false)}
                                        className="text-yellow-600 hover:text-yellow-700 p-1 rounded-full hover:bg-yellow-50 transition-colors"
                                        title={`Make ${category.name} featured`}
                                      >
                                        <Star className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCategory(category.id, category.name)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                        title={`Delete ${category.name}`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  {category.imageUrl && (
                                    <div className="relative group cursor-pointer" onClick={() => handleImageOptions(category)}>
                                      <img
                                        src={category.imageUrl}
                                        alt={category.name}
                                        className="w-full h-32 object-cover rounded-md mb-2"
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md mb-2">
                                        <span className="text-white font-semibold text-sm">Image Options</span>
                                      </div>
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    Created: {new Date(category.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* My Listings Section (corporate only) */}
            {profileData?.accountType !== 'individual' && (
              <div>
                <h3 className="text-[28px] md:text-[32px] font-bold text-black font-inter mb-4">
                  My Listings:
                </h3>

                {/* Published Listings */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[20px] font-semibold text-black font-inter">
                      Published Listings:
                    </h4>
                  </div>

                  {loading ? (
                    <p className="text-gray-500">Loading listings...</p>
                  ) : listings.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 mb-4">No published listings yet.</p>
                      <AddListingCard />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {listings.map((listing) => (
                        <div key={listing.id} className="h-[350px]">
                          <MyListingCard listing={listing} onDelete={fetchMyListings} />
                        </div>
                      ))}
                      <AddListingCard />
                    </div>
                  )}
                </div>

                {/* Drafts */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[20px] font-semibold text-black font-inter">
                      Drafts:
                    </h4>
                    {drafts.length > 0 && (
                      <span className="text-sm text-gray-500">
                        {drafts.length}/10 drafts
                      </span>
                    )}
                  </div>

                  {draftsLoading ? (
                    <p className="text-gray-500">Loading drafts...</p>
                  ) : drafts.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">No drafts yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {drafts.map((draft) => (
                        <div key={draft.id} className="h-[350px]">
                          <MyListingCard listing={draft} onDelete={fetchMyDrafts} isDraft={true} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Account Actions */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h2 className="text-[24px] font-semibold text-black font-inter">
                Account Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-12 text-base border border-gray-300 hover:bg-gray-50"
                  onClick={() => navigate('/edit-profile')}
                >
                  Edit Profile Information
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-12 text-base border border-gray-300 hover:bg-gray-50"
                  onClick={() => navigate('/change-password')}
                >
                  Change Password
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-12 text-base border border-gray-300 hover:bg-gray-50"
                  onClick={() => navigate('/change-email')}
                >
                  Change Email
                </Button>
                {profileData?.accountType !== 'individual' && (
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-12 text-base border border-gray-300 hover:bg-gray-50"
                    onClick={() => navigate('/create-listing')}
                  >
                    Create New Listing
                  </Button>
                )}
              </div>
            </div>

            {/* Logout */}
            <div className="pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                className="w-full justify-start text-left h-12 text-base border border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => auth.signOut()}
              >
                Sign Out
              </Button>
            </div>
            {/* Delete Account (below Sign Out) */}
            <div className="pt-4">
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full justify-center h-12 text-base bg-red-600 text-white hover:bg-red-700 border-none"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. All your data and listings will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={() => { setShowDeleteDialog(false); setShowPasswordPrompt(true); }}>
                      Yes, Delete My Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {/* Password Prompt Dialog */}
              <AlertDialog open={showPasswordPrompt} onOpenChange={setShowPasswordPrompt}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Account Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                      Please enter your password to confirm account deletion.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="mt-2 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 mt-2"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {deleteError && <div className="text-red-600 text-sm mt-2">{deleteError}</div>}
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setShowPasswordPrompt(false)}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} disabled={deleteLoading} className="bg-red-600 text-white hover:bg-red-700">
                      {deleteLoading ? 'Deleting...' : 'Delete Account'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </main>

      {/* Image Upload Modal */}
      {showImageModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Add Image for "{selectedCategory.name}"
              </h3>
              <button
                onClick={handleCloseImageModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Featured categories require an image. Please upload an image for this category.
            </p>

            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative">
                  <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#DB1233] transition-colors overflow-hidden relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
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
                  onClick={() => document.getElementById('category-image-upload')?.click()}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">Drag and drop an image here, or click to browse</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                </div>
              )}

              <Input
                id="category-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleImageUploadAndMakeFeatured}
                  disabled={!imageFile}
                  className="flex-1"
                >
                  Upload & Make Featured
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCloseImageModal}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Options Modal */}
      {showImageOptionsModal && selectedCategoryForImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Image Options for "{selectedCategoryForImage.name}"
              </h3>
              <button
                onClick={handleCloseImageOptionsModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleChangeImage}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
              >
                <Upload className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Change Image</span>
              </button>

              {!selectedCategoryForImage.isFeatured && (
                <button
                  onClick={handleRemoveImage}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-red-50 transition-colors flex items-center space-x-3 text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="font-medium">Remove Image</span>
                </button>
              )}

              {selectedCategoryForImage.isFeatured && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Featured categories require an image. You can only change the image, not remove it.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAccount;

