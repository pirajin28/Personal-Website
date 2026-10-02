# PIRAJIN Personal Site

A dark space/cyberpunk personal website with a private admin panel.

## Run locally

1. Install Python.
2. Install Flask:
   `pip install flask`
3. Set an admin password.

Windows Command Prompt:
`set PIRAJIN_ADMIN_PASSWORD=your-password`

PowerShell:
`$env:PIRAJIN_ADMIN_PASSWORD="your-password"`

4. Run:
   `python app.py`

Public site:
http://127.0.0.1:8000

Admin:
http://127.0.0.1:8000/admin

Put your profile photo at:
`static/profile.jpg`

The admin panel currently edits profile text, tags, projects, project status/progress, timeline, and links without changing the HTML/CSS.
