const loading = document.getElementById("loading");
const boxes = document.getElementById("boxes");
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
        print(row['isbn'],' ',index)
        if pd.notna(row['isbn']):
            isbn = row['isbn']
            publisher = row['publisher']
            imprint = row['imprint']
            if isbnlib.is_isbn13(isbn):
                isbnHyphen = isbnlib.mask(isbn)
                isbnGroups = isbnHyphen.split("-")
                prefix = isbnGroups[0]
                geoGroup = isbnGroups[1]
                registrant = isbnGroups[2]
                isbnData.at[index, 'valid'] = "Yes"
                isbnData.at[index, 'prefix'] = prefix
                isbnData.at[index, 'geo-group'] = geoGroup
                isbnData.at[index, 'registrant'] = registrant
            elif isbnlib.is_isbn10(isbn):
                isbn = isbnlib.to_isbn13(isbn)
                isbnHyphen = isbnlib.mask(isbn)
                isbnGroups = isbnHyphen.split("-")
                prefix = isbnGroups[0]
                geoGroup = isbnGroups[1]
                registrant = isbnGroups[2]
                isbnData.at[index, 'valid'] = "Yes"
                isbnData.at[index, 'prefix'] = prefix
                isbnData.at[index, 'geo-group'] = geoGroup
                isbnData.at[index, 'registrant'] = registrant
            else:
                isbnData.at[index, 'valid'] = "No"

    return isbnData.to_json(orient='records')

isbn_parser()

`)
    let jsonData = JSON.parse(output);
    var ws = XLSX.utils.json_to_sheet(jsonData);

    var wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");


    XLSX.writeFile(wb, "parsed_isbns.xlsx");
    resultsDiv.innerHTML = "";
    let finsihedMessage = document.createElement("p");
    finsihedMessage.textContent = "Finished! Your file has been downloaded.";
}



function handleFileSelect(evt) {
    resultsDiv.innerHTML = "";
    let workingMessage = document.createElement("p");
    workingMessage.textContent = "Working...";
    resultsDiv.appendChild(workingMessage);
    var files = evt.target.files; // FileList object
    var file = files[0];
    var reader = new FileReader();

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
                    'isbn': row[0],
                    'parent': row[1],
                    'publisher': row[2],
                    'imprint': row[3],
                    'valid': '',
                    'prefix': '',
                    'geo-group': '',
                    'registrant': '',
                };
            });
            console.log('xlsx loaded');
        } else if (file.name.endsWith('.csv')) {
            var csvData = Papa.parse(e.target.result, { header: true, skipEmptyLines: true }).data;
            fileData = csvData.map(function (row) {
                return {
                    'isbn': row['ISBN'],
                    'parent': row['PARENT'],
                    'publisher': row['PUBLISHER'],
                    'imprint': row['IMPRINT'],
                    'valid': '',
                    'prefix': '',
                    'geo-group': '',
                    'registrant': '',
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


// generic isbns 978-0-317, 978-0-318, 978-0-467, 978-0-578, 978-0-614, 978-0-615, 978-0-685, 978-0-686, 978-0-692, 979-8-218