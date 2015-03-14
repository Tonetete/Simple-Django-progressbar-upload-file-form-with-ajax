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