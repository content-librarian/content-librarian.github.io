function clearText() {
  document.getElementById("code").value = "";
  document.getElementById("filename").value = "";
}

window.onload = clearText;

const filename = document.getElementById("filename");
const loading = document.getElementById("loading");
const boxes = document.getElementById("boxes");
// init Pyodide
async function main() {
  let pyodide = await loadPyodide();
  await pyodide.loadPackage("pandas");
  await pyodide.loadPackage("beautifulsoup4");
  loading.style.display = "none";
  boxes.style.display = "block";
  console.log("python environment ready");
  return pyodide;
}
let pyodideReadyPromise = main();

async function convertTable() {
  console.log("go button clicked /n processing table");
  let pyodide = await pyodideReadyPromise;
  pyodide.runPython(`
import js
import pandas as pd
from bs4 import BeautifulSoup
import csv
print("python script initiated")
def html_table_to_csv():
    tableType = js.document.querySelector('input[name="radio"]:checked').value
    html = js.document.getElementById("code").value
    soup = BeautifulSoup(html, "html.parser")
    rows = soup.find_all("tr")
    data = {}
    rowInd = 0
    if tableType == "title":
        for row in rows:
            cols = row.find_all('td')
            rank = cols[0].text.strip()
            ul = cols[1].find('ul')
            lis = ul.find_all('li')
            title = lis[0].text.strip()
            author = lis[1].text.strip()
            publisher = lis[2].text.strip()
            appearances = cols[2].find('div').text.strip()
            score = cols[3].find('p').text.strip()
            rowData = {
                "rank": rank,
                "title": title,
                "author": author,
                "publisher": publisher,
                "appearances": appearances,
                "score": score
            }
            data[rowInd] = rowData
            rowInd += 1
    else:
        for row in rows:
            cols = row.find_all('td')
            rank = cols[0].text.strip()
            ul = cols[1].find('ul')
            lis = ul.find_all('li')
            appearances = lis[0].text.strip()
            publisher = cols[1].find('p').text.strip()
            rowData = {
            "rank": rank,
            "publisher": publisher,
            "appearances": appearances,
            }
            data[rowInd] = rowData
            rowInd += 1
    
    df = pd.DataFrame.from_dict(data, orient='index')
    output = df.to_csv(index=False)
    js.output = output
    return output
print("python script complete")
html_table_to_csv();

`)
  console.log('table converted /n file downloading');
  console.log(output);
  const blob = new Blob([output], {
    type: "text/csv"
  });
  const url = URL.createObjectURL(blob);
  var downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = filename.value + ".csv";
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  console.log('file downloaded');
}
