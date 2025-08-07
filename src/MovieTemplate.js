import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TiltedCard from './TiltedCard';

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const MovieTemplate = ({ movie, wishlist, toggleWishlist }) => {
  const [showLoveAnimation, setShowLoveAnimation] = useState(false);
  const [hearts, setHearts] = useState([]);
  const clickTimeout = useRef();
  const isWishlisted = wishlist.some(m => m.id === movie.id);
  const navigate = useNavigate();

  // Limit description length to 100 characters for shorter template
  const shortDescription = movie.overview
    ? movie.overview.length > 100
      ? movie.overview.substring(0, 100) + "..."
      : movie.overview
    : movie.description
    ? movie.description.length > 100
      ? movie.description.substring(0, 100) + "..."
      : movie.description
    : "";

  // Generate multiple hearts with random positions and delays
  const createHeartBurst = () => {
    const newHearts = [];
    for (let i = 0; i < 8; i++) {
      newHearts.push({
        id: Date.now() + i,
        delay: i * 100,
        angle: (360 / 8) * i,
        size: Math.random() * 0.5 + 0.8,
        duration: Math.random() * 500 + 1000
      });
    }
    setHearts(newHearts);
  };

  const handleDoubleClick = () => {
    console.log("Double clicked movie:", movie.title);
    toggleWishlist(movie);
    createHeartBurst();
    setShowLoveAnimation(true);
    setTimeout(() => {
      setShowLoveAnimation(false);
      setHearts([]);
    }, 2000);
  };

  const handleClick = () => {
    if (clickTimeout.current) {
      // This is a double click
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      toggleWishlist(movie);
      createHeartBurst();
      setShowLoveAnimation(true);
      setTimeout(() => {
        setShowLoveAnimation(false);
        setHearts([]);
      }, 2000);
    } else {
      // This is a single click
      clickTimeout.current = setTimeout(() => {
        navigate(`/movie/${movie.id}`);
        clickTimeout.current = null;
      }, 300); // 300ms delay to detect double click
    }
  };

  return (
    <TiltedCard>
      <div
        className={`movie-template${isWishlisted ? " wishlisted" : ""}`}
        style={{ maxWidth: "200px", position: "relative", cursor: "pointer" }}
        onClick={handleClick} // Combined click handler
      >
        {showLoveAnimation && (
          <div className="love-animation-container">
            <div className="central-heart">
              <span className="heart-emoji">💖</span>
            </div>
            {hearts.map((heart) => (
              <div
                key={heart.id}
                className="floating-heart"
                style={{
                  '--angle': `${heart.angle}deg`,
                  '--size': heart.size,
                  '--duration': `${heart.duration}ms`,
                  animationDelay: `${heart.delay}ms`
                }}
              >
                💕
              </div>
            ))}
            <div className="love-ripple"></div>
            <div className="love-ripple" style={{ animationDelay: '0.3s' }}></div>
            <div className="love-ripple" style={{ animationDelay: '0.6s' }}></div>
          </div>
        )}
        <img
          src={
            movie.poster_path
              ? TMDB_IMAGE_BASE_URL + movie.poster_path
              : "https://via.placeholder.com/150x225?text=No+Image"
          }
          alt={movie.title}
          className="movie-poster"
          style={{ width: "150px", height: "225px", objectFit: "cover", display: "block", margin: "0 auto" }}
        />
        <div className="movie-info" style={{ fontSize: "0.9rem" }}>
          <h3 className="movie-name" style={{ fontSize: "1rem" }}>{movie.title}</h3>
          <p className="movie-genre" style={{ margin: "4px 0" }}>
            Genre:{" "}
            {movie.genres && movie.genres.length > 0
              ? movie.genres.map((g) => g.name).join(", ")
              : movie.genre || "N/A"}
          </p>
          <p className="movie-ratings" style={{ margin: "4px 0" }}>
            Ratings: {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}
          </p>
          <p className="movie-description" style={{ margin: "4px 0" }}>
            {shortDescription}
          </p>
          <p className="movie-year" style={{ margin: "4px 0" }}>
            Year: {movie.release_date ? movie.release_date.substring(0, 4) : movie.year || "N/A"}
          </p>
          <p className="movie-actorDirector" style={{ margin: "4px 0" }}>
            {movie.credits && movie.credits.crew
              ? "Director: " +
                movie.credits.crew
                  .filter((c) => c.job === "Director")
                  .map((d) => d.name)
                  .join(", ")
              : movie.actorDirector || "N/A"}
          </p>
        </div>
      </div>
    </TiltedCard>
  );
};

export default MovieTemplate;
