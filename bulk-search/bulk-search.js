const loading = document.getElementById("loading");
const boxes = document.getElementById("boxes");
const searching = document.getElementById("searching");
const resultsDiv = document.getElementById("results");


var fileData = [];

// init Pyodide

function fileListener() {
    var fileUpload = document.getElementById("isbnFile");
    if (fileUpload) {
        console.log("file upload found");
        fileUpload.addEventListener("change", handleFileSelect, false);
    }

    console.log("event listener added");
}

async function main() {
    let pyodide = await loadPyodide();
    await pyodide.loadPackage("pandas");
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    await micropip.install("isbnlib");
    await micropip.install("openpyxl");
    loading.style.display = "none";
    boxes.style.display = "block";
    console.log("python environment ready");
    fileListener();
    return pyodide;
}

let pyodideReadyPromise = main();

async function parseISBN() {
    console.log("go button clicked, processing isbn");

    let pyodide = await pyodideReadyPromise;
    let output = pyodide.runPython(`
import js
import pandas as pd
import isbnlib
import openpyxl
import io
import base64

print("python script initiated")

isbnData = pd.json_normalize(js.fileData.to_py())

def isbn_parser():
    for index, row in isbnData.iterrows():
        print(row['isbn_searched'],' ',index)
        if pd.notna(row['isbn_searched']):
            isbn = row['isbn_searched']
            if isbnlib.is_isbn13(isbn):

                isbnData.at[index, 'valid'] = "Yes"

            elif isbnlib.is_isbn10(isbn):


                isbnData.at[index, 'valid'] = "Yes"

            else:
                isbnData.at[index, 'valid'] = "No"

    return isbnData.to_json(orient='records')

isbn_parser()

`)
    fileData = JSON.parse(output);
    getMetadata();
}

function handleFileSelect(evt) {
    var files = evt.target.files; 
    var file = files[0];
    var reader = new FileReader();
    boxes.style.display = "none";
    searching.style.display = "block";
    reader.onload = function (e) {
        console.log(file.name);
        if (file.name.endsWith('.xlsx')) {
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, { type: 'array' });
            var worksheet = workbook.Sheets[workbook.SheetNames[0]];
            var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            jsonData.shift();
            fileData = jsonData.map(function (row) {
                return {
                    'isbn_searched': row[0],
                    'valid': '',
                    'title': '',
                    'subtitle': '',
                    'author': '',
                    'publisher': '',
                    'published_date': '',
                };
            });
            console.log('xlsx loaded');
        } else if (file.name.endsWith('.csv')) {
            var csvData = Papa.parse(e.target.result, { header: true, skipEmptyLines: true }).data;
            fileData = csvData.map(function (row) {
                return {
                    'isbn_searched': row['ISBN'],
                    'valid': '',
                    'title': '',
                    'subtitle': '',
                    'author': '',
                    'publisher': '',
                    'published_date': '',
                };
            });
            console.log('csv loaded');
        }
        parseISBN();
    }

    if (file.name.endsWith('.xlsx')) {
        reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getMetadata() { 
    console.log("getting metadata");
    var fileIndex = 0;
    async function processISBN() { // Marked as async
        if (fileIndex >= fileData.length) {
            console.log("all files processed");
            searching.style.display = "none";
            var resultsDiv = document.getElementById("results");
            resultsDiv.style.display = "block";
            return;
        }
        var isbn = fileData[fileIndex].isbn_searched;
        var check = fileData[fileIndex].valid;
        if (check == "No") {
            fileIndex++;
            processISBN();
            return;
        } else {
            console.log("processing isbn: ", isbn);
            await delay(1000); 
            var url = "https://www.googleapis.com/books/v1/volumes?q=isbn:" + isbn;
            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.totalItems > 0) {
                        var item = data.items[0].volumeInfo;
                        fileData[fileIndex].title = item.title;
                        fileData[fileIndex].subtitle = item.subtitle;
                        fileData[fileIndex].author = item.authors ? item.authors.join(", ") : "";
                        fileData[fileIndex].publisher = item.publisher;
                        fileData[fileIndex].published_date = item.publishedDate;
                    }
                    fileIndex++;
                    processISBN();
                });
        }
    }
    processISBN();
}

function downloadResults () {
    var ws = XLSX.utils.json_to_sheet(fileData);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "results.xlsx");

}