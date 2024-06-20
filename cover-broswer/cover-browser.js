const infoBox = document.getElementById('info');
const searchButton = document.getElementById('searchButton');
const fileUpload = document.getElementById('fileUpload');
const searchOptions = document.getElementById('searchOptions');
const searchDetails = document.getElementById('searchDetails');
const reportControls = document.getElementById('reportControls');
const overlay = document.getElementById('controlOverlay');
const primarySearch = document.getElementById('primarySearch');
const coverBrowser = document.getElementById('coverBrowser');
const pubList = document.getElementById('pubList');
const pubFilterApplyButton = document.getElementById('pubFilterApply');
const selectAll = document.getElementById('selectAll');
const selectNone = document.getElementById('selectNone');
const noCoverCheckbox = document.getElementById('noCover');
const yesCoverCheckbox = document.getElementById('yesCover');
const facsimileCheckbox = document.getElementById('facsimile');
const savedCheckbox = document.getElementById('saved');
const filterClear = document.getElementById('filterClear');
const pubFilterButton = document.getElementById('pubFilterButton');
const pubModal = document.getElementById('pubModal');
const exportButton = document.getElementById('exportButton');
var coversPopulated = false;
var coverData = [];
var currentModal = null;
var source1 = '';
var fileName = '';
var currentModal = null;
var companyNames = [];
var primaryUrl = '';
var vstUrl = 'https://covers.vitalbook.com/vbid/';
var rsUrl = 'https://redshelf-images.s3-external-1.amazonaws.com/cover_image/';
var bnUrl1 = 'https://prodimage.images-bn.com/pimages/';
var bnUrl2 = '_p0_v2_s600x595.jpg';
var gbIdUrl = 'https://www.googleapis.com/books/v1/volumes?q=isbn:';
var gbImgUrl1 = 'https://books.google.com/books/content?id=';
var gbImgUrl2 = '&printsec=frontcover&img=1&zoom=';

window.onload = function () {
    searchButton.disabled = true;
    searchButton.title = 'Upload a file before starting search';
}

primarySearch.addEventListener('change', function () {
    if (primarySearch.value !== 'dflt') {
        if (coverData.length > 0) {
            searchButton.disabled = false;
            searchButton.title = 'Click to begin search';
        }
    }
});

fileUpload.addEventListener("change", handleFileSelect, false);

function infoButton() {
    infoBox.classList.remove('hidden');
    infoBox.classList.add('modal');
}


function closeModals(target) {
    target.classList.add('hidden');
    target.classList.remove('modal');
    if (target.id === 'resultModal') {
        document.getElementsByClassName('altIMG').src = '';
    }
}

window.onclick = function (evt) {
    if (evt.target.classList.contains('modal')) {
        closeModals(evt.target);
    }
}

function handleFileSelect(evt) {
    if (primarySearch.value === 'dflt') {
        searchButton.title = 'Choose primary image source before starting search';
    } else {
        searchButton.disabled = false;
        searchButton.title = 'Click to begin search';
    }

    var files = evt.target.files; // FileList object
    var file = files[0];
    fileName = file.name;
    var reader = new FileReader();
    reader.onload = function (e) {
        if (file.name.endsWith('.xlsx')) {
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, { type: 'array' });
            var worksheet = workbook.Sheets[workbook.SheetNames[0]];
            var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            jsonData.shift();
            coverData = jsonData.map(function (row) {
                return {
                    EISBN: row[0],
                    PRINT_ISBN: row[1],
                    TITLE: row[2],
                    IMPRINT: row[3],
                    PUBLISHER: row[4],
                    HAS_COVER: row[5],
                    notes: '',
                    display: true,
                    selected: false,
                    saved: false,
                    gbEId: 'none',
                    gbPId: 'none'
                };
            });
            console.log('xlsx loaded to json:');
            console.log(coverData);
        } else if (file.name.endsWith('.csv')) {
            var csvData = Papa.parse(e.target.result, { header: true, skipEmptyLines: true }).data;
            coverData = csvData.map(function (row) {
                return {
                    EISBN: row['EISBN'],
                    PRINT_ISBN: row['PRINT_ISBN'],
                    TITLE: row['TITLE'],
                    IMPRINT: row['IMPRINT'],
                    PUBLISHER: row['PUBLISHER'],
                    HAS_COVER: row['HAS_COVER'],
                    notes: '',
                    display: true,
                    selected: false,
                    saved: false
                };
            });
            console.log('csv loaded to json:');
            console.log(coverData);
        }
    };

    if (file.name.endsWith('.xlsx')) {
        reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    }
}



