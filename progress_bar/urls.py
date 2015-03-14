from django.conf.urls import patterns, include, url
from django.contrib import admin

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    url(r'^progressbar/', include('progressbar.urls'), name='progressbar'),
    #url(r'^progressbarupload/', include('progressbarupload.urls')),
)
