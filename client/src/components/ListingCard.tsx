import { Listing } from '@/services/api';
import FlippableProductCard from './FlippableProductCard';

interface ListingCardProps {
    listing: Listing;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
    return (
        <div className="h-[400px]"> {/* Increased height from 300px to 400px */}
            <FlippableProductCard listing={listing} />
        </div>
    );
};

export default ListingCard; 