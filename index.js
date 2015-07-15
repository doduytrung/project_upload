//define dependencies
var express=require("express");
var multer=require("multer");
var mongoskin=require('mongoskin');
var fs=require('fs');
var bodyParser=require('body-parser');

var tools=require('./tools.js');
var https = require('https');

//declare variables
var csrf;
var token;
var doneFlag=false;
var limitFlag=true;
var targetName='';
var jsonIn;
var jsonOut;

//load config information
var config=require('./config.js');
var port=config.SERVER_PORT;
var url="mongodb://"+config.DB_ADDR+":"+config.DB_PORT+"/"+config.DB_NAME;
var db=mongoskin.db(url);
var basePath='http://'+config.SERVER_ADDR+':'+config.SERVER_PORT;


//configure the multer
var app=express();
app.use(bodyParser.json());
app.use(express.static(__dirname+'/public'));
app.use(multer({dest:"./"+config.UPLOAD_FOLDER+"/",
		limits:{fileSize:eval(config.UPLOAD_SIZE)},
		rename:function(fieldname,filename){
			var t=Date.now();
			targetName=tools.encode(t);
			return targetName;
		},
		onFileUploadStart:function(file,req,res){					
			//check csrf	
 			var rc = req.headers.cookie;			
			rc && rc.split(';').forEach(function( cookie ) {
        			var parts = cookie.split('=');
        			if(parts[0]=='csrf'){
					token=parts[1];
				}
    			});
			/*
			if(token != csrf){
				console.log('CSRF Error!');											
				return false;
			}*/
			console.log('Starting upload file...');	
		},
		onFileUploadComplete:function(file){
			console.log('Complete upload file.');
			if(limitFlag){
				doneFlag=true;
			}
			
		},
		onFileSizeLimit:function(file){
			console.log('File size exceeds limit.');
			fs.unlink('./'+file.path);
			limitFlag=false;
		}
	}));


//handling routers
app.get('/',function(req,res){	
	//csrf=tools.generateToken();
	//res.cookie('csrf',csrf);	
	res.sendFile(__dirname+"/view/index.html");	
	
});

app.get('/config',function(req,res){
	jsonOut={	maxSize:config.UPLOAD_SIZE,
			publicKey:config.PUBLIC_KEY,
			basePath:basePath
		};
	res.json(jsonOut);
	res.end();
});

app.get('*/public/*',function(req,res){
	var path=req.url;
	var pos=path.indexOf('public');
	path=path.slice(pos,path.length);	
	res.sendFile(__dirname+"/"+path);
});

app.get('/error',function(req,res){
	res.sendFile(__dirname+'/view/errorFile.html');
});

app.get('/i/:key',function(req,res){		
	res.sendFile(__dirname+'/view/download.html');
});

app.get('/d/:key/:token',function(req,res){	
	res.sendFile(__dirname+'/view/delete.html');
});

// API for operations: find, upload, delete a file

app.get('/api/find/:key',function(req,res){
	console.log('Finding...');
	//var key=req.body['key'].trim();	
	var key=req.params.key;	

	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  	res.header('Expires', '-1');
  	res.header('Pragma', 'no-cache');	
	jsonIn={filename:key};
	
	db.collection(config.COL_NAME).findOne(jsonIn,function(err,data){
		
		if(!err){			
			if(data!=null){							
				jsonOut={
					message:'Found',
					down_link:basePath+'/i/'+data.filename,
  					filename: data.originalname,  				
  					filesize: data.size+'MB',
  					filetype: data.type,
  					filedesc: data.description!==null?data.description:data.originalname,
  					filepass: data.password!==null?'Yes':'No' 
				};			
			}else{
				jsonOut={message:'File information not found!'};				
			}
		}else{
			jsonOut={message:'Error'};
		}
		console.log(jsonOut);
		res.json(jsonOut);
		res.end();
	});	
});


app.get('/api/download/stream/:filename/:token',function(req,res){	
	var token=req.params.token;
	var filename=req.params.filename;	
	
	//check csrf & download file
	if(token===csrf){		
		console.log('Downloading...');			
		var path=__dirname+'/'+config.UPLOAD_FOLDER+'/'+filename;			
		res.download(path); 	
		csrf=tools.generateToken();		                    
        } 
});


