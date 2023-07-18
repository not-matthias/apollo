function setTheme(mode) {
    localStorage.setItem("theme-storage", mode);
    let htmlElement = document.querySelector("html");

    if (mode === "dark") {
        document.getElementById("darkModeStyle").disabled = false;
        document.getElementById("dark-mode-toggle").innerHTML = "<i data-feather=\"sun\"></i>";
        feather.replace()
        htmlElement.classList.add("dark")
        htmlElement.classList.remove("light")
    } else if (mode === "light") {
        document.getElementById("darkModeStyle").disabled = true;
        document.getElementById("dark-mode-toggle").innerHTML = "<i data-feather=\"moon\"></i>";
        feather.replace()
        htmlElement.classList.add("light")
        htmlElement.classList.remove("dark")
    }
}

function toggleTheme() {
    if (localStorage.getItem("theme-storage") === "light") {
        setTheme("dark");
    } else if (localStorage.getItem("theme-storage") === "dark") {
        setTheme("light");
    }
}

if (localStorage.getItem("theme-storage") !== null){
    var theme = localStorage.getItem("theme-storage");
} 
else if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    var theme = "dark";
}
else {
    var theme = "light";
}
setTheme(theme);