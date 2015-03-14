__author__ = 'antonio'

from django.conf.urls import patterns, include, url
from django.contrib import admin

urlpatterns = patterns('',
    url(r'^uploadfile', 'progressbar.views.upload_file', name='upload_file'),
    url(r'^upload_status$', 'progressbar.views.upload_status', name='upload_status'),
)
