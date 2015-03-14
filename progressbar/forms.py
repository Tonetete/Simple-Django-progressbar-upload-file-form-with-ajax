__author__ = 'antonio'

from django import forms
from .models import UploadFile

class UploadFileForm(forms.ModelForm):
  file = forms.FileField(widget=forms.FileInput(
    attrs={'required': 'required'}))  # required=True is the default, but not show it validation in template
  class Meta:
    model = UploadFile