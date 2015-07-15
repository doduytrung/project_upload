$(function () {	
		var basePath;
    		$.get('/config',function(config){
			basePath=config.basePath;
    		});
		var url=location.href;	
		var pos=url.lastIndexOf('/');
		var token=url.slice(pos+1,url.length);
		url=url.slice(0,pos);
		pos=url.lastIndexOf('/');
		key=url.slice(pos+1,url.length);
		var data={"key":key,"token":token};
				
		$.ajax({
			url:"/api/find",
			type:"POST",			
			data:JSON.stringify(data),
			dataType:"json",
			contentType:"application/json",
			success:function(res){					
				var data=$.parseJSON(res);	
				if(data.message==='Found'){				
					$('#filename').html(data.filename);
					$('#filesize').html(data.filesize);
					$('#filetype').html(data.filetype);
					$('#filedesc').html(data.filedesc);
					$('#filepass').html(data.filepass);
					if(data.password!=null){					
						$('#divPass').removeClass('hide');				
					}
					addthis.update('share', 'url', data.down_link);
      					addthis.update('share', 'title', 'Download '+data.filename);
      					addthis.update('share', 'description', 'Free Download '+data.filename);
				}else{
					location.href='/error';	
				}
			}
		});
		 $('#btnDeleteFile').click(function () {     			
			//var d={"filename":key+"."+$('#filetype').html(),"token":token};			
			$.ajax({
				url:"/api/delete/"+key+"."+$('#filetype').html()+"/"+token,
				type:"DELETE",				
				success:function(data){	
					bootbox.alert(data.content);	
					setTimeout(function () {
                        			location.href=basePath;	
                    			}, 5000);					
				}
			});
		});
	});