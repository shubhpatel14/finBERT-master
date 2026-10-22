"""
Root launcher for EdgeFinder.
Permits running `streamlit run app.py` from either:
- c:\\Users\\WIN 10\\Desktop\\finBERT-master
- c:\\Users\\WIN 10\\Desktop\\finBERT-master\\finbert
"""

import os
import sys

# Add finbert folder to sys.path
finbert_dir = os.path.join(os.path.dirname(__file__), "finbert")
if finbert_dir not in sys.path:
    sys.path.insert(0, finbert_dir)

# Change working directory so relative paths (assets, pages, components) resolve seamlessly
os.chdir(finbert_dir)

# Execute main finbert app
app_file = os.path.join(finbert_dir, "app.py")
with open(app_file, "r", encoding="utf-8") as f:
    code = compile(f.read(), app_file, 'exec')
    exec(code, globals())
