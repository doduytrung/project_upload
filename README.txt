This project aims to be a demo application for the function of uploading a file.

-------------------
FUNCTION OF PROJECT
-------------------
Upload a file to host with max 300 MB

--------------------
ARCHITECT OF PROJECT
--------------------

Database: MongoDB
Back-end: 
	+Language: Node JS
	+Framework: Express 4x
	+DB Driver: MongoSkin
	+Libraries: multer, crypto, body-parser
Front-end:
	+HTML5/CSS3
	+Bootstrap 3
	+JQuery 2.x.y

--------------------
STRUCTURE OF PROJECT
--------------------

-upload folder: contains uploaded files
-public folder: contains front-end files: icon, css, js
-view folder: contains html files for displaying web pages
-root folder: 
	+Server.js: application file on back-end
	+tools.js: contains some functions for encoding and decoding
	+config.js: contains some information to set up application.