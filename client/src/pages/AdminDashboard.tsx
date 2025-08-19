import { useEffect, useState } from "react";
import { Listing, UserProfile, api } from "@/services/api";
import { useNavigate } from "react-router-dom";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import { Input } from "@/components/ui/input";

const AdminDashboard = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const navigate = useNavigate();

  const fetchAdminData = async () => {
    try {
      const [listingsRes, usersRes] = await Promise.all([
        api.get<Listing[]>("/listings"),
        api.get<UserProfile[]>("/users"),
      ]);
      setListings(listingsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Failed to load admin data", err);
      setError("Failed to load admin data");
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
      setListings((prev) => prev.filter((listing) => listing.id !== id));
    } catch (err) {
      console.error("Failed to delete listing", err);
      alert("Failed to delete listing");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user and all their listings?")) return;
    try {
      await api.delete(`/users/admin/${id}`);
      setUsers((prev) => prev.filter((user) => user.id !== id));
      setListings((prev) => prev.filter((listing) => listing.userId !== id));
    } catch (err) {
      console.error("Failed to delete user", err);
      alert("Failed to delete user");
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

          {/* Listings Table */}
          <div className="mb-16">
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
          </div>

          {/* Users Table */}
          <div>
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
                        <button
                          onClick={() => handleDeleteUser(user.id)}
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
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;