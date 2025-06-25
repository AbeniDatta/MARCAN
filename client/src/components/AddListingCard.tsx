import { useNavigate } from "react-router-dom";

const AddListingCard = () => {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white rounded-lg border border-dashed border-black p-6 shadow-sm flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors h-full min-h-[300px]"
      onClick={() => navigate("/create-listing")}
    >
      <div className="text-center">
        <span className="text-[32px] font-bold text-[#7A7777] font-inter leading-tight">
          + Add
          <br />
          a new
          <br />
          listing
        </span>
      </div>
    </div>
  );
};

export default AddListingCard;
