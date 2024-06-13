document.addEventListener('DOMContentLoaded', function() {
  // Select all `pre` elements containing `code`
  var codeBlocks = document.querySelectorAll('pre code');

  codeBlocks.forEach(function(code) {
    // Create a new button element for copying
    var copyBtn = document.createElement('button');
    copyBtn.className = 'clipboard-button';
    // Set the initial SVG for copying
    copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#ef5350" class="bi bi-clipboard" viewBox="0 0 16 16">
  <path d="M10 1.5a.5.5 0 0 1 .5-.5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h2a.5.5 0 0 1 .5.5V3h3V1.5zM6.5 3V2h3v1h-3zm4 0v1h2a1 1 0 0 0-1-1h-2V3zm-5 0H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H5.5V3z"/>
</svg>`;
    copyBtn.setAttribute('aria-label', 'Copy code to clipboard');

    // Add the copy functionality
    copyBtn.addEventListener('click', function() {
      navigator.clipboard.writeText(code.textContent).then(() => {
        // Change to checkmark icon to indicate successful copying
        copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#ef5350" class="bi bi-check-lg" viewBox="0 0 16 16">
  <path d="M13.485 1.85a.75.75 0 0 1 1.065.02.75.75 0 0 1-.02 1.065L5.82 12.78a.75.75 0 0 1-1.106.02L1.476 9.346a.75.75 0 1 1 1.05-1.07l2.74 2.742L12.44 2.92a.75.75 0 0 1 1.045-.07z"/>
</svg>`;
        setTimeout(() => {
          // Reset to copy icon after 2 seconds
          copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#ef5350" class="bi bi-clipboard" viewBox="0 0 16 16">
  <path d="M10 1.5a.5.5 0 0 1 .5-.5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h2a.5.5 0 0 1 .5.5V3h3V1.5zM6.5 3V2h3v1h-3zm4 0v1h2a1 1 0 0 0-1-1h-2V3zm-5 0H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H5.5V3z"/>
</svg>`;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    });

    // Append the button to the parent `pre` element, not inside the `code`
    code.parentNode.style.position = 'relative'; // Make sure parent `pre` can contain the absolute button
    code.parentNode.appendChild(copyBtn);
  });
});
