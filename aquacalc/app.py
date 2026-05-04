import os
from flask import Flask, render_template, redirect, url_for, request
from flask_sqlalchemy import SQLAlchemy
import webbrowser
from threading import Timer

basedir = os.path.abspath(os.path.dirname(__file__))
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'data.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class AppData(db.Model):
    key = db.Column(db.String(50), primary_key=True)
    value = db.Column(db.Text)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return redirect(url_for('aquarium_page'))

@app.route('/aquarium')
def aquarium_page():
    return render_template('aquarium.html')

@app.route('/service')
def service_page():
    return render_template('service.html')

@app.route('/reference')
def reference_page():
    return render_template('reference.html')

@app.route('/api/state', methods=['GET', 'POST'])
def api_state():
    if request.method == 'GET':
        record = db.session.get(AppData, 'app_state')
        if record:
            return record.value
        return '{}'
    else:
        data = request.get_data(as_text=True)
        record = db.session.get(AppData, 'app_state')
        if record:
            record.value = data
        else:
            db.session.add(AppData(key='app_state', value=data))
        db.session.commit()
        return 'OK'

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    if not os.environ.get('WERKZEUG_RUN_MAIN'):
        Timer(1.5, lambda: webbrowser.open(f'http://127.0.0.1:{port}')).start()
    app.run(debug=False, host='0.0.0.0', port=port)
else:
    application = app