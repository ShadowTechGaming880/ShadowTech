
function checkGame() {
    const game = document.getElementById("game").value;
    const ram = Number(document.getElementById("ram").value);
    const cpu = document.getElementById("cpu").value;
    const gpu = document.getElementById("gpu").value;
    const result = document.getElementById("result");

    // Approximate screening profiles, not official requirements.
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

    let issues = [];

    if (ram < selected.ram) {
        issues.push("Your selected RAM is below the screening threshold.");
    }

    if (cpuScore[cpu] < cpuScore[selected.cpu]) {
        issues.push("Your processor may be below the expected level.");
    }

    if (gpuScore[gpu] < gpuScore[selected.gpu]) {
        issues.push("Your graphics may be insufficient.");
    }

    if (issues.length > 0) {
        result.innerHTML = `
            <h3 style="color:#ffd166">⚠️ Possible Compatibility Issues</h3>
            <p>${issues.join("<br>")}</p>
            <p>Check the game's official system requirements
            before deciding.</p>
        `;
    } else {
        result.innerHTML = `
            <h3 style="color:#39ff14">✅ Initial Check Passed!</h3>
            <p>Your selections meet this tool's basic screening profile
            for ${selected.name}.</p>
            <p>This does not guarantee the game will run.
            Exact processor and graphics models still need checking.</p>
        `;
    }
}

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
    const searchTerm = newsSearch.value.toLowerCase().trim();
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

    newsEmpty.hidden = visibleCount !== 0;
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

newsSearch.addEventListener("input", filterNews);

document.querySelectorAll(".read-more").forEach(button => {
    button.addEventListener("click", () => {
        const article = newsArticles[button.dataset.article];

        if (!article) return;

        document.getElementById("articleTitle").textContent =
            article.title;

        const body = document.getElementById("articleBody");
        body.replaceChildren();

        article.paragraphs.forEach(paragraph => {
            const p = document.createElement("p");
            p.textContent = paragraph;
            body.appendChild(p);
        });

        articleReader.hidden = false;
        newsGrid.hidden = true;
        newsSearch.hidden = true;
        document.querySelector(".news-filters").hidden = true;
        newsEmpty.hidden = true;

        articleReader.scrollIntoView({ behavior: "smooth" });
    });
});

document.getElementById("closeArticle").addEventListener("click", () => {
    articleReader.hidden = true;
    newsGrid.hidden = false;
    newsSearch.hidden = false;
    document.querySelector(".news-filters").hidden = false;

    filterNews();
});

filterNews();

async function loadLiveGamingNews() {
    const grid = document.getElementById("liveNewsGrid");
    const status = document.getElementById("liveNewsStatus");

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

    try {
        const results = await Promise.all(
            feeds.map(async feed => {
                const apiUrl =
                    "https://api.rss2json.com/v1/api.json?rss_url=" +
                    encodeURIComponent(feed.url);

                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error("News request failed");
                }

                const data = await response.json();

                if (data.status !== "ok") {
                    throw new Error("Feed unavailable");
                }

                return data.items.map(item => ({
                    title: item.title,
                    link: item.link,
                    description: item.description,
                    source: feed.name,
                    date: item.pubDate
                }));
            })
        );

        const articles = results
            .flat()
            .sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            )
            .slice(0, 12);

        grid.replaceChildren();

        articles.forEach(article => {
            const card = document.createElement("article");
            card.className = "live-news-card";

            const source = document.createElement("p");
            source.textContent = "Source: " + article.source;

            const title = document.createElement("h3");
            title.textContent = article.title;

            const summary = document.createElement("p");
            const temp = document.createElement("div");
            temp.innerHTML = article.description || "";
            summary.textContent =
                (temp.textContent || "").trim().slice(0, 180);

            const link = document.createElement("a");
            link.textContent = "Read full story ↗";
            link.href = article.link;
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            card.append(source, title, summary, link);
            grid.appendChild(card);
        });

        status.textContent =
            `Showing ${articles.length} latest gaming articles.`;

    } catch (error) {
        status.textContent =
            "News could not load right now. Please try again later.";
        console.error("Gaming news error:", error);
    }
}

loadLiveGamingNews();

const gameSearch = document.getElementById("gameSearch");
const gameCategory = document.getElementById("gameCategory");
const trendingCards = document.querySelectorAll(".trending-card");


function filterTrendingGames() {
    const searchText = gameSearch.value.toLowerCase().trim();
    const selectedCategory = gameCategory.value;
    let visibleGames = 0;

    trendingCards.forEach(card => {
        const gameName = card.querySelector("h3").textContent.toLowerCase();
        const category = card.dataset.category;

        const matchesSearch = gameName.includes(searchText);
        const matchesCategory =
            selectedCategory === "all" ||
            category === selectedCategory;

        const isVisible = matchesSearch && matchesCategory;

        card.hidden = !isVisible;

        if (isVisible) {
            visibleGames++;
        }
    });

    document.getElementById("gameCount").textContent =
        `${visibleGames} game${visibleGames === 1 ? "" : "s"} found`;
}


gameSearch.addEventListener("input", filterTrendingGames);
gameCategory.addEventListener("change", filterTrendingGames);
filterTrendingGames();
