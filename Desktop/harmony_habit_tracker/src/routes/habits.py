from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.habit import Habit
import json
from datetime import datetime

habits_bp = Blueprint('habits', __name__)

@habits_bp.route('/user/<int:user_id>/habits', methods=['GET'])
def get_habits(user_id):
    """Получение всех привычек пользователя"""
    habits = Habit.query.filter_by(user_id=user_id).all()
    return jsonify([habit.to_dict() for habit in habits]), 200

@habits_bp.route('/habits/<int:habit_id>', methods=['GET'])
def get_habit(habit_id):
    """Получение информации о конкретной привычке"""
    habit = Habit.query.get_or_404(habit_id)
    return jsonify(habit.to_dict()), 200

@habits_bp.route('/user/<int:user_id>/habits', methods=['POST'])
def create_habit(user_id):
    """Создание новой привычки"""
    data = request.get_json()
    
    # Проверка наличия обязательных полей
    if 'name' not in data:
        return jsonify({'error': 'Отсутствует обязательное поле "name"'}), 400
    
    # Обработка частоты
    frequency = data.get('frequency', {"type": "daily"})
    
    # Обработка времени напоминания
    reminder_time = None
    if 'reminder_time' in data and data['reminder_time']:
        try:
            reminder_time = datetime.strptime(data['reminder_time'], '%H:%M').time()
        except ValueError:
            return jsonify({'error': 'Неверный формат времени напоминания. Используйте формат HH:MM'}), 400
    
    # Создание новой привычки
    habit = Habit(
        user_id=user_id,
        name=data['name'],
        description=data.get('description'),
        icon=data.get('icon'),
        color=data.get('color'),
        frequency=frequency,
        target_value=data.get('target_value'),
        unit=data.get('unit'),
        reminder_time=reminder_time
    )
    
    db.session.add(habit)
    db.session.commit()
    
    return jsonify({'message': 'Привычка успешно создана', 'habit': habit.to_dict()}), 201

@habits_bp.route('/habits/<int:habit_id>', methods=['PUT'])
def update_habit(habit_id):
    """Обновление информации о привычке"""
    habit = Habit.query.get_or_404(habit_id)
    data = request.get_json()
    
    # Обновление полей
    if 'name' in data:
        habit.name = data['name']
    
    if 'description' in data:
        habit.description = data['description']
    
    if 'icon' in data:
        habit.icon = data['icon']
    
    if 'color' in data:
        habit.color = data['color']
    
    if 'frequency' in data:
        habit.set_frequency(data['frequency'])
    
    if 'target_value' in data:
        habit.target_value = data['target_value']
    
    if 'unit' in data:
        habit.unit = data['unit']
    
    if 'reminder_time' in data:
        if data['reminder_time']:
            try:
                habit.reminder_time = datetime.strptime(data['reminder_time'], '%H:%M').time()
            except ValueError:
                return jsonify({'error': 'Неверный формат времени напоминания. Используйте формат HH:MM'}), 400
        else:
            habit.reminder_time = None
    
    if 'is_active' in data:
        habit.is_active = data['is_active']
    
    habit.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'Привычка успешно обновлена', 'habit': habit.to_dict()}), 200

@habits_bp.route('/habits/<int:habit_id>', methods=['DELETE'])
def delete_habit(habit_id):
    """Удаление привычки"""
    habit = Habit.query.get_or_404(habit_id)
    
    db.session.delete(habit)
    db.session.commit()
    
    return jsonify({'message': 'Привычка успешно удалена'}), 200
