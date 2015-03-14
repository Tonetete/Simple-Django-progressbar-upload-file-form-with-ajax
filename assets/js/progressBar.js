/**
 * Created by Tone on 8/3/15.
 */

/* For this problem I used 'Form Plugin jQuery' in order to accomplish this task for prevent
*  a redirect after submit form and find a way to send files through AJAX that you cannot do
*  it with $.ajax() or conventional ajax calls cause can't handle request that content files.
*
*  There are another variants commented below that works like a charm but with redirect after
*  submission, feel free to use whatever you want in order for your purposes of implementation*/

/* Form Plugin jQuery solution (what is set by default) */
// prepare the form when the DOM is ready
$(document).ready(function() {
    var options = {
        //target:        '#output2',   // target element(s) to be updated with server response
        beforeSubmit:  showRequest,  // pre-submit callback
        success:       showResponse,  // post-submit callback
        error:         showError,
        // other available options:
        url:       "/progressbar/uploadfile",  // override for form's 'action' attribute
        type:      "post",       // 'get' or 'post', override for form's 'method' attribute
        dataType:  "json"        // 'xml', 'script', or 'json' (expected server response type)
        //clearForm: true        // clear all form fields after successful submit
        //resetForm: true        // reset the form after successful submit

        // $.ajax options can be used here too, for example:
        //timeout:   3000
    };

    // bind to the form's submit event
    $('#formUpload').submit(function() {
        // inside event callbacks 'this' is the DOM element so we first
        // wrap it in a jQuery object and then invoke ajaxSubmit
        // disable submit button for prevent requests
        $("#buttonSubmit").prop("disabled", true);
        $(".processing-file").html("");
        $(this).ajaxSubmit(options);
        $(".progress").show();
        url = "/progressbar/upload_status?key=" + $("input[name=csrfmiddlewaretoken]").val();
        progressWorker(url);
        // !!! Important !!!
        // always return false to prevent standard browser submit and page navigation
        return false;
    });
});

// pre-submit callback
function showRequest(formData, jqForm, options) {
    // formData is an array; here we use $.param to convert it to a string to display it
    // but the form plugin does this for you automatically when it submits the data
    var queryString = $.param(formData);

    // jqForm is a jQuery object encapsulating the form element.  To access the
    // DOM element for the form do this:
    // var formElement = jqForm[0];

    //alert('About to submit: \n\n' + queryString);

    // here we could return false to prevent the form from being submitted;
    // returning anything other than false will allow the form submit to continue
    return true;
}

// post-submit callback
function showResponse(responseText, statusText, xhr, $form)  {
    // for normal html responses, the first argument to the success callback
    // is the XMLHttpRequest object's responseText property

    // if the ajaxSubmit method was passed an Options Object with the dataType
    // property set to 'xml' then the first argument to the success callback
    // is the XMLHttpRequest object's responseXML property

    // if the ajaxSubmit method was passed an Options Object with the dataType
    // property set to 'json' then the first argument to the success callback
    // is the json data object returned by the server

    if(statusText === "success"){
        $(".processing-file").html("");
        $(".processing-file").append(responseText.message);
        // enable submit button again for make requests
        $("#buttonSubmit").prop("disabled", false);

    }

    /*alert('status: ' + statusText + '\n\nresponseText: \n' + responseText +
        '\n\nThe output div should have already been updated with the responseText.');*/
}

/* If there are any errors in server, show in console log. */

function showError(response){
    console.log(response.responseText);
}


/* Submit call solution, prevent submit at beginning and start to monitor the all entire
 * upload process, we set csrf token as key for search after callback in django cache for
  * retrieve progress value.*/

/*$("#formUpload").submit(function(ev) {
    if ($.data(this, 'submitted')) return false;
    var url = "/progressbar/upload_status?key=" + $("input[name=csrfmiddlewaretoken]").val();
    $(".progress").show();
    progressWorker(url);
    $.data(this, 'submitted', true); // mark form as submitted.
    return true;
});*/


/* This function makes the monitor of all entire notification of process making an ajax call
* and modifying progress bar, it's calling in respectively submit functions above while percent
* is below of 100%*/
function progressWorker(url){
    percent = 0;
    $.ajax({
        url: url,
        async: true,
        dataType: "json",
        contentType: "application/json",
        success: function (progress) {
            if(progress.uploaded && progress.totalsize){
            	console.log("Percent: "+percent+"%");
            	percent = (progress.uploaded/progress.totalsize) * 100;
            	percent = parseInt(percent, 10);
                $('.progress-bar').css('width', percent+'%').attr('aria-valuenow', percent);
                $('.progress-bar').html(percent+"%");
            /* Call sleep function before make a new request in order to prevent much
              request to server. Use it wisely... */
            sleep(1000);            
	   }

        },
        complete: function(){
            if(percent<100){
                progressWorker(url);
            }
            else{
                $(".processing-file").show();
                $(".processing-file").append('<span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Processing file, please wait...');
            }
        },
	error: function (jqXHR, textStatus, errorThrown) {
                  if (jqXHR.status == 500) {
                      alert('Internal error: ' + jqXHR.responseText);
                  } else {
                      alert('Unexpected error.');
                  }
       }
    });
}

/* Custom function to sleep in order to prevent so many request for upload progress*/

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}