app.get('/api/download/:filename/:recaptcha',function(req,res){	
	var recaptcha=req.params.recaptcha;
	var filename=req.params.filename;		
	
	verifyRecaptcha(recaptcha, function(successRecaptcha) {
		console.log('Verifying captcha...');
                if (successRecaptcha) {		 
			csrf=tools.generateToken();
			jsonOut={message:'Success',url:'/api/download/stream/'+filename+'/'+csrf};    			              
                } else {
			jsonOut={message:'Invalid recaptcha'};   			                  
                }		
		res.json(jsonOut);
		res.end();  
        });	
});

app.get('/api/download/:filename/:recaptcha/:password',function(req,res){	
	var recaptcha=req.params.recaptcha;
	var filename=req.params.filename;
	var password=req.params.password;
	var key=filename.slice(0,filename.length-4);
	var fileInfo={filename:key,password:password};	
	console.log('Verirying...'+JSON.stringify(fileInfo));		
	
	verifyRecaptcha(recaptcha, function(successRecaptcha) {	
		console.log('Verifying captcha...');	
                if (successRecaptcha) {
			verifyPassword(fileInfo, function(successPassword) {	
				console.log('Verifying password...');		
				if(successPassword){							
					token=tools.generateToken();
					jsonOut={message:'Success',url:'/api/download/stream/'+filename+'/'+token};  					
				}else{
					jsonOut={message:'Invalid password!'};					
				}
			});					                   
                } else {
			jsonOut={message:'Invalid recaptcha!'};   			             
                }
		csrf=token;			
		res.json(jsonOut);
		res.end();  
        });		
});

app.delete('/api/delete/:filename/:token',function(req,res){
	console.log('Deleting...');
	var filename=req.params.filename;
	var token=req.params.token;

	try{
		fs.unlink('./'+config.UPLOAD_FOLDER+'/'+filename);
		console.log('File is removed!');
	}catch(e){
		console.log('File is not existed!');
	}
	filename=filename.slice(0,filename.lastIndexOf('.'));	
	jsonIn={filename:filename};//,_id:token};		
	db.collection(config.COL_NAME).remove(jsonIn,function(err,result){		
		if(result>0){
			jsonOut={message:'Success',content:'File information is deleted!'};
		}else{
			jsonOut={message:'Error',content:'File information is not deleted!'};
		}			
		console.log(jsonOut);
		res.json(jsonOut);
		res.end(); 
	});				
});

app.post('/api/upload',function(req,res){	
	
	if(doneFlag==true){			
		var originalname=req.files['fileUpload'].originalname;
		var size=(req.files['fileUpload'].size/(1024*1024)).toFixed(2);
		var type=req.files['fileUpload'].extension;
				
		var jsonIn={			
			"filename":targetName,
			"originalname":originalname,
			"size": size,
			"type": type,
			"description":req.body['description'],
			"password":req.body['password']
		};			
		db.collection(config.COL_NAME).insert(jsonIn,function(err,result){
			if(!err) {				
				jsonOut={	
					message:'Success',	
					content:'File info was stored into database!',	
					filename:targetName,
					originalname:originalname,
					size: size,
					down_link:basePath+'/i/'+targetName,
					del_link:basePath+'/d/'+targetName+'/'+result[0]['_id']
				};				
			}else{
				jsonOut={message:'Error', content:'File info was not stored into database!'};				
			}
			console.log(jsonOut.content);							
			res.json(jsonOut);
			res.end();
		});			
		
	}else{		
		jsonOut={message:'Error', content: 'Upload failed!'};
		console.log(jsonOut.content);
		res.json(jsonOut);
		res.end();
	}
});

// 404 error 
app.get('*', function(req, res){
	res.sendFile(__dirname+'/view/error404.html');
});

app.listen(port,function(){
	console.log("Working on port %d",port);
});

// Helper function to make API call to recatpcha and check response
function verifyRecaptcha(key, callback) {
        https.get("https://www.google.com/recaptcha/api/siteverify?secret=" + config.SECRET_KEY + "&response=" + key, function(res) {
                var data = "";
                res.on('data', function (chunk) {
                        data += chunk.toString();
                });
                res.on('end', function() {
                        try {
                                var parsedData = JSON.parse(data);
                                console.log(parsedData);
                                callback(parsedData.success);
                        } catch (e) {
                                callback(false);
                        }
                });
        });
}

// Helper function to check file information
function verifyPassword(fileInfo,callback) {			
	db.collection(config.COL_NAME).findOne(fileInfo,function(err,data){		
		if(!err){			
			if(data!=null){					
                                callback(true);			
			}else{				
				callback(false);				
			}
		}else{			
			callback(false);
		}
	});
}
