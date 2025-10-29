import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserProfile, getAllSellers } from "@/services/api";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Building2, Mail, Phone, Globe, MapPin } from "lucide-react";

const CompanyDirectory = () => {
    const navigate = useNavigate();
    const [sellers, setSellers] = useState<UserProfile[]>([]);
    const [filteredSellers, setFilteredSellers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchSellers();
    }, []);

    useEffect(() => {
        // Filter sellers based on search term
        const filtered = sellers.filter(seller =>
            seller.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            seller.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            seller.province?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredSellers(filtered);
    }, [sellers, searchTerm]);

    const fetchSellers = async () => {
        try {
            setLoading(true);
            const response = await getAllSellers();
            setSellers(response.data);
            setFilteredSellers(response.data);
        } catch (err: any) {
            console.error("Failed to fetch sellers", err);
            setError("Failed to load company directory");
        } finally {
            setLoading(false);
        }
    };

    const handleCompanyClick = (seller: UserProfile) => {
        navigate(`/supplier/${seller.id}`);
    };

    const formatAddress = (seller: UserProfile) => {
        const parts = [];
        if (seller.address1) parts.push(seller.address1);
        if (seller.address2) parts.push(seller.address2);
        if (seller.city) parts.push(seller.city);
        if (seller.province) parts.push(seller.province);
        if (seller.postalCode) parts.push(seller.postalCode);
        return parts.join(", ");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9F9F9]">
                <AuthenticatedHeader />
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DB1233] mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading company directory...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F9F9F9]">
                <AuthenticatedHeader />
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{error}</p>
                        <Button onClick={fetchSellers} className="bg-[#DB1233] hover:bg-[#c10e2b]">
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9F9F9]">
            <AuthenticatedHeader />

            <main className="px-4 lg:px-20 py-8 max-w-screen-xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-[40px] md:text-[50px] font-bold text-black font-inter mb-4">
                        Company Directory
                    </h1>
                    <p className="text-[18px] text-gray-600 font-inter mb-6">
                        Browse all seller companies on our platform
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                            type="text"
                            placeholder="Search companies, cities, or provinces..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-12 text-base border-gray-300 focus:border-[#DB1233] focus:ring-[#DB1233]"
                        />
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-6">
                    <p className="text-gray-600 font-inter">
                        {filteredSellers.length} {filteredSellers.length === 1 ? 'company' : 'companies'} found
                    </p>
                </div>

                {/* Company Table */}
                {filteredSellers.length === 0 ? (
                    <div className="text-center py-12">
                        <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">
                            {searchTerm ? 'No companies found matching your search.' : 'No companies available.'}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 font-inter">
                                            Company Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 font-inter">
                                            Contact Details
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 font-inter">
                                            Location
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 font-inter">
                                            Website
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredSellers.map((seller) => (
                                        <tr
                                            key={seller.id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => handleCompanyClick(seller)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    {seller.logoUrl ? (
                                                        <img
                                                            src={seller.logoUrl}
                                                            alt={`${seller.companyName} logo`}
                                                            className="w-12 h-12 object-cover rounded-md border border-gray-200"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                                                            <Building2 className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-base font-semibold text-black font-inter hover:text-[#DB1233] transition-colors">
                                                            {seller.companyName}
                                                        </p>
                                                        {seller.description && (
                                                            <p className="text-sm text-gray-600 font-inter mt-1 line-clamp-2">
                                                                {seller.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    {seller.email && (
                                                        <div className="flex items-center space-x-2">
                                                            <Mail className="h-4 w-4 text-gray-400" />
                                                            <a
                                                                href={`mailto:${seller.email}`}
                                                                className="text-sm text-blue-600 hover:text-blue-800 font-inter"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {seller.email}
                                                            </a>
                                                        </div>
                                                    )}
                                                    {seller.phone && (
                                                        <div className="flex items-center space-x-2">
                                                            <Phone className="h-4 w-4 text-gray-400" />
                                                            <a
                                                                href={`tel:${seller.phone}`}
                                                                className="text-sm text-gray-900 font-inter"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {seller.phone}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <MapPin className="h-4 w-4 text-gray-400" />
                                                    <div className="text-sm text-gray-900 font-inter">
                                                        {formatAddress(seller) || 'Location not specified'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {seller.website ? (
                                                    <div className="flex items-center space-x-2">
                                                        <Globe className="h-4 w-4 text-gray-400" />
                                                        <a
                                                            href={seller.website.startsWith('http') ? seller.website : `https://${seller.website}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:text-blue-800 font-inter"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {seller.website}
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400 font-inter">No website</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CompanyDirectory;
