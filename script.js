//JS existing code

const showCache = {};
const episodeCache = {}; // NEW: Cache for episodes to avoid re-fetching
let allShows = []; // NEW: Array of all sorted shows for easy access

async function fetchAndPopulateShows() {
  const showSelector = document.getElementById("show-selector");

  try {
    if (Object.keys(showCache).length === 0) {
      console.log("Fetching shows from API...");
      const response = await fetch("https://api.tvmaze.com/shows");
      if (!response.ok) {
        throw new Error(`Failed to fetch shows: ${response.status}`);
      }
      const shows = await response.json();
      // Cache shows and sort alphabetically (case-insensitive)
      shows.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      allShows = shows; // Store sorted list
      shows.forEach((show) => {
        showCache[show.id] = show;
      });
    }

    // Populate the show selector
    // Use allShows which is already sorted
    allShows.forEach((show) => {
      const option = document.createElement("option");
      option.value = show.id;
      option.textContent = show.name;
      showSelector.appendChild(option);
    });

    // NEW: Display the show listing after fetching/caching
    makePageForShows(allShows);

  } catch (error) {
    console.error("Error fetching shows:", error); 
    alert("Failed to load shows. Please try again later.");
  }
}

// NEW: Function to create a show card
function createShowCard(show) {
  const article = document.createElement("article");
  article.className = "show-card";
  article.dataset.showId = show.id; // Store ID for click handling
  
  // Image
  if (show.image && (show.image.medium || show.image.original)) {
    const img = document.createElement("img");
    img.src = show.image.medium || show.image.original;
    img.alt = `${show.name} Poster`;
    img.className = "show-media";
    article.appendChild(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "show-media";
    placeholder.textContent = 'No Image';
    article.appendChild(placeholder);
  }

  const body = document.createElement("div");
  body.className = "show-body";

  const title = document.createElement("h2");
  title.className = "show-title";
  title.textContent = show.name;
  body.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "show-meta";
  // Display all required show details
  meta.innerHTML = `Rated: **${show.rating.average || 'N/A'}** | Genres: **${show.genres.join(', ')}**<br>Status: **${show.status}** | Runtime: **${show.runtime || 'N/A'} mins**`;
  body.appendChild(meta);

  const summary = document.createElement("div");
  summary.className = "show-summary";
  summary.innerHTML = show.summary ? show.summary : "<em>No summary available.</em>";
  body.appendChild(summary);

  article.appendChild(body);
  return article;
}

// NEW: Function to render the list of shows
function makePageForShows(showList) {
  const container = document.getElementById("shows-listing");
  container.innerHTML = "";
  if (!Array.isArray(showList) || showList.length === 0) {
    container.innerHTML = `<p class="loading">No shows found.</p>`;
    return;
  }

  showList.forEach((show) => {
    const card = createShowCard(show);
    container.appendChild(card);
  });

  const status = document.createElement("p");
  status.className = "loading";
  status.textContent = `Showing ${showList.length} show(s)`;
  container.appendChild(status);

  // Add event listeners to newly created show cards
  document.querySelectorAll(".show-card").forEach(card => {
    card.addEventListener('click', (event) => {
        // Find the showId, either on the article or an ancestor
        const selectedShowId = event.currentTarget.dataset.showId;
        
        // Update the show selector dropdown to reflect the clicked show
        const showSelector = document.getElementById("show-selector");
        showSelector.value = selectedShowId;

        // Manually trigger the episode fetching/display logic
        handleShowSelection(selectedShowId);
    });
  });
}

// NEW: Function to switch the UI view
function switchView(view) {
    const showsListing = document.getElementById("shows-listing");
    const episodesListing = document.getElementById("episodes");
    const episodeSelector = document.getElementById("episode-selector");
    const showSelector = document.getElementById("show-selector");
    const searchBox = document.getElementById("search-box");
    const searchCount = document.getElementById("search-count");
    const backButton = document.getElementById("show-list-button");

    if (view === 'shows') {
        showsListing.style.display = 'grid';
        episodesListing.style.display = 'none';
        showSelector.style.display = 'block';
        episodeSelector.style.display = 'none';
        backButton.style.display = 'none';
        searchBox.placeholder = "Search shows...";
        searchBox.value = ""; // Clear search
        searchBox.dataset.currentView = 'shows'; // Track current view for search listener
        searchCount.textContent = `${allShows.length} show(s) found`; // Initial count
        
        // Reset episode-related items
        showSelector.value = "";
        episodeSelector.innerHTML = `<option value="">Select an episode...</option>`;

        // Re-display all shows (resets search filter if one was active)
        makePageForShows(allShows); 
    } else if (view === 'episodes') {
        showsListing.style.display = 'none';
        episodesListing.style.display = 'grid';
        showSelector.style.display = 'none'; 
        episodeSelector.style.display = 'block';
        backButton.style.display = 'block';
        searchBox.placeholder = "Search episodes...";
        searchBox.value = ""; // Clear search
        searchBox.dataset.currentView = 'episodes'; // Track current view for search listener
        searchCount.textContent = ``; // Reset episode count until episodes load
    }
}

// NEW: Combined show selection handler
async function handleShowSelection(selectedShowId) {
    if (selectedShowId) {
        switchView('episodes');
        const episodes = await fetchEpisodes(selectedShowId);
        populateEpisodeSelector(episodes);
        // Ensure episode search results are visible after loading
        const searchCount = document.getElementById("search-count");
        if(episodes) {
            searchCount.textContent = `${episodes.length} episode(s) found`;
        } else {
             searchCount.textContent = `0 episode(s) found`;
        }
    } else {
        // Selected "Select a show..." option from the dropdown
        switchView('shows');
    }
}


function populateEpisodeSelector(episodes) {
  const selector = document.getElementById("episode-selector");
  selector.innerHTML = `<option value="">Select an episode...</option>`;
  // reset

  if (!episodes) return; // Handle case where fetchEpisodes failed

  episodes.forEach((episode) => {
    const option = document.createElement("option");
    option.value = episode.id;
    option.textContent = `${makeEpisodeCode(episode)} - ${episode.name}`;
    selector.appendChild(option);
  });
}

// Called on page load
function setup() {
  // Initial setup now calls the new show-fetching logic
  fetchAndPopulateShows();
  
  // Set initial view to show listing
  switchView('shows'); 
  
  // NEW: Add event listeners for new features
  setupEventListeners(); 
  
  // initial helpful message is now set by switchView('shows')
}

// NEW: Consolidate event listeners setup
function setupEventListeners() {
    // SEARCH FILTER - Updated to handle both shows and episodes
    document.getElementById("search-box").addEventListener("input", (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const currentView = event.target.dataset.currentView;
        let matchCount = 0;
        const searchCount = document.getElementById("search-count");

        if (currentView === 'shows') {
            const showCards = document.querySelectorAll(".show-card");
            showCards.forEach((card) => {
                const show = allShows.find(s => String(s.id) === card.dataset.showId);
                
                // Search show names, genres, and summary
                const name = show.name.toLowerCase();
                const summary = show.summary ? show.summary.toLowerCase() : '';
                const genres = show.genres.map(g => g.toLowerCase()).join(' ');

                if (name.includes(searchTerm) || summary.includes(searchTerm) || genres.includes(searchTerm)) {
                    card.style.display = "flex"; // flex because of the CSS
                    matchCount++;
                } else {
                    card.style.display = "none";
                }
            });
            searchCount.textContent = `${matchCount} show(s) found`;
        } else {
            // EXISTING EPISODE SEARCH LOGIC
            const episodeCards = document.querySelectorAll(".episode-card");

            episodeCards.forEach((card) => {
                const title = card.querySelector(".episode-title").textContent.toLowerCase();
                const summary = card.querySelector(".episode-summary").textContent.toLowerCase();
            
                if (title.includes(searchTerm) || summary.includes(searchTerm)) {
                    card.style.display = "block";
                    matchCount++;
                } else {
                    card.style.display = "none";
                }
            });
            searchCount.textContent = `${matchCount} episode(s) found`;
        }
    });

    // EPISODE SELECT DROPDOWN SCROLLING (Existing)
    document.getElementById("episode-selector").addEventListener("change", (event) => {
        const selectedEpisodeId = event.target.value;

        if (selectedEpisodeId) {
            const episodeElement = document.getElementById(`episode-${selectedEpisodeId}`);
            if (episodeElement) {
                episodeElement.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }
    });

    // SHOW SELECTOR – fetch episodes for selected show (Updated)
    document.getElementById("show-selector").addEventListener("change", async (event) => {
        const selectedShowId = event.target.value;
        console.log("Selected show ID:", selectedShowId);
        
        // Use the new combined handler
        handleShowSelection(selectedShowId);
    });

    // NEW: Back to Shows button listener
    document.getElementById("show-list-button").addEventListener("click", () => {
        switchView('shows');
    });
}


function fetchEpisodes(showId) {
    if (episodeCache[showId]) {
        console.log(`Returning cached episodes for show ID: ${showId}`);
        makePageForEpisodes(episodeCache[showId]);
        return Promise.resolve(episodeCache[showId]); // Return cached data
    }

  const url = `https://api.tvmaze.com/shows/${showId}/episodes`;
  const rootElem = document.getElementById("episodes");
  // Show helpful loading message
  rootElem.innerHTML = `<p class='loading'>Loading episode list…</p>`;
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(data => {
      episodeCache[showId] = data; // Cache fetched data
      makePageForEpisodes(data);
      return data;
    })
    .catch(error => {
      rootElem.innerHTML = "<p class='error'>Failed to load episodes. Please try again later.</p>";
      console.error("Fetch error:", error);
      return null; // Return null on failure
 
    });
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function makeEpisodeCode(episode) {
  return `S${pad2(episode.season)}E${pad2(episode.number)}`;
}

function createEpisodeCard(ep) {
  const article = document.createElement("article");
  article.className = "episode-card";
  article.id = `episode-${ep.id}`;
  // image if available
  if (ep.image && (ep.image.medium || ep.image.original)) {
    const img = document.createElement("img");
    img.src = ep.image.medium || ep.image.original;
    img.alt = `${makeEpisodeCode(ep)} - ${ep.name}`;
    img.className = "episode-media";
    article.appendChild(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "episode-media";
    article.appendChild(placeholder);
  }

  const body = document.createElement("div");
  body.className = "episode-body";

  const title = document.createElement("h2");
  title.className = "episode-title";
  title.textContent = `${makeEpisodeCode(ep)} - ${ep.name}`;
  body.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "episode-meta";
  meta.textContent = `Season ${ep.season}, Episode ${ep.number}`;
  body.appendChild(meta);

  const summary = document.createElement("div");
  summary.className = "episode-summary";
  summary.innerHTML = ep.summary ? ep.summary : "<em>No summary available.</em>";
  body.appendChild(summary);

  if (ep.url) {
    const link = document.createElement("a");
    link.href = ep.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View on TVMaze";
    body.appendChild(link);
  }

  article.appendChild(body);
  return article;
}

function makePageForEpisodes(episodeList) {
  const container = document.getElementById("episodes");
  container.innerHTML = "";
  if (!Array.isArray(episodeList) || episodeList.length === 0) {
    container.innerHTML = `<p class="loading">No episodes found.</p>`;
    return;
  }

  episodeList.forEach((ep) => {
    const card = createEpisodeCard(ep);
    container.appendChild(card);
  });
  const status = document.createElement("p");
  status.className = "loading";
  status.textContent = `Showing ${episodeList.length} episode(s)`;
  container.appendChild(status);
}

window.onload = setup;