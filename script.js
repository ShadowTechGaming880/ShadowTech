
/* =========================================
   SHADOWTECH GAMING - MAIN JAVASCRIPT
   ========================================= */


/* =========================================
   1. PC GAME CHECKER
   ========================================= */

function checkGame() {
    const gameElement = document.getElementById("game");
    const ramElement = document.getElementById("ram");
    const cpuElement = document.getElementById("cpu");
    const gpuElement = document.getElementById("gpu");
    const result = document.getElementById("result");

    if (!gameElement || !ramElement || !cpuElement ||
        !gpuElement || !result) {
        return;
    }

    const game = gameElement.value;
    const ram = Number(ramElement.value);
    const cpu = cpuElement.value;
    const gpu = gpuElement.value;

    const games = {
        gta5: {
            name: "GTA V (Legacy)",
            ram: 8,
            cpu: "basic",
            gpu: "entry"
        },
        fifa23: {
            name: "EA SPORTS FIFA 23",
            ram: 8,
            cpu: "mid",
            gpu: "gaming"
        },
        efootball: {
            name: "eFootball",
            ram: 8,
            cpu: "mid",
            gpu: "entry"
        }
    };

    const selected = games[game];

    if (!selected) {
        result.textContent = "Please select a supported game.";
        return;
    }

    const cpuScore = {
        basic: 1,
        mid: 2,
        strong: 3
    };

    const gpuScore = {
        integrated: 1,
        entry: 2,
        gaming: 3
    };

    const issues = [];

    if (ram < selected.ram) {
        issues.push("Your selected RAM is below this tool's screening threshold.");
    }

    if (
        cpuScore[cpu] === undefined ||
        cpuScore[cpu] < cpuScore[selected.cpu]
    ) {
        issues.push("Your processor may be below the expected level.");
    }

    if (
        gpuScore[gpu] === undefined ||
        gpuScore[gpu] < gpuScore[selected.gpu]
    ) {
        issues.push("Your graphics may be insufficient.");
    }

    if (issues.length > 0) {
        result.innerHTML = `
            <h3 style="color:#ffd166">⚠️ Possible Compatibility Issues</h3>
            <p>${issues.map(message =>
                message.replace(/&/g, "&amp;").replace(/</g, "&lt;")
            ).join("<br>")}</p>
            <p>Check the game's official system requirements before deciding.</p>
        `;
    } else {
        result.innerHTML = `
            <h3 style="color:#39ff14">✅ Initial Check Passed!</h3>
            <p>Your selections meet this tool's basic screening profile for
            ${selected.name}.</p>
            <p>This does not guarantee the game will run smoothly.
            Exact processor and graphics models still need checking.</p>
        `;
    }
}


/* =========================================
   2. GAMING NEWS ARTICLE READER
   ========================================= */

const newsArticles = {
    performance: {
        title: "How to Improve Your PC Gaming Performance",
        paragraphs: [
            "Start by checking the recommended system requirements for your game.",
            "Close unnecessary background apps and keep enough free storage space.",
            "Adjust graphics settings if your game runs slowly. Update your graphics drivers using your PC or graphics manufacturer's official tools."
        ]
    },

    releases: {
        title: "How to Discover Upcoming PC Games",
        paragraphs: [
            "Check official game developer websites and digital store release calendars.",
            "Look for confirmed release dates, trailers and demos from trusted sources.",
            "Before buying a game, check its system requirements and whether it supports your computer."
        ]
    },

    install: {
        title: "5 Things to Check Before Installing a Game",
        paragraphs: [
            "1. Compare your processor with the game's requirements.",
            "2. Check your RAM and available storage space.",
            "3. Verify your graphics card and supported graphics features.",
            "4. Check the supported operating system.",
            "5. Download games from official stores or authorized publishers."
        ]
    }
};