function beginSearch() {
    console.log('begin search');
    source1 = document.getElementById('primarySearch').value;
    showResults();
}

function showResults() {
    searchOptions.style.display = 'none';
    var resultsHeader = document.createElement('h2');
    resultsHeader.textContent = `Results for ${fileName}`;
    searchDetails.innerHTML = '';
    searchDetails.appendChild(resultsHeader);
    var newSearchButton = document.createElement('button');
    newSearchButton.textContent = "New Search";
    newSearchButton.onclick = function () {
        // Clear the cover browser
        location.reload();
    };
    searchDetails.appendChild(newSearchButton);
    displayFilters();
    populateCoverBrowser();
    // googleImgs();
}

function displayFilters() {
    reportControls.style.display = "flex";
}

function hideFilters() {
    reportControls.style.display = "none";
}

function disableFilters() {
    reportControls.style.pointerEvents = "none";
    overlay.style.display = "flex";
}

function enableFilters() {
    reportControls.style.pointerEvents = "auto";
    overlay.style.display = "none";
}

function populateCoverBrowser() {
    var browserIndex = 0;
    getPrimaryUrl();
    function processNextBook() {
        if (browserIndex >= coverData.length) {
            return;
        }

        var bookData = coverData[browserIndex];

        if (!bookData.display) {
            browserIndex++;
            processNextBook();
            return;
        }

        var imgDiv = document.createElement('div');
        imgDiv.className = 'imgDiv';
        var img = document.createElement('img');
        var imgCheck = document.createElement('input');
        var statusDiv = document.createElement('div');
        statusDiv.className = 'statusDiv';

        let eisbn = bookData.EISBN;
        let imgCheckId = `${eisbn}Check`;
        imgCheck.type = 'checkbox';
        imgCheck.id = imgCheckId
        imgCheck.className = 'imgCheck';
        imgCheck.name = eisbn;

        if (bookData.selected) {
            imgCheck.checked = true;
            img.style.border = "3px solid red";
        } else {
            imgCheck.checked = false;
            img.style.border = "5px solid black";
        }

        imgCheck.addEventListener('change', function () {
            let imgCheckId = this.id
            let imgId = imgCheckId.replace("Check", "")
            var img = document.getElementById(imgId);
            if (this.checked) {
                img.style.border = "3px solid red";
                bookData.selected = true;
            } else {
                img.style.border = "5px solid black";
                bookData.selected = false;
            }
        });

        if (bookData.HAS_COVER === 'yes') {
            img.classList.add('hasCover');
        } else if (bookData.HAS_COVER === 'no') {
            img.classList.add('missing');
        } else {
            img.classList.add('facsimile');
        }


        if (bookData.saved) {
            imgDiv.classList.add('saved');
        }

        var imgStatus = document.createElement('p');
        if (bookData.HAS_COVER === 'yes') {
            imgStatus.textContent = "status: has cover";
        } else if (bookData.HAS_COVER === 'no') {
            imgStatus.textContent = "status: no cover";
        } else if (bookData.HAS_COVER === 'facsimile') {
            imgStatus.textContent = "status: facsimile";
        } else {
            imgStatus.textContent = "status: unknown";
        }


        coverBrowser.appendChild(imgDiv);
        var titleCaption = document.createElement('p');
        titleCaption.textContent = bookData.TITLE;
        img.id = eisbn;
        imgUrl = primaryUrl + eisbn;
        img.src = imgUrl;
        img.onclick = function () {
            populateModal(bookData);
        };
        imgDiv.appendChild(img);
        imgDiv.appendChild(titleCaption);
        statusDiv.appendChild(imgCheck);
        statusDiv.appendChild(imgStatus);
        imgDiv.appendChild(statusDiv);

        browserIndex++;
        processNextBook();

    }
    processNextBook();
}

function setStatus(data) {
    let img = document.getElementById(data.EISBN);
    if (img.classList.contains('loading')) {
        img.classList.remove('loading');
    }
    if (data.HAS_COVER === 'yes') {
        img.classList.add('hasCover');
    } else if (data.HAS_COVER === 'no') {
        img.classList.add('missing');
    } else {
        img.classList.add('facsimile');
    }
}

