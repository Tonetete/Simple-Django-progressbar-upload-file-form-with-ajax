from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse
from django.core.cache import cache
from django.core.cache.backends.memcached import MemcachedCache
import json


from .models import UploadFile
from .forms import UploadFileForm




def upload_file(request):
    if request.method == 'POST':
        form = UploadFileForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return HttpResponse(json.dumps({'message': 'Upload complete!'}))
    else:
        form = UploadFileForm()
        return render_to_response('index.html', {'form': form}, context_instance=RequestContext(request))



def upload_status(request):
    if request.method == 'GET':
        if 'key' in request.GET:
            key = request.GET['key']
            data = None
            while data is None:
                #data = cache.get(key)
                data = MemcachedCache.get(key)
            return HttpResponse(json.dumps(data), content_type="application/json")
        else:
            return HttpResponse(json.dumps({'error':'No parameter "key" in GET request'}), content_type="application/json")
    else:
        return HttpResponse(json.dumps({'error':'No GET request'}), content_type="application/json")