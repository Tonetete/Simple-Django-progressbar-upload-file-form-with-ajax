from django.db import models
from django.conf import settings

UPLOAD_DIR = getattr(settings, "UPLOAD_DIR", "uploads")

class UploadFile(models.Model):
    title = models.CharField(blank=False, max_length=50)
    file = models.FileField(blank=False, null=False, upload_to=UPLOAD_DIR)
    created_on = models.DateTimeField(auto_now_add=True)
    modified_on = models.DateTimeField(auto_now_add=True, auto_now=True)