function getPrimaryUrl() {
    if (source1 === 'vst') {
        primaryUrl = vstUrl;
    } else if (source1 === 'rs') {
        primaryUrl = rsUrl;
    } else if (source1 === 'bn') {
        primaryUrl = bnUrl;
    }

}


function clearImages() {
    var coverBrowser = document.getElementById('coverBrowser');
    coverBrowser.innerHTML = '';
}

function updateCoverData() {
    clearImages();
    populateCoverBrowser(coverData);
}

filterClear.addEventListener('click', function () {
    coverData.forEach(data => {
        data.display = true;
    });
    updateCoverData();
    noCoverCheckbox.checked = true;
    yesCoverCheckbox.checked = true;
    facsimileCheckbox.checked = true;
    savedCheckbox.checked = true;
    hasPopulatedCheckboxes = false; // Reset the flag
    var checkboxes = pubList.getElementsByTagName('input');
    Array.from(checkboxes).forEach(checkbox => {
        checkbox.checked = true;
    });
});

noCoverCheckbox.addEventListener('change', applyFilters);
yesCoverCheckbox.addEventListener('change', applyFilters);
facsimileCheckbox.addEventListener('change', applyFilters);
savedCheckbox.addEventListener('change', applyFilters);
pubFilterApplyButton.addEventListener('click', function () {
    // Close the modal
    pubModal.classList.remove('modal');
    pubModal.classList.add('hidden');

    // Apply filters
    applyFilters();
});

function applyFilters() {
    // Get all checkboxes
    var checkboxes = pubList.getElementsByTagName('input');
    // Iterate over the coverData array
    coverData.forEach(function (data) {
        // Apply the HAS_COVER filter
        if (data.HAS_COVER === 'no') {
            data.display = noCoverCheckbox.checked;
        } else if (data.HAS_COVER === 'yes') {
            data.display = yesCoverCheckbox.checked;
        } else if (data.HAS_COVER === 'facsimile') {
            data.display = facsimileCheckbox.checked;
        }

        if (data.saved) {
            data.display = savedCheckbox.checked;
        }
        // Apply the PUBLISHER filter
        var checkbox = Array.from(checkboxes).find(chk => chk.id === data.PUBLISHER);
        if (checkbox) {
            data.display = data.display && checkbox.checked;
        }
    });

    // Update the images
    updateCoverData();
}

document.getElementById('pubAll').addEventListener('click', function (evt) {
    evt.preventDefault();
    var checkboxes = document.getElementById('pubList').querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(function (checkbox) {
        checkbox.checked = true;
    });
});

document.getElementById('pubNone').addEventListener('click', function (evt) {
    evt.preventDefault();
    var checkboxes = document.getElementById('pubList').querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(function (checkbox) {
        checkbox.checked = false;
    });
});

function nextModal() {
    var index = coverData.findIndex(data => data.EISBN === currentModal);
    if (index < coverData.length - 1) {
        populateModal(coverData[index + 1]);
    }
}

function prevModal() {
    var index = coverData.findIndex(data => data.EISBN === currentModal);
    if (index > 0) {
        populateModal(coverData[index - 1]);
    }
}

document.getElementById('nextModal').addEventListener('click', function () {
    nextModal();
});

document.getElementById('prevModal').addEventListener('click', function () {
    prevModal();
});


var hasPopulatedCheckboxes = false;

pubFilterButton.addEventListener('click', function () {
    pubModal.classList.remove('hidden');
    pubModal.classList.add('modal');
    if (!hasPopulatedCheckboxes) { // Check the flag before calling populateCheckboxes
        populateCheckboxes();
        hasPopulatedCheckboxes = true; // Set the flag to true after calling populateCheckboxes
    }
});

function populateCheckboxes() {
    companyNames = [...new Set(coverData.map(data => data.PUBLISHER))].sort();
    pubList.innerHTML = '';
    companyNames.forEach(function (name) {
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = name;
        checkbox.name = name;
        checkbox.setAttribute('autocomplete', 'on');
        checkbox.checked = true;
        var label = document.createElement('label');
        label.htmlFor = name;
        label.appendChild(document.createTextNode(name));
        var div = document.createElement('div');
        div.appendChild(checkbox);
        div.appendChild(label);
        pubList.appendChild(div);
    });
}

