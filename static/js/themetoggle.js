// Set by the template: "toggle" (light/dark) or "toggle-auto" (light/dark/auto)
var themeToggleMode = themeToggleMode || "toggle-auto";

function setTheme(mode) {
    localStorage.setItem("theme-storage", mode);
}

// Functions needed for the theme toggle
//

function toggleTheme() {
    const currentTheme = getSavedTheme();
    if (themeToggleMode === "toggle-auto") {
        // 3-state: light -> dark -> auto -> light
        if (currentTheme === "light") {
            setTheme("dark");
        } else if (currentTheme === "dark") {
            setTheme("auto");
        } else {
            setTheme("light");
        }
    } else {
        // 2-state: light <-> dark
        if (currentTheme === "light") {
            setTheme("dark");
        } else {
            setTheme("light");
        }
    }
    updateItemToggleTheme();
}

function updateItemToggleTheme() {
    let mode = getSavedTheme();

    const useDark = (mode === "dark" || (mode === "auto" && getSystemPrefersDark()));

    const darkModeStyle = document.getElementById("darkModeStyle");
    if (darkModeStyle) {
        darkModeStyle.disabled = !useDark;
    }

    const syntaxDarkStyle = document.getElementById("syntaxDarkStyle");
    const syntaxLightStyle = document.getElementById("syntaxLightStyle");
    if (syntaxDarkStyle && syntaxLightStyle) {
        syntaxDarkStyle.disabled = !useDark;
        syntaxLightStyle.disabled = useDark;
    }

    const sunIcon = document.getElementById("sun-icon");
    const moonIcon = document.getElementById("moon-icon");
    const autoIcon = document.getElementById("auto-icon");
    if (sunIcon && moonIcon) {
        sunIcon.style.display = (mode === "light") ? "block" : "none";
        moonIcon.style.display = (mode === "dark") ? "block" : "none";

        if (autoIcon) {
            autoIcon.style.display = (mode === "auto") ? "block" : "none";

            if (mode === "auto") {
                autoIcon.style.filter = getSystemPrefersDark() ? "invert(1)" : "invert(0)";
            } else {
                autoIcon.style.filter = "none";
            }
        }
    }

    let htmlElement = document.querySelector("html");
    if (mode === "dark" || (mode === "auto" && getSystemPrefersDark())) {
        htmlElement.classList.remove("light")
        htmlElement.classList.add("dark")
    } else {
        htmlElement.classList.remove("dark")
        htmlElement.classList.add("light")
    }
}

function getSystemPrefersDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getSavedTheme() {
    let currentTheme = localStorage.getItem("theme-storage");
    if(!currentTheme) {
        currentTheme = getSystemPrefersDark() ? "dark" : "light";
    }

    // In 2-state toggle mode, "auto" is not valid — resolve to system preference
    if (themeToggleMode === "toggle" && currentTheme === "auto") {
        currentTheme = getSystemPrefersDark() ? "dark" : "light";
        setTheme(currentTheme);
    }

    return currentTheme;
}

// Update the toggle theme on page load
updateItemToggleTheme();

// Listen for system theme changes in auto mode
if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (getSavedTheme() === "auto") {
            updateItemToggleTheme();
        }
    });
}
