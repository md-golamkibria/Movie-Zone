import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './MovieDetailPage.css';
import './App.css';

const TMDB_API_KEY = ;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const MovieDetailPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movieDetails, setMovieDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        // Fetch movie details
        const movieResponse = await fetch(
          `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`
        );
        const movieData = await movieResponse.json();

        // Fetch movie credits (cast and crew)
        const creditsResponse = await fetch(
          `${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}&language=en-US`
        );
        const creditsData = await creditsResponse.json();

        // Fetch movie videos (trailers)
        const videosResponse = await fetch(
          `${TMDB_BASE_URL}/movie/${movieId}/videos?api_key=${TMDB_API_KEY}&language=en-US`
        );
        const videosData = await videosResponse.json();

        setMovieDetails({
          ...movieData,
          cast: creditsData.cast,
          crew: creditsData.crew,
          videos: videosData.results,
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching movie details:', err);
        setError('Failed to fetch movie details.');
        setLoading(false);
      }
    };

    if (movieId) {
      fetchMovieDetails();
    }
  }, [movieId]);

  const getDirector = (crew) => {
    const director = crew.find((member) => member.job === 'Director');
    return director ? director.name : 'N/A';
  };

  const getActors = (cast) => {
    return cast ? cast.slice(0, 5).map((actor) => actor.name).join(', ') : 'N/A'; // Top 5 actors
  };

  const getTrailer = (videos) => {
    const trailer = videos.find(
      (video) => video.type === 'Trailer' && video.site === 'YouTube'
    );
    return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner">
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
              <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
        <p>Loading movie details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!movieDetails) {
    return (
      <div className="no-data">
        <svg width="50" height="50" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
        <p>No movie details found.</p>
      </div>
    );
  }

  const { title, overview, poster_path, release_date, vote_average, runtime, genres, cast, crew, videos } = movieDetails;
  const directorName = getDirector(crew);
  const actorsNames = getActors(cast);
  const trailerUrl = getTrailer(videos);

  return (
    <div className="modern-movie-detail-page">
      {/* Hero Background with Backdrop */}
      <div 
        className="movie-hero-section"
        style={{
          backgroundImage: movieDetails.backdrop_path 
            ? `linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,255,255,0.1)), url(https://image.tmdb.org/t/p/original${movieDetails.backdrop_path})`
            : 'linear-gradient(135deg, #000000, #1a1a1a)'
        }}
      >
        {/* Navigation */}
        <div className="modern-nav-container">
          <button onClick={() => navigate(-1)} className="modern-back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.42-1.41L7.83 13H20v-2z"/>
            </svg>
            Back to Movies
          </button>
        </div>

        {/* Hero Content */}
        <div className="hero-content">
          <div className="hero-poster">
            {poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${poster_path}`}
                alt={title}
                className="modern-movie-poster"
              />
            ) : (
              <div className="modern-no-poster">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
                <span>No Poster</span>
              </div>
            )}
          </div>
          
          <div className="hero-info">
            <h1 className="modern-movie-title">{title}</h1>
            
            {/* Rating and Year */}
            <div className="movie-badges">
              <div className="rating-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                {vote_average ? vote_average.toFixed(1) : 'N/A'}
              </div>
              <div className="year-badge">
                {release_date ? new Date(release_date).getFullYear() : 'N/A'}
              </div>
              <div className="runtime-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {runtime ? `${runtime}m` : 'N/A'}
              </div>
            </div>

            {/* Genres */}
            <div className="genre-tags">
              {genres && genres.length > 0 ? genres.map((genre, index) => (
                <span key={index} className="genre-tag">{genre.name}</span>
              )) : <span className="genre-tag">Unknown</span>}
            </div>

            {/* Overview */}
            <p className="modern-overview">{overview || 'No plot summary available.'}</p>

            {/* Director and Cast Info */}
            <div className="key-info">
              <div className="info-item">
                <span className="info-label">Director</span>
                <span className="info-value">{directorName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Starring</span>
                <span className="info-value">{actorsNames}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="modern-content-sections">
        {/* Trailer Section */}
        {trailerUrl && (
          <div className="content-section">
            <h2 className="section-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Official Trailer
            </h2>
            <div className="trailer-wrapper">
              <iframe
                src={trailerUrl.replace('watch?v=', 'embed/')}
                title={`${title} Trailer`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="modern-trailer"
              ></iframe>
            </div>
          </div>
        )}

        {/* Cast Section */}
        <div className="content-section">
          <h2 className="section-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.498 1.498 0 0 0 18.5 7.5h-3c-.83 0-1.54.5-1.85 1.22L11.11 15H6.5c-.83 0-1.5.67-1.5 1.5S5.67 18 6.5 18h5.25l2.75-7 1.25 3.75h-2.5L16 22z"/>
            </svg>
            Cast & Crew
          </h2>
          <div className="modern-cast-grid">
            {cast && cast.slice(0, 12).map((person) => (
              <div key={person.id} className="modern-cast-card">
                <div className="cast-photo-container">
                  {person.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                      alt={person.name}
                      className="modern-cast-photo"
                    />
                  ) : (
                    <div className="modern-no-photo">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="cast-info">
                  <h3 className="cast-name">{person.name}</h3>
                  <p className="cast-character">{person.character}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