selectAll.addEventListener('click', function () {
    var checkboxes = document.querySelectorAll('.imgCheck');

    // Create a map of EISBN to selected status
    var checkboxStatus = {};
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        var checkboxId = checkbox.id;
        var checkboxEISBN = checkboxId.replace("Check", "");
        checkboxStatus[checkboxEISBN] = true;
    });

    // Update the 'selected' field in coverData
    coverData.forEach(data => {
        if (checkboxStatus.hasOwnProperty(data.EISBN)) {
            data.selected = checkboxStatus[data.EISBN];
        }
    });
    updateCoverData();
});

selectNone.addEventListener('click', function () {
    clearSelect();
    updateCoverData();
});

function clearSelect() {
    var checkboxes = document.querySelectorAll('.imgCheck');
    var checkboxStatus = {};
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        var checkboxId = checkbox.id;
        var checkboxEISBN = checkboxId.replace("Check", "");
        checkboxStatus[checkboxEISBN] = false;

    });

    coverData.forEach(data => {
        if (checkboxStatus.hasOwnProperty(data.EISBN)) {
            data.selected = checkboxStatus[data.EISBN];
        }
    });
}

document.getElementById('selectMissing').addEventListener('click', function () {
    for (let book of coverData) {
        if (book.selected) {
            book.HAS_COVER = 'no';
        }
    }
    updateCoverData();
    clearSelect()
});

document.getElementById('selectFacsimile').addEventListener('click', function () {
    for (let book of coverData) {
        if (book.selected) {
            book.HAS_COVER = 'facsimile';
        }
    }
    updateCoverData();
    clearSelect()
});

document.getElementById('selectCover').addEventListener('click', function () {
    for (let book of coverData) {
        if (book.selected) {
            book.HAS_COVER = 'yes';
        }
    }
    updateCoverData();
    clearSelect()
});

document.getElementById('sortSelect').addEventListener('change', function () {
    var value = this.value;
    coverData.sort(function (a, b) {
        switch (value) {
            case 'missingCover':
                return (a.HAS_COVER === 'no' ? -1 : 1);
            case 'hasCover':
                return (a.HAS_COVER === 'yes' ? -1 : 1);
            case 'facsimile':
                return (a.HAS_COVER === 'facsimile' ? -1 : 1);
            case 'publisherAsc':
                return a.PUBLISHER.localeCompare(b.PUBLISHER);
            case 'publisherDesc':
                return b.PUBLISHER.localeCompare(a.PUBLISHER);
            default:
                return 0;
        }
    });
    updateCoverData();
});

function populateModal(data) {
    currentModal = data.EISBN;
    console.log(`populating modal for ${currentModal}`);
    document.getElementById('resultModal').classList.remove('hidden');
    document.getElementById('resultModal').classList.add('modal');
    document.getElementById('modalImg').src = `https://covers.vitalbook.com/vbid/${data.EISBN}`;
    document.getElementById('modalEISBN').textContent = `EISBN: ${data.EISBN}`;
    document.getElementById('modalTitle').textContent = `Title: ${data.TITLE}`;
    document.getElementById('modalPrintISBN').textContent = `Print ISBN: ${data.PRINT_ISBN}`;
    document.getElementById('modalImprint').textContent = `Imprint: ${data.IMPRINT}`;
    document.getElementById('modalPublisher').textContent = `Publisher: ${data.PUBLISHER}`;
    var notes = document.getElementById('notesText');
    notes.value = '';
    notes.value = data.notes;


    hasCover = document.getElementById('coverOptions');
    hasCover.value = data.HAS_COVER;
    addImg('eisbn');

}

