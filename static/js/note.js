document.addEventListener('DOMContentLoaded', function() {
  // Attach click event listeners to all '.note-toggle' buttons
  document.querySelectorAll('.note-toggle').forEach(function(toggleButton) {
    toggleButton.addEventListener('click', function() {
      // The '.note-content' is the next sibling element in the DOM structure
      var content = this.nextElementSibling;
      var expanded = this.getAttribute('aria-expanded') === 'true' || false;
      this.setAttribute('aria-expanded', !expanded);
      content.style.display = !expanded ? 'none' : 'block';
    });
  });
});
