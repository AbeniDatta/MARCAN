import { Link } from "react-router-dom";
import canadianMapleLeaf from "@/assets/canadian-maple-leaf-red.png";

const SignUpSelection = () => {
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
                        <h1 className="text-[42px] font-bold text-black font-inter mb-6">Create your account</h1>
                        <p className="text-lg text-[#4A3F3F] mb-10">Choose the account type that fits you best.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Link to="/signup/buyer" className="border rounded-xl p-8 hover:shadow-md transition bg-[#F9F9F9]">
                                <h2 className="text-2xl font-semibold mb-2">Create a buyer account</h2>
                                <p className="text-sm text-gray-600">For individuals exploring and contacting sellers. No verification needed.</p>
                            </Link>
                            <Link to="/signup/seller" className="border rounded-xl p-8 hover:shadow-md transition bg-[#F9F9F9]">
                                <h2 className="text-2xl font-semibold mb-2">Create a seller account</h2>
                                <p className="text-sm text-gray-600">For company representatives. Canadian postal code required. Verified to appear.</p>
                            </Link>
                        </div>

                        <p className="text-center text-gray-600 mt-8 text-lg">
                            Already have an account? <Link to="/login" className="text-[#DB1233] hover:underline font-semibold">Log In</Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SignUpSelection;



