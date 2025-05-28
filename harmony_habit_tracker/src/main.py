import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))  # DON'T CHANGE THIS !!!

from flask import Flask, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from src.models.user import db
import json

# Импорт моделей
from src.models.habit import Habit
from src.models.habit_log import HabitLog
from src.models.statistic import Statistic

# Импорт маршрутов
from src.routes.auth import auth_bp
from src.routes.habits import habits_bp
from src.routes.logs import logs_bp
from src.routes.stats import stats_bp

def create_app():
    app = Flask(__name__)
    
    # Конфигурация базы данных
    app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{os.getenv('DB_USERNAME', 'root')}:{os.getenv('DB_PASSWORD', 'password')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '3306')}/{os.getenv('DB_NAME', 'mydb')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Инициализация базы данных
    db.init_app(app)
    
    # Регистрация маршрутов
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(habits_bp, url_prefix='/api')
    app.register_blueprint(logs_bp, url_prefix='/api')
    app.register_blueprint(stats_bp, url_prefix='/api')
    
    # Маршрут для статических файлов
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, 'index.html')
    
    # Обработка ошибок
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Ресурс не найден"}), 404
    
    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Внутренняя ошибка сервера"}), 500
    
    # Создание таблиц базы данных
    with app.app_context():
        db.create_all()
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