function addImg(isbnType) {
    var index = coverData.findIndex(data => data.EISBN === currentModal);
    var secondarySource = document.getElementById('secondarySourceSelect').value;
    var isbn = '';
    if (isbnType === 'eisbn') {
        document.getElementById('secondarySourceEisbnButton').style.backgroundColor = 'rgb(233, 205, 50)';
        document.getElementById('secondarySourcePrintButton').style.backgroundColor = 'rgb(114, 121, 115)';
        if (secondarySource.startsWith('gb') && coverData[index].gbEId != 'none') {
            isbn = coverData[index].gbEId;
            setImgSrc(secondarySource,isbn);
        } else if (secondarySource.startsWith('gb') && coverData[index].gbEId === 'none') {
            getGoogleBookId(coverData[index].EISBN)
                .then(([bookId]) => {
                    coverData[index].gbEId = bookId;
                    isbn = bookId;
                    setImgSrc(secondarySource,isbn);
                })
                .catch(error => {
                    console.error('Error fetching book IDs:', error);
                    isbn = 'not found';
                    setImgSrc(secondarySource,isbn);
                });

        } else {
            isbn = currentModal
            setImgSrc(secondarySource,isbn);
        }
    } else if (isbnType === 'print') {
        document.getElementById('secondarySourceEisbnButton').style.backgroundColor = 'rgb(114, 121, 115)';
        document.getElementById('secondarySourcePrintButton').style.backgroundColor = 'rgb(233, 205, 50)';
        if (secondarySource.startsWith('gb') && coverData[index].gbPId != 'none') {
            isbn = coverData[index].gbPId;
            setImgSrc(secondarySource,isbn);
        } else if (secondarySource.startsWith('gb') && coverData[index].gbPId === 'none') {
            getGoogleBookId(coverData[index].PRINT_ISBN)
                .then(([bookId]) => {
                    coverData[index].gbPId = bookId;
                    isbn = bookId;
                    setImgSrc(secondarySource,isbn);
                })
                .catch(error => {
                    console.error('Error fetching book IDs:', error);
                    isbn = 'not found';
                    setImgSrc(isbn);
                });
        } else {
            isbn = coverData[index].PRINT_ISBN;
            setImgSrc(secondarySource,isbn);
        }
    }

}

function setImgSrc(secondarySource,isbn) {
    var imgSrc = secondaryImgSrc(secondarySource, isbn);
    var img = document.createElement('img');
    img.src = imgSrc;
    img.onerror = function () {
        this.onerror = null;
        this.src = 'no_cover.jpg';
    };
    var spanElement = document.getElementById('secondarySource');
    spanElement.innerHTML = '';
    spanElement.appendChild(img);
}


function secondaryImgSrc(imgSrc, isbn) {
    if (isbn === 'not found') {
        return 'no_cover.jpg';
    }
    else {    
        if (imgSrc === 'vst') {
            newSrc = vstUrl + isbn;
            return newSrc;
        } else if (imgSrc === 'rs') {
            newSrc = rsUrl + isbn + '.jpg';
            return newSrc;
        } else if (imgSrc === 'bn') {
            newSrc = bnUrl1 + isbn + bnUrl2;
            return newSrc;
        } else if (imgSrc === 'gbL') {
            newSrc = `${gbImgUrl1}${isbn}${gbImgUrl2}2`;
            return newSrc;
        } else if (imgSrc === 'gbT') {
            newSrc = `${gbImgUrl1}${isbn}${gbImgUrl2}5`;
            return newSrc;
        }
    }
}


async function getGoogleBookId(isbn) {
    url = gbIdUrl + isbn;
    console.log(url);
    const response = await fetch(url);
    if (response.ok && response.headers.get('content-type').includes('application/json')) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            bookId = data.items[0].id;
            return [bookId];
        }
    }
    return null;
}

document.getElementById('secondarySourceSelect').addEventListener('change', function () {
    addImg('eisbn');
});

var resultModalSubmit = document.getElementById('resultModalSubmit');
resultModalSubmit.addEventListener('click', function (evt) {
    evt.preventDefault();
    saveModalData();
});

function saveModalData() {
    var notes = document.getElementById('notesText');
    // Find the item in coverData with the matching EISBN
    var item = coverData.find(data => data.EISBN === currentModal);
    if (item) {
        item.saved = true;
        item.HAS_COVER = document.getElementById('coverOptions').value;
        console.log('opening modal');
        console.log(currentModal, item.HAS_COVER);
        item.notes = notes.value;
    }
    updateCoverData();
    closeModals(document.getElementById('resultModal'));
    nextModal();
}

var group_ = (el, callback) => {
    el.forEach((checkbox) => {
        callback(checkbox);
    });
}

group_(Array.from(document.getElementsByClassName('optionsCheck')), (item) => {
    item.onclick = (e) => {
        group_(Array.from(document.getElementsByClassName('optionsCheck')), (item) => {
            if (item !== e.target) {
                item.checked = false;
            }
        });
        e.target.checked = true;
    }
});


exportButton.addEventListener('click', function (evt) {
    evt.preventDefault();
    let coverExport = JSON.parse(JSON.stringify(coverData));
    var worksheet = XLSX.utils.json_to_sheet(coverExport);
    var workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cover Data');
    XLSX.writeFile(workbook, 'coverData.xlsx', { compression: true });
});