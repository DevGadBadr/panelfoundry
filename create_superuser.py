"""
Run once to create a Django admin superuser:
  python create_superuser.py
"""
import os
import django
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "foundry.settings")
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
username = os.getenv("DJANGO_SU_USER", "admin")
password = os.getenv("DJANGO_SU_PASS", "admin")
email = os.getenv("DJANGO_SU_EMAIL", "admin@foundry.local")

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f"Superuser '{username}' created.")
else:
    print(f"Superuser '{username}' already exists.")
