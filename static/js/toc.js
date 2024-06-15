document.addEventListener('DOMContentLoaded', () => {
    const tocTitle = document.querySelector('.toc-title');
    const tocList = document.querySelector('.toc-list');

    if (tocTitle && tocList) {
        tocTitle.addEventListener('click', function () {
            const isExpanded = tocList.style.display === 'block';
            tocList.style.display = isExpanded ? 'none' : 'block';

            if (isExpanded) {
                tocTitle.classList.remove('expanded');
            } else {
                tocTitle.classList.add('expanded');
            }
        });
    }
});
