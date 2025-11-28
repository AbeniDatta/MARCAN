import { useEffect, useState } from "react";
import { Listing, UserProfile, api, toggleUserVerification, toggleUserVisibility, toggleListingVisibility } from "@/services/api";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

const AdminDashboard = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const fetchAdminData = async () => {
    try {
      const [listingsRes, usersRes] = await Promise.all([
        api.get<Listing[]>("/listings/admin/all"), // Use admin endpoint to get all listings including hidden
        api.get<UserProfile[]>("/users", { params: { activeOnly: true } }),
      ]);
      setListings(listingsRes.data);
      setUsers(usersRes.data);
    } catch (err: any) {
      console.error("Failed to load admin data", err);
      setError(err?.response?.data?.error || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteListing = async (id: number) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await api.delete(`/listings/admin/${id}`);
      await fetchAdminData(); // <-- refetch instead of local filter only
    } catch (err: any) {
      console.error("Failed to delete listing", err);
      alert(err?.response?.data?.details || "Failed to delete listing");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user and all their listings?")) return;
    try {
      await api.delete(`/users/admin/${id}`);
      await fetchAdminData(); // <-- refetch
    } catch (err: any) {
      console.error("Failed to delete user", err);
      alert(err?.response?.data?.error || "Failed to delete user");
    }
  };

  const handleToggleVerification = async (userId: number, currentStatus: boolean) => {
    try {
      console.log("Toggling verification for user:", userId, "to:", !currentStatus);
      const response = await toggleUserVerification(userId, !currentStatus);
      console.log("Verification toggle response:", response);
      await fetchAdminData(); // Refetch to get updated data
    } catch (err: any) {
      console.error("Failed to toggle verification", err);
      console.error("Error response:", err?.response);
      console.error("Error data:", err?.response?.data);
      const errorMessage = err?.response?.data?.error || err?.response?.data?.details || err?.message || "Failed to update verification status";
      alert(errorMessage);
    }
  };

  const handleToggleUserVisibility = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await toggleUserVisibility(userId, !currentStatus);
      console.log("Toggle user visibility response:", response);
      // Only refetch if we got a successful response
      if (response?.data || response?.status === 200 || response?.statusText === 'OK') {
        await fetchAdminData();
      }
    } catch (err: any) {
      console.error("Failed to toggle user visibility", err);
      console.error("Error details:", err?.response);
      // Only show error if it's a real error (status >= 400)
      if (err?.response?.status && err.response.status >= 400) {
        alert(err?.response?.data?.error || err?.response?.data?.details || "Failed to update user visibility");
      } else {
        // If no error status, the operation might have succeeded, just refetch
        await fetchAdminData();
      }
    }
  };

  const handleToggleListingVisibility = async (listingId: number, currentStatus: boolean) => {
    try {
      const response = await toggleListingVisibility(listingId, !currentStatus);
      console.log("Toggle listing visibility response:", response);
      // Only refetch if we got a successful response
      if (response?.data || response?.status === 200 || response?.statusText === 'OK') {
        await fetchAdminData();
      }
    } catch (err: any) {
      console.error("Failed to toggle listing visibility", err);
      console.error("Error details:", err?.response);
      // Only show error if it's a real error (status >= 400)
      if (err?.response?.status && err.response.status >= 400) {
        alert(err?.response?.data?.error || err?.response?.data?.details || "Failed to update listing visibility");
      } else {
        // If no error status, the operation might have succeeded, just refetch
        await fetchAdminData();
      }
    }
  };

  const filteredListings = listings.filter(
    (l) =>
      l.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
      l.description.toLowerCase().includes(listingSearch.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <AuthenticatedHeader />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F9F9F9]">
        <AuthenticatedHeader />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <AuthenticatedHeader />
      <section className="px-4 lg:px-20 py-12">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-[40px] md:text-[50px] font-bold text-black font-inter mb-10">
            Admin Dashboard
          </h1>

          <Tabs defaultValue="listings" className="w-full">
            <TabsList className="mb-6 bg-white p-1 rounded-lg shadow-sm">
              <TabsTrigger
                value="listings"
                className="data-[state=active]:bg-[#DB1233] data-[state=active]:text-white px-6 py-2"
              >
                All Listings ({filteredListings.length})
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-[#DB1233] data-[state=active]:text-white px-6 py-2"
              >
                All Users ({filteredUsers.length})
              </TabsTrigger>
            </TabsList>

            {/* Listings Tab Content */}
            <TabsContent value="listings" className="mt-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[25px] font-semibold text-[#4A3F3F]">
                  All Listings ({filteredListings.length})
                </h2>
                <Input
                  value={listingSearch}
                  onChange={(e) => setListingSearch(e.target.value)}
                  placeholder="Search listings..."
                  className="max-w-sm"
                />
              </div>
              <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Title</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Company</th>
                      <th className="p-3">Tags</th>
                      <th className="p-3">Categories</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Capacity</th>
                      <th className="p-3">Image URL</th>
                      <th className="p-3">User ID</th>
                      <th className="p-3">Created At</th>
                      <th className="p-3">Hidden</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.map((listing) => (
                      <tr key={listing.id} className="border-t">
                        <td className="p-3">{listing.id}</td>
                        <td className="p-3">{listing.title}</td>
                        <td className="p-3">{listing.description}</td>
                        <td className="p-3">${listing.price}</td>
                        <td className="p-3">{listing.companyName}</td>
                        <td className="p-3">{listing.tags?.join(", ")}</td>
                        <td className="p-3">{listing.categories?.join(", ")}</td>
                        <td className="p-3">{listing.city}</td>
                        <td className="p-3">{listing.capacity}</td>
                        <td className="p-3 truncate max-w-[200px]">{listing.imageUrl}</td>
                        <td className="p-3">{listing.userId}</td>
                        <td className="p-3">{new Date(listing.createdAt).toLocaleString()}</td>
                        <td className="p-3">
                          <Checkbox
                            checked={listing.isHidden || false}
                            onCheckedChange={(checked) => handleToggleListingVisibility(listing.id, !checked)}
                          />
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDeleteListing(listing.id)}
                            className="text-[#DB1233] hover:text-[#c10e2b] font-semibold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* Users Tab Content */}
            <TabsContent value="users" className="mt-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[25px] font-semibold text-[#4A3F3F]">
                  All Users ({filteredUsers.length})
                </h2>
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="max-w-sm"
                />
              </div>
              <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Company</th>
                      <th className="p-3">Account Type</th>
                      <th className="p-3">Verification</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Website</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Province</th>
                      <th className="p-3">Postal Code</th>
                      <th className="p-3">Address 1</th>
                      <th className="p-3">Address 2</th>
                      <th className="p-3">Logo URL</th>
                      <th className="p-3">Created At</th>
                      <th className="p-3">Updated At</th>
                      <th className="p-3">Hidden</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t">
                        <td className="p-3">{user.id}</td>
                        <td className="p-3">{user.name}</td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">{user.companyName || "—"}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.accountType === 'corporate'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {user.accountType || 'individual'}
                          </span>
                        </td>
                        <td className="p-3">
                          {user.accountType === 'corporate' ? (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={user.isVerified || false}
                                onCheckedChange={() => handleToggleVerification(user.id, user.isVerified || false)}
                                className="data-[state=checked]:bg-[#DB1233]"
                              />
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.isVerified
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {user.isVerified ? 'Verified' : 'Not Verified'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="p-3">{user.phone || "—"}</td>
                        <td className="p-3 truncate max-w-[200px]">{user.website || "—"}</td>
                        <td className="p-3">{user.city || "—"}</td>
                        <td className="p-3">{user.province || "—"}</td>
                        <td className="p-3">{user.postalCode || "—"}</td>
                        <td className="p-3">{user.address1 || "—"}</td>
                        <td className="p-3">{user.address2 || "—"}</td>
                        <td className="p-3 truncate max-w-[200px]">{user.logoUrl || "—"}</td>
                        <td className="p-3">{new Date(user.createdAt).toLocaleString()}</td>
                        <td className="p-3">{new Date(user.updatedAt).toLocaleString()}</td>
                        <td className="p-3">
                          <Checkbox
                            checked={user.isHidden || false}
                            onCheckedChange={(checked) => handleToggleUserVisibility(user.id, !checked)}
                            disabled={user.isAdmin}
                            title={user.isAdmin ? "Admin account cannot be hidden" : ""}
                          />
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.isAdmin}
                            className={`font-semibold ${user.isAdmin
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-[#DB1233] hover:text-[#c10e2b]"
                              }`}
                            title={user.isAdmin ? "Admin account cannot be deleted" : ""}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;