document.querySelector('#pub-search-button').addEventListener('click', pubSearch);
document.querySelector('#pub-search-box input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        pubSearch();
    }
});

function pubSearch() {
    // Get the value from your custom input box
    console.log("Search button clicked");
    var searchValue = document.querySelector('#pub-search-box input').value;
    console.log("Search value: " + searchValue);
    // Pass this value to the third-party search tool
    var gcseSearchBox = document.querySelector('.gsc-input input.gsc-input');
    gcseSearchBox.value = searchValue;
    var gcseSearchTerm= document.querySelector('.gsc-input input.gsc-input').value;
    console.log("Search term: " + gcseSearchTerm);
    // Trigger the search
    var gcseSearchButton = document.querySelector('.gsc-search-button-v2');
    gcseSearchButton.click();
}

document.querySelector('#pubClear').addEventListener('click', function() {
    console.log("Clear button clicked");
    var gcseClearButton = document.querySelector('a.gsst_a');
    gcseClearButton.click();
    document.querySelector('#pub-search-box input').value = '';
});

document.querySelector('#gbClear').addEventListener('click', function() {
    document.querySelector('#gb-book-info').innerHTML = '';
    document.querySelector('#google-books-search-box input').value = '';
});