const newsSearch = document.getElementById("newsSearch");
const newsFilters = document.querySelectorAll(".news-filter[data-category]");
const newsCards = document.querySelectorAll(".news-card");
const newsEmpty = document.getElementById("newsEmpty");
const articleReader = document.getElementById("articleReader");
const newsGrid = document.getElementById("newsGrid");

let activeCategory = "all";

function filterNews() {
    const searchTerm = newsSearch
        ? newsSearch.value.toLowerCase().trim()
        : "";

    let visibleCount = 0;

    newsCards.forEach(card => {
        const matchesCategory =
            activeCategory === "all" ||
            card.dataset.category === activeCategory;

        const matchesSearch =
            card.textContent.toLowerCase().includes(searchTerm);

        const visible = matchesCategory && matchesSearch;

        card.hidden = !visible;

        if (visible) visibleCount++;
    });

    if (newsEmpty) {
        newsEmpty.hidden = visibleCount !== 0;
    }
}

newsFilters.forEach(button => {
    button.addEventListener("click", () => {
        activeCategory = button.dataset.category;

        newsFilters.forEach(item => {
            item.classList.toggle("active", item === button);
        });

        filterNews();
    });
});

if (newsSearch) {
    newsSearch.addEventListener("input", filterNews);
}

document.querySelectorAll(".read-more").forEach(button => {
    button.addEventListener("click", () => {
        const article = newsArticles[button.dataset.article];

        if (!article || !articleReader || !newsGrid) return;

        const titleElement = document.getElementById("articleTitle");
        const body = document.getElementById("articleBody");

        if (!titleElement || !body) return;

        titleElement.textContent = article.title;
        body.replaceChildren();

        article.paragraphs.forEach(paragraph => {
            const p = document.createElement("p");
            p.textContent = paragraph;
            body.appendChild(p);
        });

        articleReader.hidden = false;
        newsGrid.hidden = true;

        if (newsSearch) newsSearch.hidden = true;

        const filtersContainer = document.querySelector(".news-filters");
        if (filtersContainer) filtersContainer.hidden = true;

        if (newsEmpty) newsEmpty.hidden = true;

        articleReader.scrollIntoView({ behavior: "smooth" });
    });
});

const closeArticleButton = document.getElementById("closeArticle");

if (closeArticleButton) {
    closeArticleButton.addEventListener("click", () => {
        if (!articleReader || !newsGrid) return;

        articleReader.hidden = true;
        newsGrid.hidden = false;

        if (newsSearch) newsSearch.hidden = false;

        const filtersContainer = document.querySelector(".news-filters");
        if (filtersContainer) filtersContainer.hidden = false;

        filterNews();
    });
}

filterNews();


/* =========================================
   3. LIVE GAMING NEWS
   Improved loading, partial results and retry
   ========================================= */

