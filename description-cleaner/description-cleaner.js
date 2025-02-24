$('#html-editor').trumbowyg({
    resetCss: false,
    removeformatPasted: true,
    tagsToKeep: ['p', 'i', 'b', 'strong', 'em', 'ol', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    tagsToRemove: ['br', 'link', 'style'],
    semantic: {
        'div': 'p'
    },
    btns: [
        ['viewHTML'],
        ['historyUndo', 'historyRedo'],
        ['formatting'],
        ['strong', 'em',],
        ['link'],
        ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
        ['unorderedList', 'orderedList'],
        ['removeformat'],
        ['fullscreen'],
    ],
});


function clearText() {
    $('#html-editor').trumbowyg('empty');
}


function removeSpaces() {
    var currentHtml = $('#html-editor').trumbowyg('html');
    var noConsecutiveBreaksHtml = currentHtml.replace(/(<br\s*\/?>\s*)+/gi, '<br>');
    var wrappedHtml = noConsecutiveBreaksHtml.split('<br>').map(function (piece) {
        return piece.trim() ? '<p>' + piece.trim() + '</p>' : '';
    }).join('');
    var cleanedHtml = wrappedHtml.replace(/\n/g, '');
    $('#html-editor').trumbowyg('html', cleanedHtml);
}

// function convertToBulletedList() {
//     var currentHtml = $('#html-editor').trumbowyg('html');
    
//     // Updated regular expression to match potential list items starting with *, •, or after <br> tags
//     var listItemRegex = /(?:<p>(?:\*|•)|<br>(?:\*|•)|(?:\*|•)|<\/p><p>(?:\*|•))\s*(.*?)<\/p>|<br>\s*(.*?)(?=<br>|$)/gi;
    
//     // Function to wrap matched items in <li> tags and accumulate them
//     var replaceFunction = function(match, p1, p2) {
//         var content = p1 || p2;
//         return '<li>' + content.trim() + '</li>';
//     };
    
//     // Replace potential list items with <li> tags
//     var listifiedHtml = currentHtml.replace(listItemRegex, replaceFunction);
    
//     // Wrap all <li> tags with <ul> tags
//     listifiedHtml = listifiedHtml.replace(/(<li>.*<\/li>)/gis, '<ul>$1</ul>');
    
//     // Remove any <p> tags that directly wrap <ul> tags, as this is invalid HTML
//     listifiedHtml = listifiedHtml.replace(/<p>\s*(<ul>.*<\/ul>)\s*<\/p>/gi, '$1');
    
//     // Update the editor with the modified HTML content
//     $('#html-editor').trumbowyg('html', listifiedHtml);
// }

// function infoButton() {
//     var infoBox = document.getElementById('info');
//     if (infoBox.style.display === 'none') {
//         infoBox.style.display = 'block';
//     } else {
//         infoBox.style.display = 'none';
//     }

// }