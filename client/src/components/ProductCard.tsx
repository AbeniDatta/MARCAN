import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  title: string;
  company: string;
  description: string;
  image: string;
  inStock?: boolean;
  exportReady?: boolean;
}

const ProductCard = ({
  title,
  company,
  description,
  image,
  inStock = false,
  exportReady = false,
}: ProductCardProps) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 w-[242px] h-[225px] flex flex-col">
      {/* Product Image */}
      <div className="w-[69px] h-[49px] mb-4">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover bg-gray-200 rounded"
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-base font-semibold text-black font-inter leading-tight mb-2 line-clamp-2">
          {title}
        </h3>

        <p className="text-xs font-medium text-black font-inter mb-2">
          {company}
        </p>

        <p className="text-xs font-medium text-black font-inter leading-tight mb-4 flex-1 line-clamp-3">
          {description}
        </p>

        {/* Status Badges */}
        <div className="flex gap-2 mb-3">
          {exportReady && (
            <Badge className="bg-[#E0F2FF] text-black text-xs font-medium px-2 py-1 rounded-xl border-0">
              Export Ready
            </Badge>
          )}
          {inStock && (
            <Badge className="bg-[#E0F2FF] text-black text-xs font-medium px-2 py-1 rounded-xl border-0">
              In Stock
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="bg-[#2545AB] hover:bg-[#1e3a94] text-white text-xs font-medium px-3 py-1.5 h-auto rounded font-inter flex-1">
            View Supplier
          </Button>
          <Button className="bg-[#DB1233] hover:bg-[#c10e2b] text-white text-xs font-medium px-3 py-1.5 h-auto rounded font-inter flex-1">
            Contact Supplier
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;