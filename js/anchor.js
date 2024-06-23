document.addEventListener('DOMContentLoaded', function () {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const idCounts = {}; // Object to keep track of IDs and their occurrences

    headings.forEach((heading) => {
        if (!heading.classList.contains('linked')) {
            let baseId = heading.textContent.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
            let id = baseId;

            // Check if the ID already exists, and if so, append a number to make it unique
            if (idCounts[baseId]) {
                id = `${baseId}-${idCounts[baseId]}`;
                idCounts[baseId] += 1;
            } else {
                idCounts[baseId] = 1;
            }

            heading.id = id; // Assign unique ID based on heading text

            // Wrap the text in an anchor tag and mark the heading
            heading.innerHTML = `<a href="#${id}" class="heading-link" aria-label="Link to this section">${heading.innerHTML}</a>`;
            heading.classList.add('linked'); // Mark the heading to avoid re-processing
        }
    });
});

