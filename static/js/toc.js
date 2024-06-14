document.addEventListener('DOMContentLoaded', () => {
    const tocTitle = document.querySelector('.toc-title');
    const tocList = document.querySelector('.toc-list');

    tocTitle.addEventListener('click', function() {
      // Toggle display of the ToC list
      const isExpanded = tocList.style.display === 'block';
      tocList.style.display = isExpanded ? 'none' : 'block';

      // Toggle the class for rotating the arrow
      if (isExpanded) {
        tocTitle.classList.remove('expanded');
      } else {
        tocTitle.classList.add('expanded');
      }
    });
  });
