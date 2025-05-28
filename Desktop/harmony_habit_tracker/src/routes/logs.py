from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.habit import Habit
from src.models.habit_log import HabitLog
from datetime import datetime, date

logs_bp = Blueprint('logs', __name__)

@logs_bp.route('/habits/<int:habit_id>/logs', methods=['GET'])
def get_habit_logs(habit_id):
    """Получение всех записей о выполнении конкретной привычки"""
    # Проверка существования привычки
    habit = Habit.query.get_or_404(habit_id)
    
    # Получение параметров фильтрации из запроса
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Базовый запрос
    query = HabitLog.query.filter_by(habit_id=habit_id)
    
    # Применение фильтров, если они указаны
    if start_date:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(HabitLog.date >= start)
        except ValueError:
            return jsonify({'error': 'Неверный формат даты начала. Используйте формат YYYY-MM-DD'}), 400
    
    if end_date:
        try:
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(HabitLog.date <= end)
        except ValueError:
            return jsonify({'error': 'Неверный формат даты окончания. Используйте формат YYYY-MM-DD'}), 400
    
    # Сортировка по дате (от новых к старым)
    logs = query.order_by(HabitLog.date.desc()).all()
    
    return jsonify([log.to_dict() for log in logs]), 200

@logs_bp.route('/habits/<int:habit_id>/logs/<string:log_date>', methods=['GET'])
def get_habit_log_by_date(habit_id, log_date):
    """Получение записи о выполнении привычки за конкретную дату"""
    # Проверка существования привычки
    habit = Habit.query.get_or_404(habit_id)
    
    try:
        log_date_obj = datetime.strptime(log_date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Неверный формат даты. Используйте формат YYYY-MM-DD'}), 400
    
    log = HabitLog.query.filter_by(habit_id=habit_id, date=log_date_obj).first()
    
    if not log:
        return jsonify({'error': 'Запись не найдена'}), 404
    
    return jsonify(log.to_dict()), 200

@logs_bp.route('/habits/<int:habit_id>/logs', methods=['POST'])
def create_habit_log(habit_id):
    """Создание новой записи о выполнении привычки"""
    # Проверка существования привычки
    habit = Habit.query.get_or_404(habit_id)
    
    data = request.get_json()
    
    # Проверка наличия обязательных полей
    if 'date' not in data or 'completed' not in data:
        return jsonify({'error': 'Отсутствуют обязательные поля'}), 400
    
    # Обработка даты
    try:
        log_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Неверный формат даты. Используйте формат YYYY-MM-DD'}), 400
    
    # Проверка на существование записи за эту дату
    existing_log = HabitLog.query.filter_by(habit_id=habit_id, date=log_date).first()
    if existing_log:
        return jsonify({'error': 'Запись о выполнении привычки за эту дату уже существует'}), 400
    
    # Создание новой записи
    log = HabitLog(
        habit_id=habit_id,
        date=log_date,
        completed=data['completed'],
        value=data.get('value'),
        notes=data.get('notes')
    )
    
    db.session.add(log)
    
    # Обновление серии выполнений привычки
    habit.update_streak(data['completed'])
    
    db.session.commit()
    
    return jsonify({'message': 'Запись о выполнении привычки успешно создана', 'log': log.to_dict()}), 201

@logs_bp.route('/habits/<int:habit_id>/logs/<string:log_date>', methods=['PUT'])
def update_habit_log(habit_id, log_date):
    """Обновление записи о выполнении привычки"""
    # Проверка существования привычки
    habit = Habit.query.get_or_404(habit_id)
    
    try:
        log_date_obj = datetime.strptime(log_date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Неверный формат даты. Используйте формат YYYY-MM-DD'}), 400
    
    log = HabitLog.query.filter_by(habit_id=habit_id, date=log_date_obj).first()
    
    if not log:
        return jsonify({'error': 'Запись не найдена'}), 404
    
    data = request.get_json()
    
    # Обновление полей
    if 'completed' in data:
        # Если статус выполнения изменился, нужно обновить серию выполнений
        if log.completed != data['completed']:
            # Сбрасываем текущую серию и пересчитываем её
            habit.streak_current = 0
            
            # Получаем все записи о выполнении, отсортированные по дате
            all_logs = HabitLog.query.filter_by(habit_id=habit_id).order_by(HabitLog.date).all()
            
            # Пересчитываем серию выполнений
            current_streak = 0
            for l in all_logs:
                if l.completed:
                    current_streak += 1
                    if current_streak > habit.streak_longest:
                        habit.streak_longest = current_streak
                else:
                    current_streak = 0
            
            habit.streak_current = current_streak
        
        log.completed = data['completed']
    
    if 'value' in data:
        log.value = data['value']
    
    if 'notes' in data:
        log.notes = data['notes']
    
    db.session.commit()
    
    return jsonify({'message': 'Запись о выполнении привычки успешно обновлена', 'log': log.to_dict()}), 200

@logs_bp.route('/habits/<int:habit_id>/logs/<string:log_date>', methods=['DELETE'])
def delete_habit_log(habit_id, log_date):
    """Удаление записи о выполнении привычки"""
    # Проверка существования привычки
    habit = Habit.query.get_or_404(habit_id)
    
    try:
        log_date_obj = datetime.strptime(log_date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Неверный формат даты. Используйте формат YYYY-MM-DD'}), 400
    
    log = HabitLog.query.filter_by(habit_id=habit_id, date=log_date_obj).first()
    
    if not log:
        return jsonify({'error': 'Запись не найдена'}), 404
    
    db.session.delete(log)
    
    # Пересчитываем серию выполнений
    habit.streak_current = 0
    
    # Получаем все записи о выполнении, отсортированные по дате
    all_logs = HabitLog.query.filter_by(habit_id=habit_id).order_by(HabitLog.date).all()
    
    # Пересчитываем серию выполнений
    current_streak = 0
    for l in all_logs:
        if l.completed:
            current_streak += 1
            if current_streak > habit.streak_longest:
                habit.streak_longest = current_streak
        else:
            current_streak = 0
    
    habit.streak_current = current_streak
    
    db.session.commit()
    
    return jsonify({'message': 'Запись о выполнении привычки успешно удалена'}), 200
