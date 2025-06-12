import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import { Button } from "@/components/ui/button";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";

const MyAccount = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Authenticated Header */}
      <AuthenticatedHeader />

      {/* Page Content */}
      <section className="bg-[#F9F9F9] px-4 lg:px-20 py-12">
        <div className="max-w-screen-xl mx-auto">
          <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <h1 className="text-[36px] font-bold text-black font-inter mb-8">
              My Account
            </h1>

            <div className="space-y-6">
              {/* User Information */}
              <div className="space-y-4">
                <h2 className="text-[24px] font-semibold text-black font-inter">
                  Account Information
                </h2>
                <div className="space-y-2">
                  <p className="text-lg text-gray-700">
                    <span className="font-semibold">Email:</span>{" "}
                    {auth.currentUser?.email}
                  </p>
                  <p className="text-lg text-gray-700">
                    <span className="font-semibold">Account Type:</span>{" "}
                    Business
                  </p>
                  <p className="text-lg text-gray-700">
                    <span className="font-semibold">Member Since:</span>{" "}
                    {auth.currentUser?.metadata.creationTime
                      ? new Date(
                          auth.currentUser.metadata.creationTime,
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Account Actions */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h2 className="text-[24px] font-semibold text-black font-inter">
                  Account Actions
                </h2>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-12 text-base border border-gray-300 hover:bg-gray-50"
                  >
                    Edit Profile Information
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-12 text-base border border-gray-300 hover:bg-gray-50"
                  >
                    Change Password
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-12 text-base border border-gray-300 hover:bg-gray-50"
                  >
                    Manage Listings
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-12 text-base border border-gray-300 hover:bg-gray-50"
                  >
                    Account Settings
                  </Button>
                </div>
              </div>

              {/* Logout */}
              <div className="pt-6 border-t border-gray-200">
                <Button
                  onClick={handleLogout}
                  className="bg-[#DB1233] hover:bg-[#c10e2b] text-white w-full h-12 text-base font-semibold font-inter"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MyAccount;
