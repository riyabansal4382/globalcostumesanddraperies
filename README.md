Global Costumes & Draperies
A searchable catalog and hire platform for an Indian costume rental business. It replaced the owner sending catalog photos one by one over WhatsApp. Built as an independent client project, with me as the sole developer, in under two months.
Live site: https://globaldresssuppliers.com Note: this repository is private because it is client work.
<!-- Add a screenshot of the catalog here: ![Catalog](docs/catalog.png) -->
What it does
Catalog of 2,800+ items, synced from the owner's OneDrive through the Microsoft Graph API (an Azure app registration handles access). The owner keeps managing photos in OneDrive as before, and I pull updates into the site on demand.
Fuzzy search, so customers find costumes without knowing the exact name.
Color and category filtering.
Hire basket and WhatsApp checkout: the customer enters size, quantity, and hire date, and the details plus a link to the costume are sent to the owner on WhatsApp.
Admin panel behind Google OAuth for inventory management.
Automatic color tagging
To power the color filter, I wrote an AI-assisted Python script that tags each costume photo with a color:
Crop the image to the center 60%, which removes most of the background.
Count the frequency of the remaining colors.
Assign the most frequent color.
I ran the 2,800+ photos in batches. After each batch I reviewed the tags, corrected mistakes, and adjusted the script before running the next one. Later batches needed noticeably fewer corrections, and I estimate roughly 70% accuracy before manual review. Every tag is reviewed before it goes live.
Limitations: multi-colored costumes and photos where the model or props are in the center can be tagged wrong. A color-clustering or background-removal approach would be the next improvement.
Tech
React, TypeScript, Python, Microsoft Graph API, OneDrive, Azure, Google OAuth, WhatsApp Business API, Google Analytics.
Results
515 visits and 1,500+ page views since launch. The owner uses it daily and now shares a link with customers in-store instead of sending photos.
"Building the website has been a great help, something we have been planning to do for over 5 years..." — the owner, Global Costumes & Draperies
Author
Riya Bansal, Computer Science at Drexel University. GitHub | LinkedIn
