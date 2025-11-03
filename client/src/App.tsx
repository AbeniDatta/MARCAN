import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "@/firebase";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import SignUpSelection from "./pages/SignUpSelection";
import BuyerSignUp from "./pages/BuyerSignUp";
import Login from "./pages/Login";
import LoginSelection from "./pages/LoginSelection";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import Listings from "./pages/Listings";
import ForgotPassword from "./pages/ForgotPassword";
import EmailVerification from "./pages/EmailVerification";
import MyAccount from "./pages/MyAccount";
import CreateListing from "./pages/CreateListing";
import UpdateListing from "./pages/UpdateListing";
import UpdateDraft from "./pages/UpdateDraft";

import SavedListings from '@/pages/SavedListings';
import EditProfile from "./pages/EditProfile";
import ChangeEmail from "./pages/ChangeEmail";
import ChangePassword from "./pages/ChangePassword";
import SupplierProfile from "./pages/SupplierProfile";
import CompanyDirectory from "./pages/CompanyDirectory";
import Chatbot from "./components/Chatbot";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  // Email verification disabled - keep state for potential future use
  // Email verification disabled

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setAuthenticated(true);
        // emailVerified no longer used
      } else {
        setAuthenticated(false);
        // emailVerified no longer used
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" />;
  }

  // Email verification disabled

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup" element={<SignUpSelection />} />
          <Route path="/signup/individual" element={<BuyerSignUp />} />
          <Route path="/signup/corporate" element={<SignUp />} />
          <Route path="/login" element={<LoginSelection />} />
          <Route path="/login/individual" element={<Login />} />
          <Route path="/login/corporate" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/email-verification" element={<EmailVerification />} />

          <Route
            path="/listings"
            element={
              <ProtectedRoute>
                <Listings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-account"
            element={
              <ProtectedRoute>
                <MyAccount />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-listing"
            element={
              <ProtectedRoute>
                <CreateListing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/update-listing/:listingId"
            element={
              <ProtectedRoute>
                <UpdateListing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/update-draft/:draftId"
            element={
              <ProtectedRoute>
                <UpdateDraft />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-email"
            element={
              <ProtectedRoute>
                <ChangeEmail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route path="/supplier/:supplierId" element={<SupplierProfile />} />
          <Route
            path="/company-directory"
            element={
              <ProtectedRoute>
                <CompanyDirectory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/saved-listings"
            element={
              <ProtectedRoute>
                <SavedListings />
              </ProtectedRoute>

            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Chatbot />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
