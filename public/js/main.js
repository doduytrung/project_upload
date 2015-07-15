
resetAll();
$(function () {		
    var maxSize;
    $.get('/config',function(config){
	maxSize=config.maxSize;
    });
    resetAll();
    $('#btnUploadFile').click(function(){	
	$('input[type="file"]').click();
	$('#btnUploadFile').blur();
    });
    $('input[type="file"]').on('change', function (evt) {
        evt.preventDefault();
        
        var formData = new FormData();
        var file = document.getElementById('fileUpload').files[0];
	var size=file.size;
	
	if(size>eval(maxSize)){				
		$('div.alert').removeClass('hide');
		$('div.alert').html('File size is larger than '+eval(maxSize)/1024/1024+' MB');
		setTimeout(function () {
			$('div.alert').addClass('hide');
			$('#info').show();	
			$('#links').hide();	
			$('#box_title').html('Why FilePi ?');
                        return true;
                    }, 3000);			
		return false;
	}	
	  
        formData.append('fileUpload', file);
        formData.append('description', $('#description').val());
        formData.append('password', $('#password').val());

	
	
        var xhr = new XMLHttpRequest();
        xhr.open('post', '/api/upload', true);

        xhr.upload.onprogress = function (e) {
            if (e.lengthComputable) {
		
                var percentage = (e.loaded / e.total) * 100;
                var percentageText = Math.round(percentage) + '%';
		$('div.progress').show();	 
 		$('div.percent').show(); 
                $('div.progress div.bar').css('width', percentageText);               
                $('div.percent').html(percentageText);
                if (percentage === 100) {
                    setTimeout(function () {
                        return true;
                    }, 3000);
                    $('div.progress').hide();
                    $('div.percent').hide();                   
                    
                } else {		    
                    $('#uploadForm').hide();
                }
            }
        };

        xhr.onload = function () {
            if (xhr.status === 200) {
		if(xhr.responseText!==''){
               		var data=$.parseJSON(xhr.responseText);
                	$('#down_link').val(data['down_link']);
                	$('#del_link').val(data['del_link']);                	  
			var title=data['originalname']+'['+data['size']+'MB]';
			title=(title.length>22)?title.substring(0,23):title;
			$('#box_title').html(title);         
			$('#description').val('');
			$('#password').val(''); 	
			addthis.update('share', 'url', data['down_link']);
      			addthis.update('share', 'title', 'Download '+data['originalname']);
      			addthis.update('share', 'description', 'Free Download '+data['originalname']);
                } 
                $('#links').show();
                $('#info').hide();
                $('#share').removeClass('hide');
		
                $('#fileUpload').val('');
                $('#uploadForm').show();
            } else {
                $('alert').show();
		$('alert').html("Error! Upload failed.");
            }
        };
        xhr.onerror = function (e) {
            $('alert').show();
	    $('alert').html("Error! Upload failed.");
        };

        xhr.send(formData);
    });
});

function resetAll() {
    $('#fileUpload').val('');
    $('div.progress').hide();   
}