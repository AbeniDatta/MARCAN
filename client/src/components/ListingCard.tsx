import { Listing } from '@/services/api';
import FlippableProductCard from './FlippableProductCard';

interface ListingCardProps {
    listing: Listing;
    showHeart?: boolean;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, showHeart = true }) => {
    return (
        <div className="h-[400px]"> {/* Increased height from 300px to 400px */}
            <FlippableProductCard listing={listing} showHeart={showHeart} />
        </div>
    );
};

export default ListingCard; 