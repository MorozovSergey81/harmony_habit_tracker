from flask import Blueprint, request, jsonify
from src.models.user import db, User
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Регистрация нового пользователя"""
    data = request.get_json()
    
    # Проверка наличия необходимых полей
    if not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({'error': 'Отсутствуют обязательные поля'}), 400
    
    # Проверка уникальности имени пользователя и email
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Пользователь с таким именем уже существует'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Пользователь с таким email уже существует'}), 400
    
    # Создание нового пользователя
    user = User(
        username=data['username'],
        email=data['email'],
        password=data['password']
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'Пользователь успешно зарегистрирован', 'user_id': user.id}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Вход пользователя в систему"""
    data = request.get_json()
    
    # Проверка наличия необходимых полей
    if not all(k in data for k in ['username', 'password']):
        return jsonify({'error': 'Отсутствуют обязательные поля'}), 400
    
    # Поиск пользователя
    user = User.query.filter_by(username=data['username']).first()
    
    # Проверка пароля
    if user and user.check_password(data['password']):
        user.update_last_login()
        return jsonify({
            'message': 'Вход выполнен успешно',
            'user': user.to_dict()
        }), 200
    
    return jsonify({'error': 'Неверное имя пользователя или пароль'}), 401

@auth_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Получение информации о пользователе"""
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict()), 200

@auth_bp.route('/user/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Обновление информации о пользователе"""
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    # Обновление полей
    if 'username' in data:
        # Проверка уникальности имени пользователя
        existing_user = User.query.filter_by(username=data['username']).first()
        if existing_user and existing_user.id != user_id:
            return jsonify({'error': 'Пользователь с таким именем уже существует'}), 400
        user.username = data['username']
    
    if 'email' in data:
        # Проверка уникальности email
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user and existing_user.id != user_id:
            return jsonify({'error': 'Пользователь с таким email уже существует'}), 400
        user.email = data['email']
    
    if 'password' in data:
        user.set_password(data['password'])
    
    db.session.commit()
    
    return jsonify({'message': 'Информация о пользователе обновлена', 'user': user.to_dict()}), 200

@auth_bp.route('/user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Удаление пользователя"""
    user = User.query.get_or_404(user_id)
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'Пользователь успешно удален'}), 200
