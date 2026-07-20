/* =========================================================
   BUSCADOR DE ESCUELAS
   ========================================================= */

function initializeSearch() {
    const input = byId("searchInput");

    if (!input) {
        console.warn(
            "No se encontró #searchInput."
        );

        return;
    }

    let resultsContainer = byId("searchResults");

    if (!resultsContainer) {
        resultsContainer = document.createElement("div");
        resultsContainer.id = "searchResults";
        resultsContainer.className = "search-results";

        input.parentElement.appendChild(resultsContainer);
    }

    input.addEventListener(
        "input",
        debounce(event => {
            renderSearchResults(event.target.value);
        }, 180)
    );

    input.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            hideSearchResults();
        }
    });

    document.addEventListener("click", event => {
        if (
            !event.target.closest("#searchInput") &&
            !event.target.closest("#searchResults")
        ) {
            hideSearchResults();
        }
    });
}


function renderSearchResults(query) {
    const container = byId("searchResults");

    if (!container) return;

    const normalizedQuery = normalizeString(query);

    if (normalizedQuery.length < 2) {
        hideSearchResults();
        return;
    }

    const matches = SIGPE.data.escuelas
        .filter(school => {
            const name = normalizeString(school.nombre);
            const cct = normalizeString(school.cct);
            const alcaldia = normalizeString(school.alcaldia);

            return (
                name.includes(normalizedQuery) ||
                cct.includes(normalizedQuery) ||
                alcaldia.includes(normalizedQuery)
            );
        })
        .slice(0, 12);

    if (matches.length === 0) {
        container.innerHTML = `
            <div class="search-empty">
                No se encontraron escuelas.
            </div>
        `;

        container.classList.add("visible");
        return;
    }

    container.innerHTML = matches
        .map(school => `
            <button
                type="button"
                class="search-result-item"
                onclick="selectSearchSchool('${escapeAttribute(
                    school.id || school.cct
                )}')"
            >
                <strong>${escapeHTML(school.nombre)}</strong>

                <span>
                    ${escapeHTML(school.cct)} ·
                    ${escapeHTML(school.nivel)}
                </span>

                <small>${escapeHTML(school.alcaldia)}</small>
            </button>
        `)
        .join("");

    container.classList.add("visible");
}


function selectSearchSchool(identifier) {
    const school = SIGPE.data.escuelas.find(item =>
        String(item.id || item.cct) === String(identifier)
    );

    if (!school) return;

    hideSearchResults();
    zoomToSchoolAGEB(school);
    selectSchool(school);
}


function zoomToSchoolAGEB(school) {
    const feature = SIGPE.data.ageb.features.find(item =>
        String(item.properties.CVEGEO || "") ===
        String(school.cvegeo || "")
    );

    if (!feature) return;

    const bounds = L.geoJSON(feature).getBounds();

    if (bounds.isValid()) {
        SIGPE.map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 16
        });
    }
}


function hideSearchResults() {
    const container = byId("searchResults");

    if (!container) return;

    container.classList.remove("visible");
    container.innerHTML = "";
}