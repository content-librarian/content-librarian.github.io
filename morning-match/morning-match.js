const loading = document.getElementById("loading");
const boxes = document.getElementById("boxes");
const searching = document.getElementById("searching");
const resultsDiv = document.getElementById("results");

var fileData = [];

// 🐍 Initialize Pyodide
async function main() {
    let pyodide = await loadPyodide();
    await pyodide.loadPackage("pandas");
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    await micropip.install("openpyxl");
    loading.style.display = "none";
    boxes.style.display = "block";
    console.log("python environment ready");
    fileListener();
    return pyodide;
}

let pyodideReadyPromise = main();

// 🗂️ File Upload Listener
function fileListener() {
    var fileUpload = document.getElementById("isbnFile");
    if (fileUpload) {
        console.log("file upload found");
        fileUpload.addEventListener("change", handleFileSelect, false);
    }
    console.log("event listener added");
}

// 🚀 Main Processing Routine
async function morningRoutine() {

    let pyodide = await pyodideReadyPromise;

    let output = await pyodide.runPythonAsync(`
import js
import pandas as pd

print("python script initiated")

# Load fileData from JS into a pandas DataFrame
df = pd.json_normalize(js.fileData.to_py())

def run_mm():
    print("mm")

    # Morning Match Filtering with Fixed Regex and Na Handling
    df2 = df.loc[
        (df["Institution"].str.contains("NetSuite", regex=False) | df["Institution"].str.contains("Akademos", regex=False)) &
        (df["Institution's Country"] == "US") &
        (df['Already In'].str.contains(r'Reseller\\s-\\sUS\\s\\(USD\\)', regex=True, na=False))
    ]

    df3 = df.loc[
        (df["Institution"].str.contains("NetSuite", regex=False) | df["Institution"].str.contains("Bookware", regex=False)) &
        (df["Institution's Country"] == "CA") &
        (df['Already In'].str.contains(r'Reseller\\s-\\sCA\\s\\(CAD\\)', regex=True, na=False))
    ]

    df4 = df.loc[
        (df["Institution"].str.contains("NetSuite", regex=False)) &
        (df["Institution's Country"] == "US") &
        (df['Already In'].str.contains(r'Exclusion\\s+set:\\s+unavailable\\s+to\\s+US\\s+resellers', regex=True, na=False))
    ]

    df5 = df.loc[
        (df["Institution"].str.contains("NetSuite", regex=False) | df["Institution"].str.contains("Bookware", regex=False)) &
        (df["Institution's Country"] == "CA") &
        (df['Already In'].str.contains(r'Exclusion\\s+set:\\s+unavailable\\s+to\\s+CA\\s+resellers', regex=True, na=False))
    ]

    # Assign Status
    df2 = df2.assign(**{'Change Status To': 'Approved'})
    df3 = df3.assign(**{'Change Status To': 'Approved'})
    df4 = df4.assign(**{'Change Status To': 'Denied', 'Denial Reason Code': '5'})
    df5 = df5.assign(**{'Change Status To': 'Denied', 'Denial Reason Code': '5'})

    mm_count = len(df2) + len(df3) + len(df4) + len(df5)

    # Combine Morning Matches
    morning_match = pd.concat([df2, df3, df4, df5], ignore_index=True)
    matches_to_remove = morning_match.assign(**{'Change Status To': ''}) 
    matches_to_remove = matches_to_remove.assign(**{'Denial Reason Code': ''})

    find_my_friends = df[~df.isin(matches_to_remove)].dropna(how='all')
    nm_oh = find_my_friends.loc[(find_my_friends['Request Status'] == 'NEEDS_MATCH')|(find_my_friends['Request Status'] =='ON_HOLD')]
    nm_oh = nm_oh[['VBID','Request Status','Most Recent Comment']]
    new = find_my_friends.loc[(find_my_friends['Request Status'] == 'NEW')]
    new = new[['VBID','Request Status','Most Recent Comment']]
    other = find_my_friends.loc[(find_my_friends['Request Status'] == 'PROCESSING')|(find_my_friends['Request Status'] == 'WAITING_LEGAL')|(find_my_friends['Request Status'] == 'WAITING_PUBLISHER')|(find_my_friends['Request Status'] == 'WAITING_INSTITUTION')]
    other = other[['VBID','Request Status','Most Recent Comment']]


    new_nm = pd.merge(new,nm_oh,how='outer',on='VBID',indicator=True)
    new_nm = new_nm.loc[new_nm['_merge'] == 'both']
    new_nm = new_nm.drop(columns=['Request Status_y','Most Recent Comment_y','_merge'])
    new_nm = new_nm.rename(columns={'Request Status_x':'Change Status To','Most Recent Comment_x':'Comment'})

    # other_nm matches requests in NEEDS_MATCH or ON_HOLD to requests in PROCESSING, WAITING_LEGAL, WAITING_PUBLISHER, and WAITING_INSTITUTION

    other_nm = pd.merge(other,nm_oh,how='outer',on='VBID',indicator=True)
    other_nm = other_nm.loc[other_nm['_merge'] == 'both']
    other_nm = other_nm.drop(columns=['Request Status_y','Most Recent Comment_y','_merge'])
    other_nm = other_nm.rename(columns={'Request Status_x':'Change Status To','Most Recent Comment_x':'Comment'})


    # friends concats the three dataframes into one dataframe
    # duplicates are dropped

    friends = pd.concat([new_nm,other_nm],ignore_index=True)
    friends = friends.drop_duplicates(subset=['VBID'],keep='first')

    # removes matches that are in WAITING_PUBLISHER

    find_my_friends = find_my_friends[find_my_friends['Request Status'] != 'WAITING_PUBLISHER']

    # find_friends merges the friends dataframe with the find_my_friends dataframe
    # runs a similar process to the finding process above
    # additional step added to rearrange the columns into the correct order for the manage import template 

    find_friends = pd.merge(friends,find_my_friends,how='outer',on='VBID',indicator=True)
    find_friends = find_friends.loc[find_friends['_merge'] == 'both']
    find_friends = find_friends.drop(columns=['Change Status To_y','Comment_y','_merge'])
    find_friends = find_friends.rename(columns={'Change Status To_x':'Change Status To','Comment_x':'Comment'})
    cols = list(find_friends.columns)
    cols.insert(4, cols.pop(0))
    cols.insert(3, cols.pop(1))
    find_friends = find_friends[cols]

    # mask removes rows where the change status to value is the same as the request status value
    # these requests don't need to be processed in manage

    mask = find_friends['Change Status To'] == find_friends['Request Status']
    find_friends = find_friends.loc[~mask]

    # fmf_count is the total number of matches found in find my friends
    # calculated for display in the data container

    fmf_count = len(find_friends.index)

    # fmf_mm is the final dataframe
    # concatenates morning match and find my friends into one dataframe

    fmf_mm = pd.concat([morning_match,find_friends],ignore_index=True)
    

    # Convert final DataFrame to JSON preserving column order
    return fmf_mm.to_json(orient='records'), mm_count, fmf_count

# Run function and capture output
json_output, mm_count, fmf_count = run_mm()
json_output
    `);

    // Parse the JSON output from Python
    fileData = JSON.parse(output);
    console.log("Processed Data:", fileData);

    console.log("all files processed");
    searching.style.display = "none";
    resultsDiv.style.display = "block";
}

