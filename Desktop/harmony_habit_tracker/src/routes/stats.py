from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.habit import Habit
from src.models.habit_log import HabitLog
from src.models.statistic import Statistic
from datetime import datetime, date, timedelta
from sqlalchemy import func
import calendar

stats_bp = Blueprint('stats', __name__)

@stats_bp.route('/habits/<int:habit_id>/stats', methods=['GET'])
def get_habit_stats(habit_id):
    """Получение статистики по конкретной привычке"""
    # Проверка существования привычки
    habit = Habit.query.get_or_404(habit_id)
    
    # Получение параметров из запроса
    period_type = request.args.get('period_type', 'week')  # По умолчанию - неделя
    
    # Проверка корректности типа периода
    if period_type not in ['day', 'week', 'month', 'year']:
        return jsonify({'error': 'Неверный тип периода. Допустимые значения: day, week, month, year'}), 400
    
    # Получение статистики из базы данных
    stats = Statistic.query.filter_by(
        habit_id=habit_id,
        period_type=period_type
    ).order_by(Statistic.period_start.desc()).all()
    
    # Если статистика не найдена, рассчитываем её
    if not stats:
        stats = calculate_statistics(habit_id, period_type)
    
    return jsonify([stat.to_dict() for stat in stats]), 200

@stats_bp.route('/habits/<int:habit_id>/stats/calculate', methods=['POST'])
def calculate_habit_stats(habit_id):
    """Принудительный расчет статистики по привычке"""
    # Проверка существования привычки
    habit = Habit.query.get_or_404(habit_id)
    
    data = request.get_json()
    period_type = data.get('period_type', 'week')  # По умолчанию - неделя
    
    # Проверка корректности типа периода
    if period_type not in ['day', 'week', 'month', 'year']:
        return jsonify({'error': 'Неверный тип периода. Допустимые значения: day, week, month, year'}), 400
    
    # Расчет статистики
    stats = calculate_statistics(habit_id, period_type)
    
    return jsonify({
        'message': f'Статистика по привычке успешно рассчитана для периода: {period_type}',
        'stats': [stat.to_dict() for stat in stats]
    }), 200

@stats_bp.route('/user/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    """Получение общей статистики по всем привычкам пользователя"""
    # Получение всех привычек пользователя
    habits = Habit.query.filter_by(user_id=user_id).all()
    
    if not habits:
        return jsonify({'message': 'У пользователя нет привычек'}), 200
    
    # Сбор статистики по каждой привычке
    result = []
    for habit in habits:
        # Получение последней статистики по каждому типу периода
        stats = {}
        for period_type in ['day', 'week', 'month', 'year']:
            stat = Statistic.query.filter_by(
                habit_id=habit.id,
                period_type=period_type
            ).order_by(Statistic.period_start.desc()).first()
            
            if stat:
                stats[period_type] = stat.to_dict()
        
        result.append({
            'habit': habit.to_dict(),
            'stats': stats
        })
    
    return jsonify(result), 200

def calculate_statistics(habit_id, period_type):
    """Вспомогательная функция для расчета статистики"""
    habit = Habit.query.get(habit_id)
    
    # Определение периодов для расчета
    today = date.today()
    periods = []
    
    if period_type == 'day':
        # Последние 30 дней
        for i in range(30):
            day = today - timedelta(days=i)
            periods.append((day, day))
    
    elif period_type == 'week':
        # Последние 12 недель
        for i in range(12):
            end_date = today - timedelta(days=today.weekday() + 7 * i)
            start_date = end_date - timedelta(days=6)
            periods.append((start_date, end_date))
    
    elif period_type == 'month':
        # Последние 12 месяцев
        for i in range(12):
            current_month = today.month - i
            current_year = today.year
            
            while current_month <= 0:
                current_month += 12
                current_year -= 1
            
            last_day = calendar.monthrange(current_year, current_month)[1]
            start_date = date(current_year, current_month, 1)
            end_date = date(current_year, current_month, last_day)
            
            periods.append((start_date, end_date))
    
    elif period_type == 'year':
        # Последние 5 лет
        for i in range(5):
            year = today.year - i
            start_date = date(year, 1, 1)
            end_date = date(year, 12, 31)
            periods.append((start_date, end_date))
    
    # Расчет статистики для каждого периода
    stats = []
    for start_date, end_date in periods:
        # Получение всех записей о выполнении за период
        logs = HabitLog.query.filter(
            HabitLog.habit_id == habit_id,
            HabitLog.date >= start_date,
            HabitLog.date <= end_date
        ).all()
        
        # Расчет статистики
        total_days = (end_date - start_date).days + 1
        completed_days = sum(1 for log in logs if log.completed)
        
        completion_rate = (completed_days / total_days) * 100 if total_days > 0 else 0
        
        # Расчет среднего и общего значения (если применимо)
        values = [log.value for log in logs if log.value is not None]
        average_value = sum(values) / len(values) if values else None
        total_value = sum(values) if values else None
        
        # Создание или обновление записи статистики
        stat = Statistic.query.filter_by(
            habit_id=habit_id,
            period_type=period_type,
            period_start=start_date,
            period_end=end_date
        ).first()
        
        if stat:
            stat.completion_rate = completion_rate
            stat.average_value = average_value
            stat.total_value = total_value
            stat.calculated_at = datetime.utcnow()
        else:
            stat = Statistic(
                habit_id=habit_id,
                period_type=period_type,
                period_start=start_date,
                period_end=end_date,
                completion_rate=completion_rate,
                average_value=average_value,
                total_value=total_value
            )
            db.session.add(stat)
        
        stats.append(stat)
    
    db.session.commit()
    return stats
