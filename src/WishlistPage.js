import React from 'react';
import MovieTemplate from './MovieTemplate';

const WishlistPage = ({ wishlist, toggleWishlist }) => {
  return (
    <div className="wishlist-page">
      <h1>My Wishlist</h1>
      <div className="wishlist-movies">
        {wishlist.length > 0 ? (
          wishlist.map(movie => (
            <MovieTemplate key={movie.id} movie={movie} wishlist={wishlist} toggleWishlist={toggleWishlist} />
          ))
        ) : (
          <p>No movies in your wishlist.</p>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
