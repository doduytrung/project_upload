var url = location.href;
var pos = url.lastIndexOf('/');
var key = url.slice(pos + 1, url.length);
var data = {key: key};

$.ajaxSetup({cache: false});

$(function () {
	
    $.ajax({
        url: "/api/find/"+key,        
	cache: false,
        success: function (data) {
		
            //var data = $.parseJSON(res);
            if (data.message === 'Found') {
                $('#filename').html(data.filename);
                $('#filesize').html(data.filesize);
                $('#filetype').html(data.filetype);
                $('#filedesc').html(data.filedesc);
                $('#filepass').html(data.filepass);
                if (data.filepass === 'Yes') {
                    $('#divPass').removeClass('hide');
                }
                addthis.update('share', 'url', data.down_link);
                addthis.update('share', 'title', 'Download ' + data.filename);
                addthis.update('share', 'description', 'Free Download ' + data.filename);
            } else {
                location.href = '/error';
            }
        }
    });
/*
    $.ajax({
        url: "/api/find",
        type: "POST",
        data: JSON.stringify(data),
        dataType: "json",
        contentType: "application/json",
	cache: false,
        success: function (res) {
            var data = $.parseJSON(res);
            if (data.message === 'Found') {
                $('#filename').html(data.filename);
                $('#filesize').html(data.filesize);
                $('#filetype').html(data.filetype);
                $('#filedesc').html(data.filedesc);
                $('#filepass').html(data.filepass);
                if (data.filepass === 'Yes') {
                    $('#divPass').removeClass('hide');
                }
                addthis.update('share', 'url', data.down_link);
                addthis.update('share', 'title', 'Download ' + data.filename);
                addthis.update('share', 'description', 'Free Download ' + data.filename);
            } else {
                location.href = '/error';
            }
        }
    });*/

});

$('#btnDownloadFile').on('click', function (evt) {
    evt.preventDefault();

    //check captcha
    var recaptcha = $("#g-recaptcha-response").val();
    if (recaptcha !== '') {
        //check password
        var password = $('#password').val();
        if ($('#filepass').html() === 'No') {
            //redirect to download with empty password
            var filename = key + "." + $('#filetype').html();
            var link = "/api/download/" + filename + "/" + recaptcha;
            $.ajax({
                url: link,
                success: function (res) {
                    if (res.message === 'Success') {
                        window.location = res.url;
                    } else {
                        alertError(res.message);
                    }
                    grecaptcha.reset();
                }
            });

        } else if (password !== '') {
            //redirect to download with password
            var filename = key + "." + $('#filetype').html();
            var link = "/api/download/" + filename + "/" + recaptcha + "/" + password;


            $.ajax({
                url: link,
                success: function (res) {
                    if (res.message === 'Success') {
                        window.location = res.url;
                    } else {
                        alertError(res.message);
                    }
                    grecaptcha.reset();
                    $('#password').val('');
                }
            });
        } else {
            alertError('You must enter password for download!');
        }
    } else {
        alertError('You must click on the checkbox!!!');
    }

});

function alertError(msg) {
    $("div.alert").fadeIn();
    $("div.alert").addClass('alert-danger');
    $('div.alert').html(msg);
    setTimeout(function () {
        $("div.alert").fadeOut();
    }, 3000);
}
