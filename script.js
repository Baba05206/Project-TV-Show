// ...existing code...

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
    console.error("Error fetching shows:", error); // Debugging log
    alert("Failed to load shows. Please try again later.");
  }
}

function populateEpisodeSelector(episodes) {
  const selector = document.getElementById("episode-selector");

  episodes.forEach((episode) => {
    const option = document.createElement("option");
    option.value = episode.id; // Assuming each episode has a unique ID
    option.textContent = `${makeEpisodeCode(episode)} - ${episode.name}`;
    selector.appendChild(option);
  });
}

// Call this function during setup
function setup() {
  fetchAndPopulateShows();
  const allEpisodes = getAllEpisodes(); // provided in episodes.js
  makePageForEpisodes(allEpisodes);
  populateEpisodeSelector(allEpisodes);
}

function fetchEpisodes() {
  const url = "https://api.tvmaze.com/shows/82/episodes";
  const rootElem = document.getElementById("episodes");
  rootElem.innerHTML = "<p class='loading'>Loading episodes…</p>"; // Show loading message

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(data => {
      makePageForEpisodes(data);
    })
    .catch(error => {
      rootElem.innerHTML = "<p class='error'>Failed to load episodes. Please try again later.</p>"; // Show error message
      console.error("Fetch error:", error); // For debugging purposes
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
  article.id = `episode-${ep.id}`; // Add unique ID for scrolling

  // image (medium preferred)
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

  // body
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

  // optional link (matches example look)
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
  container.innerHTML = ""; // clear loading

  if (!Array.isArray(episodeList) || episodeList.length === 0) {
    const msg = document.createElement("p");
    msg.className = "loading";
    msg.textContent = "No episodes found.";
    container.appendChild(msg);
    return;
  }

  // append each episode card to the grid
  episodeList.forEach((ep) => {
    const card = createEpisodeCard(ep);
    container.appendChild(card);
  });

  // status row that spans full width
  const status = document.createElement("p");
  status.className = "loading";
  status.textContent = `Got ${episodeList.length} episode(s)`;
  container.appendChild(status);
}

// Removed the reset button functionality

window.onload = setup;

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

document.getElementById("episode-selector").addEventListener("change", (event) => {
  const selectedEpisodeId = event.target.value;

  if (selectedEpisodeId) {
    const episodeElement = document.getElementById(`episode-${selectedEpisodeId}`);
    if (episodeElement) {
      episodeElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
});

document.getElementById("show-selector").addEventListener("change", async (event) => {
  const selectedShowId = event.target.value;
  console.log("Selected show ID:", selectedShowId); // Debugging log

  try {
    if (selectedShowId) {
      const response = await fetch(`https://api.tvmaze.com/shows/${selectedShowId}/episodes`);
      if (!response.ok) {
        throw new Error(`Failed to fetch episodes: ${response.status}`);
      }
      const episodes = await response.json();

      console.log("Fetched episodes:", episodes); // Debugging log
      makePageForEpisodes(episodes);
      populateEpisodeSelector(episodes);
    } else {
      const allEpisodes = getAllEpisodes(); // Default to all episodes
      makePageForEpisodes(allEpisodes);
      populateEpisodeSelector(allEpisodes);
    }
  } catch (error) {
    console.error("Error fetching episodes:", error); // Debugging log
    alert("Failed to load episodes. Please try again later.");
  }
});