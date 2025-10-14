import { Link } from "react-router-dom";
import canadianMapleLeaf from "@/assets/canadian-maple-leaf-red.png";

const LoginSelection = () => {
    return (
        <div className="min-h-screen bg-[#F9F9F9]">
            <header className="bg-[#F9F9F9] px-4 lg:px-20 py-4">
                <div className="flex items-center justify-between max-w-screen-xl mx-auto">
                    <Link to="/" className="flex items-center gap-3">
                        <img src={canadianMapleLeaf} alt="Canadian maple leaf" className="w-[38px] h-[38px]" />
                        <h1 className="text-[32px] font-bold text-black font-inter">MARCAN</h1>
                    </Link>
                </div>
            </header>

            <main className="px-4 lg:px-20">
                <div className="max-w-screen-xl mx-auto">
                    <div className="bg-white mx-auto max-w-3xl px-12 py-16 text-center">
                        <h1 className="text-[42px] font-bold text-black font-inter mb-6">Log in to your account</h1>
                        <p className="text-lg text-[#4A3F3F] mb-10">Choose your account type to continue.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Link to="/login/buyer" className="border rounded-xl p-8 hover:shadow-md transition bg-[#F9F9F9]">
                                <h2 className="text-2xl font-semibold mb-2">Buyer login</h2>
                                <p className="text-sm text-gray-600">Access your saved listings and messages.</p>
                            </Link>
                            <Link to="/login/seller" className="border rounded-xl p-8 hover:shadow-md transition bg-[#F9F9F9]">
                                <h2 className="text-2xl font-semibold mb-2">Seller login</h2>
                                <p className="text-sm text-gray-600">Manage your company profile and listings.</p>
                            </Link>
                        </div>

                        <p className="text-center text-gray-600 mt-8 text-lg">
                            New here? <Link to="/signup" className="text-[#DB1233] hover:underline font-semibold">Create an account</Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LoginSelection;



