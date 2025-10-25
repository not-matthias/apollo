function setTheme(mode) {
    localStorage.setItem("theme-storage", mode);
}

// Functions needed for the theme toggle
//

function toggleTheme() {
    const currentTheme = getSavedTheme();
    if (currentTheme === "light") {
        setTheme("dark");
        updateItemToggleTheme();
    } else if (currentTheme === "dark") {
        setTheme("auto");
        updateItemToggleTheme();
    } else {
        setTheme("light");
        updateItemToggleTheme();
    }
}

function updateItemToggleTheme() {
    let mode = getSavedTheme();

    const darkModeStyle = document.getElementById("darkModeStyle");
    if (darkModeStyle) {
        if (mode === "dark" || (mode === "auto" && getSystemPrefersDark())) {
            darkModeStyle.disabled = false;
        } else {
            darkModeStyle.disabled = true;
        }
    }

    const sunIcon = document.getElementById("sun-icon");
    const moonIcon = document.getElementById("moon-icon");
    const autoIcon = document.getElementById("auto-icon");
    if (sunIcon && moonIcon && autoIcon) {
        sunIcon.style.display = (mode === "light") ? "block" : "none";
        moonIcon.style.display = (mode === "dark") ? "block" : "none";
        autoIcon.style.display = (mode === "auto") ? "block" : "none";

        if (mode === "auto") {
            autoIcon.style.filter = getSystemPrefersDark() ? "invert(1)" : "invert(0)";
        } else {
            autoIcon.style.filter = "none";
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
