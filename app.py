from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.utils import secure_filename
from datetime import datetime
from pathlib import Path
import json
import os

app = Flask(__name__)
app.secret_key = os.environ.get("PIRAJIN_SECRET_KEY", "change-this-local-secret")

DATA_FILE = Path("data/site.json")
UPLOAD_DIR = Path("static/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def load_data():
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))

def save_data(data):
    DATA_FILE.write_text(
        json.dumps(data, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )

@app.route("/")
def home():
    data = load_data()
    # These two values are automatic: project count and current year are calculated on every page load.
    data["stats"] = [
        {"value": f"{len(data.get('projects', [])):02d}", "label": "Projects"},
        {"value": "∞", "label": "Ideas"},
        {"value": str(datetime.now().year), "label": "Building"}
    ]
    return render_template("index.html", site=data)

@app.route("/admin")
def admin():
    if not session.get("admin"):
        return redirect(url_for("login"))
    return render_template("admin.html", site=load_data())

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        password = request.form.get("password", "")
        expected = os.environ.get("PIRAJIN_ADMIN_PASSWORD")
        if not expected:
            return "Set PIRAJIN_ADMIN_PASSWORD before starting the server.", 500
        if password == expected:
            session["admin"] = True
            return redirect(url_for("admin"))
        return render_template("login.html", error="Incorrect password.")
    return render_template("login.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))


@app.route("/api/upload", methods=["POST"])
def upload():
    if not session.get("admin"):
        return jsonify({"error": "Unauthorized"}), 401

    file = request.files.get("file")
    kind = request.form.get("kind", "image")

    if not file or not file.filename:
        return jsonify({"error": "No file selected"}), 400

    allowed = {"png", "jpg", "jpeg", "webp", "gif"}
    ext = Path(secure_filename(file.filename)).suffix.lower().lstrip(".")
    if ext not in allowed:
        return jsonify({"error": "Use PNG, JPG, JPEG, WEBP, or GIF."}), 400

    if kind == "profile":
        filename = f"profile.{ext}"
    else:
        filename = f"{kind}_{datetime.now().strftime('%Y%m%d%H%M%S%f')}.{ext}"

    destination = UPLOAD_DIR / filename
    file.save(destination)

    return jsonify({"ok": True, "url": f"/static/uploads/{filename}"})

@app.route("/api/site", methods=["GET", "POST"])
def api_site():
    if not session.get("admin"):
        return jsonify({"error": "Unauthorized"}), 401

    if request.method == "GET":
        return jsonify(load_data())

    data = request.get_json()
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid data"}), 400

    save_data(data)
    return jsonify({"ok": True, "site": data})

if __name__ == "__main__":
    print("PIRAJIN website: http://127.0.0.1:8000")
    print("Admin panel:      http://127.0.0.1:8000/admin")
    app.run(host="127.0.0.1", port=8000, debug=True)
