# Content Librarian tools
### [content-librarian.github.io](content-librarian.github.io)
Building a collection of tools. Trying to share some things that have made my job easier.

### [table maker](https://content-librarian.github.io/table-maker/)
Copy the html from an unnamed website that compiles data on course materials scraped from syllabi posted on the open web but makes it difficult to export that data to excel. 

### [isbn parser](https://content-librarian.github.io/isbn-parser/)
Upload a spreadsheet of isbns with known publishers to extract prefix and registrant groups. Simple, but helps get a complicated thing done quickly.

### [description cleaner](https://content-librarian.github.io/description-cleaner/)
A WYSIWYG HTML editor with a few extra buttons to help clean up text pasted from a website and turn it into compact HTML. 
- Removes most tags, leaving p tags and lists from pasted text automatically. 
- `line breaks` button removes unnecessary line breaks and changes any br tags into opening and closing p tags appropriately.
- `lists` button looks for asterisks and bullet points and converts them into ul and li tags appropriately. 

### [cover browser](https://content-librarian.github.io/cover-broswer/)
Search for book covers across multiple sources.
Given a spreadsheet with the columns: EISBN, PRINT_ISBN, TITLE, IMPRINT, PUBLISHER, HAS_COVER, will display book cover images from urls constructed using the EISBN field. 
Displays a status for each image based on HAS_COVER field. 
Filter and sort by status, publisher.
Clicking an image opens a window with retailer options.
Selecting a retailer from the dropdown menu displays the cover image from that retailer using the EISBN. A button allows for displaying the image using the PRINT_ISBN. 
Right click the image to save using standard browser tool.
Make changes to a status, take notes, click save and download an export of findings.


### [publisher search](https://content-librarian.github.io/publisher-search/)
Custom Google search engine filtered to a curated list of publisher websites.
Basically a custom skin with ads removed.

### [bulk search](https://content-librarian.github.io/bulk-search/)
Bulk Google Books search. Upload a spreadsheet of ISBNs, get a spreadsheet of results.

### caveats, known issues, etc.
Lots of redundancies and things that could benefit from writing shared functions and classes instead of copy-pasting and tweaking for each particular job. This is just stuff I do when I've got time, and I don't have enough time to do it that way. Some of these are attempts to share bare-bones versions of python scripts I've written with people who don't know python. In these cases, I'm using the smallest amount of javascript needed to make the page interactive and to run the python script, and then within the confines of the python available in the browser. Not always user friendly, and requires things to be the way I expect them to be. 
