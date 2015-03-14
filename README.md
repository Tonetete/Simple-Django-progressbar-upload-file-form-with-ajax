# Simple Django progressbar upload file form with ajax

This is a personal project I want to share with everybody, time ago I was trying to develop a progress bar notification using Django, searching around the web, many solutions I found but for disgraced not much were clarify to me in order to implement this solution for a personal project so now I have the time to venture and this is the result so far.

### Implementing a notification progress bar using upload handlers and cache

Many solutions for this problem ofted used **upload handlers** and accesing Django's framework cache, an approach for my solution was using this codesnippet: https://djangosnippets.org/snippets/678/ as you can see, for every submit form I set up CSRF token as the id for identify the progress upload, normally place in **META** field or **GET** inside the request header all of this logic are implemented in **handle_raw_input** and for every time django receive a **data chunk**, cache values are updated inside **receive_data_chunk** so easy, no? For more info about upload handlers see docs: https://docs.djangoproject.com/fr/1.5/topics/http/file-uploads/ and don't forget to update **settings.py** with the uploadhandler we use:

```python
from django.conf import global_settings
FILE_UPLOAD_HANDLERS = ('progressbar.uploadfilehandler.UploadProgressCachedHandler', ) \
+ global_settings.FILE_UPLOAD_HANDLERS`
```

Now in **views.py** we have to define the method required for make requests in javascript for check in intervals of time the current values of upload file so far:
```python
def upload_status(request):
    if request.method == 'GET':
        if request.GET['key']:
            if cache.get(request.GET['key']):
                value = cache.get(request.GET['key'])
                return HttpResponse(json.dumps(value), content_type="application/json")
            else:
                return HttpResponse(json.dumps({'error':"No csrf value in cache"}), content_type="application/json")
        else:
            return HttpResponse(json.dumps({'error':'No parameter key in GET request'}), content_type="application/json")
    else:
        return HttpResponse(json.dumps({'error':'No GET request'}), content_type="application/json")
```
After that we define the method that will cath all POST requests and send form for GET:

```python
def upload_file(request):
    if request.method == 'POST':
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return HttpResponse(json.dumps({'message': 'Upload complete!'}))
    else:
        form = UploadFileForm()
        return render_to_response('index.html', {'form': form}, context_instance=RequestContext(request))
```

And that's it for Django implementation! Easy, huh? Well, one step left for start running gears... the **javascript**


### Implementing AJAX for submit form and notificates progress bar

One problem I found in this part for dynamic requests implementing ajax is that you can submit form and inmediately start to launch requests for notify the progress so as long it will be fine in server side there's no problem but in real world we know it's never like that, we need to know it's something went wrong to notify to user in a production environment, furthermore, we can't notify when a processing file and upload is complete when upload handler finally finish his job through a conventional submit so no matter what, we need to use two types of AJAX, one for send file and another for request current status of upload file.

The problem was ajax (from Jquery API) can't handle upload files, at least with **FormData** and Django API processing files then I had to use the **Form Plugin JQuery** to acomplish this task: http://malsup.com/jquery/form/ 

```javascript
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
```

So, we make **Form JQuery plugin** take care of submit form setting options and calling **ajaxSubmit**, then we call **progressWorker** passing the url and csrf as parameter to check status continuously:


```javascript
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
```

That makes another Ajax request, for every success request, update progress bar and when it's complete, if percent is always below of 100, call function again until finish it and show a processing file dialog and wait for **Upload Complete!**  for **ajaxSubmit** to update dialog and notify to user:

```javascript
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
```

### Apreciations in order to use Django's cache framework in a production environment 

A better practice when you're going to deploy in production is to use **memcached** or the many caches presented in docs: https://docs.djangoproject.com/en/1.7/topics/cache/ some problems I found in deploy where cache was not retrieving any value when receive petitions, the problem was that is a local memory cache current to the process and in a multi-process environment like production would stay messing around and not working properly, for take this present if you try to use this in a production environment, I recommend to use **memcached**, works like a charm, direct to http://memcached.org/downloads for more explanation and after install just add this lines in settings.py et voilà:

```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
        'LOCATION': '127.0.0.1:11211',
    }
}
```

### Instructions for installing in development environment