// 📂 Handle File Selection & Data Conversion
function handleFileSelect(evt) {
    const files = evt.target.files;
    const file = files[0];
    const reader = new FileReader();

    boxes.style.display = "none";
    searching.style.display = "block";

    reader.onload = function (e) {
        console.log(file.name);

        function mapDataToHeaders(headers, rows) {
            return rows.map(row => {
                return headers.reduce((obj, header, index) => {
                    obj[header] = row[index] !== undefined ? row[index] : '';
                    return obj;
                }, {});
            });
        }

        if (file.name.endsWith('.xlsx')) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const headers = jsonData.shift(); // Preserve original headers
            fileData = mapDataToHeaders(headers, jsonData); // Maintain order

            console.log('xlsx loaded', fileData);

        } else if (file.name.endsWith('.csv')) {
            const csvData = Papa.parse(e.target.result, { header: true, skipEmptyLines: true });
            const headers = csvData.meta.fields;

            fileData = csvData.data.map(row => {
                return headers.reduce((obj, header) => {
                    obj[header] = row[header] !== undefined ? row[header] : '';
                    return obj;
                }, {});
            });

            console.log('csv loaded', fileData);
        }

        morningRoutine();
    }

    if (file.name.endsWith('.xlsx')) {
        reader.readAsArrayBuffer(file);
    } else if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    }
}

// 💾 Download Processed Results
function downloadResults() {
    let filename = `morning_match${new Date().toISOString().slice(0, 10)}.xlsx`;
    const ws = XLSX.utils.json_to_sheet(fileData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename);
}