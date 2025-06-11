const LatestListings = () => {
  return (
    <div>
      <h2 className="text-4xl font-medium text-black font-inter mb-12">
        Latest Listings
      </h2>

      <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-100 text-center">
        <p className="text-gray-600 text-lg">
          No listings available yet. We're just getting started. Once businesses
          add listings, they'll appear here.
        </p>
      </div>
    </div>
  );
};

export default LatestListings;
