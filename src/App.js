import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import LightRays from "./LightRays";
import "./App.css";
import MovieTemplate from "./MovieTemplate";
import WishlistPage from "./WishlistPage";
import MovieDetailPage from "./MovieDetailPage"; // Import the new component
import Auth from "./components/Auth";
import { authService } from "./services/authService";
import TextPressure from "./TextPressure";

const TMDB_API_KEY = "397abbabeb0c47f060cf654d072c0c15";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const App = () => {
  const [wishlist, setWishlist] = useState([]);
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecent, setShowRecent] = useState(false);
  const [filters, setFilters] = useState({
    actorDirector: "",
    year: "",
    genre: "",
    ratings: "",
  });
  const [genresList, setGenresList] = useState([]);
  const [suggestedMovies, setSuggestedMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const existingUser = authService.getCurrentUser();
    setCurrentUser(existingUser);
    setIsCheckingAuth(false);
  }, []);

  // Fetch genres list first, then popular movies
  useEffect(() => {
    fetchGenresList();
  }, []);

  // Fetch popular movies when genres are loaded
  useEffect(() => {
    if (genresList.length > 0) {
      fetchPopularMovies();
    }
  }, [genresList]);

  useEffect(() => {
    if (showRecent && genresList.length > 0) {
      fetchPopularMovies();
    }
  }, [showRecent]);

  // Fetch genres list from TMDB
  const fetchGenresList = async () => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=en-US`
      );
      const data = await response.json();
      if (data.genres) {
        setGenresList(data.genres);
      }
    } catch (err) {
      console.error("Error fetching genres list:", err);
    }
  };

  // Fetch movies filtered by server-side filters
  const fetchFilteredMovies = async (filters) => {
    setLoading(true);
    setError(null);
    try {
      let actorDirectorId = null;
      if (filters.actorDirector.trim() !== "") {
        // Search person by name to get ID
        const personResponse = await fetch(
          `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
            filters.actorDirector.trim()
          )}&page=1&include_adult=false`
        );
        const personData = await personResponse.json();
        if (personData.results && personData.results.length > 0) {
          actorDirectorId = personData.results[0].id;
        } else {
          setError("No actor/director found with that name.");
          setSuggestedMovies([]);
          setLoading(false);
          return;
        }
      }

      // Map genre name to genre ID
      let genreId = null;
      if (filters.genre.trim() !== "") {
        const genreObj = genresList.find(
          (g) => g.name.toLowerCase() === filters.genre.trim().toLowerCase()
        );
        if (genreObj) {
          genreId = genreObj.id;
        } else {
          setError("Genre not found.");
          setSuggestedMovies([]);
          setLoading(false);
          return;
        }
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append("api_key", TMDB_API_KEY);
      params.append("language", "en-US");
      params.append("page", "1");
      if (filters.year.trim() !== "") {
        params.append("primary_release_year", filters.year.trim());
      }
      if (genreId) {
        params.append("with_genres", genreId);
      }
      if (actorDirectorId) {
        params.append("with_cast", actorDirectorId);
      }

      // Fetch movies with filters
      const url = `${TMDB_BASE_URL}/discover/movie?${params.toString()}`;
      console.log("Fetching movies with URL:", url);
      const response = await fetch(url);
      const data = await response.json();
      console.log("Filtered movies response:", data);

      if (data.results) {
        // Map genre_ids to genres array with names
        const moviesWithGenres = data.results.map((movie) => {
          if (movie.genre_ids && genresList.length > 0) {
            const genres = movie.genre_ids
              .map((id) => genresList.find((g) => g.id === id))
              .filter(Boolean);
            return { ...movie, genres };
          }
          return movie;
        });

        // Filter by ratings client-side if needed
        let filteredMovies = moviesWithGenres;
        if (filters.ratings.trim() !== "") {
          const ratingNum = parseFloat(filters.ratings);
          if (!isNaN(ratingNum)) {
            filteredMovies = filteredMovies.filter(
              (movie) => movie.vote_average && movie.vote_average >= ratingNum
            );
          }
        }

        // Fetch credits for each movie to get director info
        const moviesWithCredits = await Promise.all(
          filteredMovies.map(async (movie) => {
            const credits = await fetchMovieCredits(movie.id);
            return { ...movie, credits };
          })
        );

        setSuggestedMovies(moviesWithCredits);
      } else {
        setError("No movies found with the given filters.");
        setSuggestedMovies([]);
      }
    } catch (err) {
      console.error("Error fetching filtered movies:", err);
      setError("Error fetching filtered movies.");
      setSuggestedMovies([]);
    }
    setLoading(false);
  };

  // Fetch popular movies from TMDB
  const fetchPopularMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching popular movies with genres list:', genresList.length);
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
      );
      const data = await response.json();
      if (data.results) {
        console.log('First movie genre_ids:', data.results[0]?.genre_ids);
        // Map genre_ids to genres array with names
        const moviesWithGenres = data.results.map((movie) => {
          if (movie.genre_ids && genresList.length > 0) {
            const genres = movie.genre_ids
              .map((id) => genresList.find((g) => g.id === id))
              .filter(Boolean);
            console.log(`Movie ${movie.title} genres:`, genres);
            return { ...movie, genres };
          }
          console.log(`Movie ${movie.title} - no genres mapped`);
          return movie;
        });
        // Fetch credits for each movie to get director info
        const moviesWithCredits = await Promise.all(
          moviesWithGenres.map(async (movie) => {
            const credits = await fetchMovieCredits(movie.id);
            return { ...movie, credits };
          })
        );
        setMovies(moviesWithCredits);
        setSuggestedMovies(moviesWithCredits);
      } else {
        setError("Failed to fetch popular movies.");
      }
    } catch (err) {
      setError("Error fetching popular movies.");
    }
    setLoading(false);
  };

  // Fetch movie credits (cast and crew) by movie ID
  const fetchMovieCredits = async (movieId) => {
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`
      );
      const data = await response.json();
      return data;
    } catch {
      return null;
    }
  };

  // Search movies by name using TMDB search API
  const searchMovies = async (query) => {
    if (!query) {
      setSuggestedMovies([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(
          query
        )}&page=1&include_adult=false`
      );
      const data = await response.json();
      if (data.results) {
        // Map genre_ids to genres array with names
        const moviesWithGenres = data.results.map((movie) => {
          if (movie.genre_ids && genresList.length > 0) {
            const genres = movie.genre_ids
              .map((id) => genresList.find((g) => g.id === id))
              .filter(Boolean);
            return { ...movie, genres };
          }
          return movie;
        });
        // Fetch credits for each movie
        const moviesWithCredits = await Promise.all(
          moviesWithGenres.map(async (movie) => {
            const credits = await fetchMovieCredits(movie.id);
            return { ...movie, credits };
          })
        );
        setSuggestedMovies(moviesWithCredits);
      } else {
        setError("No movies found.");
        setSuggestedMovies([]);
      }
    } catch (err) {
      setError("Error searching movies.");
      setSuggestedMovies([]);
    }
    setLoading(false);
  };

  // Handle search by movie name
  const handleSearch = () => {
    setShowRecent(false);
    searchMovies(searchQuery);
  };

  // Handle Recent button toggle
  const handleRecent = () => {
    setSearchQuery("");
    setFilters({
      actorDirector: "",
      year: "",
      genre: "",
      ratings: "",
    });
    setShowRecent(true);
  };

  // Handle input change for filters
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log(`Filter input changed: ${name} = ${value}`);
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Filter movies based on filters locally (since TMDB API does not support all filters directly)
  const filterMovies = (moviesList) => {
    let filtered = moviesList;

    if (filters.actorDirector.trim() !== "") {
      filtered = filtered.filter((movie) => {
        if (!movie.credits || !movie.credits.crew) return false;
        const directors = movie.credits.crew.filter((c) => c.job === "Director");
        return directors.some((d) =>
          d.name.toLowerCase().includes(filters.actorDirector.toLowerCase())
        );
      });
    }

    if (filters.year.trim() !== "") {
      filtered = filtered.filter((movie) => {
        if (!movie.release_date) return false;
        return movie.release_date.startsWith(filters.year);
      });
    }

    if (filters.genre.trim() !== "") {
      filtered = filtered.filter((movie) => {
        if (!movie.genre_ids && !movie.genres) {
          // fallback to genres array if available
          if (movie.genres) {
            return movie.genres.some((g) =>
              g.name.toLowerCase().includes(filters.genre.toLowerCase())
            );
          }
          return false;
        }
        // genre_ids filtering is limited without genre mapping, so fallback to genres if available
        return false;
      });
    }

    if (filters.ratings.trim() !== "") {
      const ratingNum = parseFloat(filters.ratings);
      if (!isNaN(ratingNum)) {
        filtered = filtered.filter(
          (movie) => movie.vote_average && movie.vote_average >= ratingNum
        );
      }
    }

    return filtered;
  };

  // Handle Give Suggestion button
  const handleSuggestion = () => {
    setShowRecent(false);
    // Filter from the original movies list to avoid cumulative filtering
    const filtered = filterMovies(movies);
    setSuggestedMovies(filtered);
  };

  // Handle Enter key for search and suggestion inputs
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (document.activeElement.name === "search") {
        handleSearch();
      } else {
        // Trigger server-side filtering on Enter in filter inputs
        setShowRecent(false);
        fetchFilteredMovies(filters);
      }
    }
  };

  // Toggle wishlist function
  const toggleWishlist = (movie) => {
    console.log("Toggling wishlist for movie:", movie.title);
    setWishlist((prev) => {
      const isInWishlist = prev.some((m) => m.id === movie.id);
      return isInWishlist ? prev.filter((m) => m.id !== movie.id) : [...prev, movie];
    });
  };

  // Handle successful authentication
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
  };

  // Handle logout
  const handleLogout = () => {
    authService.signOut();
    setCurrentUser(null);
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Show Auth component if user is not authenticated
  if (!currentUser) {
    return (
      <div className="app-container">
        <LightRays
          raysOrigin="top-center"
          raysColor="#00ffff"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="background-rays"
        />
        <Auth onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <LightRays
          raysOrigin="top-center"
          raysColor="#00ffff"
          raysSpeed={1.5}
          lightSpread={0.8}
          rayLength={1.2}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0.1}
          distortion={0.05}
          className="background-rays"
        />
        <header className="header">
          <nav className="nav-tabs" style={{ justifyContent: 'flex-end' }}>
            {/* Removed Home link */}
          </nav>
          {/* User info and logout button - positioned at top-right corner */}
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            zIndex: 1000
          }}>
            <span style={{ color: 'white', fontWeight: 'bold' }}>
              Welcome, {currentUser.username}!
            </span>
            <button
              onClick={handleLogout}
              style={{ 
                padding: '10px 20px', 
                fontWeight: '600', 
                borderRadius: '8px', 
                background: 'linear-gradient(135deg, #00ffff, #0099cc)', 
                border: '1px solid #00ffff',
                color: '#000000',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'Inter, system-ui, sans-serif',
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 0 25px rgba(0, 255, 255, 0.6)';
                e.target.style.background = 'linear-gradient(135deg, #00cccc, #007799)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.4)';
                e.target.style.background = 'linear-gradient(135deg, #00ffff, #0099cc)';
              }}
            >
              🚪 Logout
            </button>
          </div>
          <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
            <Link
              to="/wishlist"
              style={{ 
                padding: '10px 20px', 
                fontWeight: '600', 
                borderRadius: '8px', 
                background: 'rgba(0, 255, 255, 0.1)', 
                border: '1px solid #00ffff', 
                color: '#00ffff',
                textDecoration: 'none',
                fontSize: '14px',
                fontFamily: 'Inter, system-ui, sans-serif',
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 0 25px rgba(0, 255, 255, 0.5)';
                e.target.style.background = 'rgba(0, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.3)';
                e.target.style.background = 'rgba(0, 255, 255, 0.1)';
              }}
            >
              ❤️ Wishlist ({wishlist.length})
            </Link>
          </div>
          {/* MovieZone Title */}
          <div style={{
            position: 'absolute',
            top: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '400px',
            height: '50px',
            zIndex: 999
          }}>
            <TextPressure
              text="MovieZone"
              flex={true}
              alpha={false}
              stroke={false}
              width={true}
              weight={true}
              italic={true}
              textColor="#ffffff"
              strokeColor="#ff0000"
              minFontSize={36}
            />
          </div>
          <div className="search-container" style={{ marginTop: '80px' }}>
            <input
              type="text"
              name="search"
              placeholder="Search by movie name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="search-input"
              autoComplete="off"
            />
          </div>
        </header>
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  <div className="filters-container">
                    <div className="filter-item">
                      <label htmlFor="actorDirector">Actor/Director:</label>
                      <input
                        type="text"
                        id="actorDirector"
                        name="actorDirector"
                        value={filters.actorDirector}
                        onChange={handleFilterChange}
                        onKeyDown={handleKeyDown}
                        className="filter-input"
                      />
                    </div>
                    <div className="filter-item">
                      <label htmlFor="year">Year:</label>
                      <input
                        type="number"
                        id="year"
                        name="year"
                        value={filters.year}
                        onChange={handleFilterChange}
                        onKeyDown={handleKeyDown}
                        className="filter-input"
                      />
                    </div>
                    <div className="filter-item">
                      <label htmlFor="genre">Genre:</label>
                      <input
                        type="text"
                        id="genre"
                        name="genre"
                        value={filters.genre}
                        onChange={handleFilterChange}
                        onKeyDown={handleKeyDown}
                        className="filter-input"
                      />
                    </div>
                    <div className="filter-item">
                      <label htmlFor="ratings">Ratings:</label>
                      <input
                        type="number"
                        id="ratings"
                        name="ratings"
                        min="1"
                        max="10"
                        step="0.1"
                        value={filters.ratings}
                        onChange={handleFilterChange}
                        onKeyDown={handleKeyDown}
                        className="filter-input"
                      />
                    </div>
                    <button
                      className="suggestion-button"
                      onClick={() => {
                        setShowRecent(false);
                        fetchFilteredMovies(filters);
                      }}
                    >
                      Give Suggestion
                    </button>
                  </div>
                  <div className="movies-display">
                    {loading ? (
                      <p>Loading movies...</p>
                    ) : error ? (
                      <p className="error-message">{error}</p>
                    ) : suggestedMovies.length > 0 ? (
                      suggestedMovies.map((movie) => (
                        <MovieTemplate
                          key={movie.id}
                          movie={movie}
                          wishlist={wishlist}
                          toggleWishlist={toggleWishlist}
                        />
                      ))
                    ) : (
                      <p className="no-results">No movies to display.</p>
                    )}
                  </div>
                </div>
              }
            />
            <Route
              path="/wishlist"
              element={<WishlistPage wishlist={wishlist} toggleWishlist={toggleWishlist} />}
            />
            <Route path="/movie/:movieId" element={<MovieDetailPage />} /> {/* New route for movie details */}
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;


