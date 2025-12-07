//JS existing code

const showCache = {};

async function fetchAndPopulateShows() {
  const showSelector = document.getElementById("show-selector");

  try {
    if (Object.keys(showCache).length === 0) {
      console.log("Fetching shows from API..."); // Debugging log
      const response = await fetch("https://api.tvmaze.com/shows");
      if (!response.ok) {
        throw new Error(`Failed to fetch shows: ${response.status}`);
      }
      const shows = await response.json();

      // Cache shows and sort alphabetically (case-insensitive)
      shows.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
      shows.forEach((show) => {
        showCache[show.id] = show;
      });
    }

    // Populate the show selector
    Object.values(showCache).forEach((show) => {
      const option = document.createElement("option");
      option.value = show.id;
      option.textContent = show.name;
      showSelector.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching shows:", error); 
    alert("Failed to load shows. Please try again later.");
  }
}

function populateEpisodeSelector(episodes) {
  const selector = document.getElementById("episode-selector");
  selector.innerHTML = `<option value="">Select an episode...</option>`; // reset

  episodes.forEach((episode) => {
    const option = document.createElement("option");
    option.value = episode.id;
    option.textContent = `${makeEpisodeCode(episode)} - ${episode.name}`;
    selector.appendChild(option);
  });
}

// Called on page load
function setup() {
  fetchAndPopulateShows();
  
  // initial helpful message
  const rootElem = document.getElementById("episodes");
  rootElem.innerHTML = "<p class='loading'>Select a show to display episodes.</p>";

  // default episodes if needed
  const allEpisodes = getAllEpisodes(); // provided in episodes.js
  populateEpisodeSelector(allEpisodes);
}

function fetchEpisodes(showId) {
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
      makePageForEpisodes(data);
      return data;
    })
    .catch(error => {
      rootElem.innerHTML = "<p class='error'>Failed to load episodes. Please try again later.</p>";
      console.error("Fetch error:", error);
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

// SEARCH FILTER
document.getElementById("search-box").addEventListener("input", (event) => {
  const searchTerm = event.target.value.toLowerCase();
  const episodeCards = document.querySelectorAll(".episode-card");

  let matchCount = 0;

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

  const searchCount = document.getElementById("search-count");
  searchCount.textContent = `${matchCount} episode(s) found`;
});

// EPISODE SELECT DROPDOWN SCROLLING
document.getElementById("episode-selector").addEventListener("change", (event) => {
  const selectedEpisodeId = event.target.value;

  if (selectedEpisodeId) {
    const episodeElement = document.getElementById(`episode-${selectedEpisodeId}`);
    if (episodeElement) {
      episodeElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
});

// SHOW SELECTOR – fetch episodes for selected show
document.getElementById("show-selector").addEventListener("change", async (event) => {
  const selectedShowId = event.target.value;
  console.log("Selected show ID:", selectedShowId);

  try {
    if (selectedShowId) {
      const episodes = await fetchEpisodes(selectedShowId);
      populateEpisodeSelector(episodes);
    } else {
      // resetting to default episodes
      const allEpisodes = getAllEpisodes();
      makePageForEpisodes(allEpisodes);
      populateEpisodeSelector(allEpisodes);
    }
  } catch (error) {
    console.error("Error fetching episodes:", error);
    alert("Failed to load episodes. Please try again later.");
  }
});