async function loadLiveGamingNews() {
    const grid = document.getElementById("liveNewsGrid");
    const status = document.getElementById("liveNewsStatus");

    if (!grid || !status) return;

    const feeds = [
        {
            name: "IGN",
            url: "https://www.ign.com/rss/v2/articles/feed"
        },
        {
            name: "PC Gamer",
            url: "https://www.pcgamer.com/rss/"
        }
    ];

    // Reuse one retry button instead of creating duplicates.
    let retryButton = document.getElementById("liveNewsRetryButton");

    if (!retryButton) {
        retryButton = document.createElement("button");
        retryButton.id = "liveNewsRetryButton";
        retryButton.type = "button";
        retryButton.className = "news-retry-button";
        retryButton.textContent = "Try again";

        status.insertAdjacentElement("afterend", retryButton);

        retryButton.addEventListener("click", loadLiveGamingNews);
    }

    retryButton.hidden = true;
    retryButton.disabled = false;
    status.textContent = "Loading the latest gaming news...";
    grid.replaceChildren();

    try {
        // A failed source won't prevent the other source from loading.
        const results = await Promise.allSettled(
            feeds.map(async feed => {
                const apiUrl =
                    "https://api.rss2json.com/v1/api.json?rss_url=" +
                    encodeURIComponent(feed.url);

                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(feed.name + " request failed");
                }

                const data = await response.json();

                if (data.status !== "ok" || !Array.isArray(data.items)) {
                    throw new Error(feed.name + " feed unavailable");
                }

                return data.items.map(item => ({
                    title: item.title || "Untitled gaming article",
                    link: item.link || "",
                    description: item.description || "",
                    source: feed.name,
                    date: item.pubDate || ""
                }));
            })
        );

        const failedFeeds = results.filter(
            result => result.status === "rejected"
        ).length;

        const articles = results
            .filter(result => result.status === "fulfilled")
            .flatMap(result => result.value)
            .filter(article => article.link)
            .sort((a, b) => {
                return (Date.parse(b.date) || 0) -
                       (Date.parse(a.date) || 0);
            });

        // Remove duplicate article links.
        const uniqueArticles = [
            ...new Map(
                articles.map(article => [article.link, article])
            ).values()
        ].slice(0, 12);

        if (uniqueArticles.length === 0) {
            status.textContent =
                "Gaming news is temporarily unavailable. Please try again.";

            retryButton.hidden = false;
            return;
        }

        uniqueArticles.forEach(article => {
            const card = document.createElement("article");
            card.className = "live-news-card";

            const source = document.createElement("p");
            source.className = "live-news-source";
            source.textContent = "Source: " + article.source;

            const title = document.createElement("h3");
            title.textContent = article.title;

            const summary = document.createElement("p");

            // Convert RSS HTML descriptions to plain text safely.
            const parser = new DOMParser();
            const parsed = parser.parseFromString(
                article.description,
                "text/html"
            );

            summary.textContent =
                (parsed.body.textContent || "")
                    .replace(/\s+/g, " ")
                    .trim()
                    .slice(0, 180);

            const link = document.createElement("a");
            link.textContent = "Read full story ↗";
            link.href = article.link;
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            card.append(source, title, summary, link);
            grid.appendChild(card);
        });

        if (failedFeeds === 0) {
            status.textContent =
                `Showing ${uniqueArticles.length} latest gaming articles.`;
        } else {
            status.textContent =
                `Showing ${uniqueArticles.length} articles. Some news sources are temporarily unavailable.`;
            retryButton.hidden = false;
        }

    } catch (error) {
        console.error("Gaming news error:", error);

        status.textContent =
            "Gaming news could not load right now. Please try again.";

        retryButton.hidden = false;
    }
}

loadLiveGamingNews();


/* =========================================
   4. TRENDING GAMES SEARCH AND FILTERS
   ========================================= */

const gameSearch = document.getElementById("gameSearch");
const gameCategory = document.getElementById("gameCategory");
const trendingCards = document.querySelectorAll(".trending-card");

function filterTrendingGames() {
    const searchText = gameSearch
        ? gameSearch.value.toLowerCase().trim()
        : "";

    const selectedCategory = gameCategory
        ? gameCategory.value
        : "all";

    let visibleGames = 0;

    trendingCards.forEach(card => {
        const heading = card.querySelector("h3");
        const gameName = heading
            ? heading.textContent.toLowerCase()
            : "";

        const category = card.dataset.category;

        const matchesSearch = gameName.includes(searchText);

        const matchesCategory =
            selectedCategory === "all" ||
            category === selectedCategory;

        const isVisible = matchesSearch && matchesCategory;

        card.hidden = !isVisible;

        if (isVisible) visibleGames++;
    });

    const gameCount = document.getElementById("gameCount");

    if (gameCount) {
        gameCount.textContent =
            `${visibleGames} game${visibleGames === 1 ? "" : "s"} found`;
    }
}

if (gameSearch) {
    gameSearch.addEventListener("input", filterTrendingGames);
}

if (gameCategory) {
    gameCategory.addEventListener("change", filterTrendingGames);
}

filterTrendingGames();
