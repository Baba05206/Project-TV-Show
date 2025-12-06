// ...existing code...

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
  const allEpisodes = getAllEpisodes(); // provided in episodes.js
  makePageForEpisodes(allEpisodes);
  populateEpisodeSelector(allEpisodes);
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
  const container = document.getElementById("episodes") || document.getElementById("root");
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

  // status row that spans full width (keeps parity with example)
  const status = document.createElement("p");
  status.className = "loading";
  status.textContent = `Got ${episodeList.length} episode(s)`;
  container.appendChild(status);
}

// Reset functionality
const resetButton = document.createElement("button");
resetButton.textContent = "Show All Episodes";
resetButton.id = "reset-button";
resetButton.addEventListener("click", () => {
  const allEpisodes = getAllEpisodes();
  makePageForEpisodes(allEpisodes);
  document.getElementById("episode-selector").value = ""; // Reset selector
});

document.getElementById("selector-container").appendChild(resetButton);

window.onload = setup;

document.getElementById("search-box").addEventListener("input", (event) => {
  const searchTerm = event.target.value.toLowerCase();
  const allEpisodes = getAllEpisodes();

  const filteredEpisodes = allEpisodes.filter((episode) => {
    const nameMatch = episode.name.toLowerCase().includes(searchTerm);
    const summaryMatch = episode.summary && episode.summary.toLowerCase().includes(searchTerm);
    return nameMatch || summaryMatch;
  });

  makePageForEpisodes(filteredEpisodes);

  const searchCount = document.getElementById("search-count");
  searchCount.textContent = `${filteredEpisodes.length} episode(s) found`;
});

document.getElementById("episode-selector").addEventListener("change", (event) => {
  const selectedEpisodeId = event.target.value;
  const allEpisodes = getAllEpisodes();

  if (selectedEpisodeId) {
    const selectedEpisode = allEpisodes.find((episode) => episode.id == selectedEpisodeId);
    makePageForEpisodes([selectedEpisode]);
  } else {
    makePageForEpisodes(allEpisodes);
  }
});