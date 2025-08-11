import { Listing } from '@/services/api';
import FlippableProductCard from './FlippableProductCard';

interface ListingCardProps {
    listing: Listing;
    showHeart?: boolean;
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onSelect?: (selected: boolean) => void;
}

const ListingCard: React.FC<ListingCardProps> = ({
    listing,
    showHeart = true,
    isSelectionMode = false,
    isSelected = false,
    onSelect
}) => {
    return (
        <div className="h-[400px]"> {/* Increased height from 300px to 400px */}
            <FlippableProductCard
                listing={listing}
                showHeart={showHeart}
                selectMode={isSelectionMode}
                isSelected={isSelected}
                onSelect={(id, selected) => onSelect?.(selected)}
            />
        </div>
    );
};

export default ListingCard; 