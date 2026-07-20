/* =========================================================
   UTILIDADES GENERALES
   ========================================================= */

function byId(id) {
    return document.getElementById(id);
}

function firstExistingElement(...ids) {
    for (const id of ids) {
        const element = byId(id);

        if (element) {
            return element;
        }
    }

    return null;
}

function formatNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number.toLocaleString("es-MX")
        : "0";
}

function percent(current, base) {
    const currentNumber = Number(current);
    const baseNumber = Number(base);

    if (!Number.isFinite(baseNumber) || baseNumber === 0) {
        return null;
    }

    return ((currentNumber - baseNumber) / baseNumber) * 100;
}

function formatPercentage(value) {
    if (value === null || !Number.isFinite(Number(value))) {
        return "Sin base";
    }

    const number = Number(value);

    return `${number >= 0 ? "+" : ""}${number.toFixed(1)}%`;
}

function normalizeString(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function debounce(callback, delay = 250) {
    let timeout;

    return (...args) => {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
            callback(...args);
        }, delay);
    };
}

function downloadTextFile(content, fileName, mimeType) {
    const blob = new Blob([content], {
        type: mimeType
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

function getCurrentYear() {
    return SIGPE.years[SIGPE.currentYearIndex];
}

function getCurrentYearField() {
    return getCurrentYear().field;
}