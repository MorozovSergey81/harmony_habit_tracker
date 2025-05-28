from datetime import datetime
from src.models.user import db

class Statistic(db.Model):
    """Модель статистики привычки для приложения Harmony"""
    __tablename__ = 'statistics'
    
    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey('habits.id'), nullable=False)
    period_type = db.Column(db.String(20), nullable=False)  # day, week, month, year
    period_start = db.Column(db.Date, nullable=False)
    period_end = db.Column(db.Date, nullable=False)
    completion_rate = db.Column(db.Float)
    average_value = db.Column(db.Float)
    total_value = db.Column(db.Float)
    calculated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def __init__(self, habit_id, period_type, period_start, period_end, 
                 completion_rate=None, average_value=None, total_value=None):
        self.habit_id = habit_id
        self.period_type = period_type
        self.period_start = period_start
        self.period_end = period_end
        self.completion_rate = completion_rate
        self.average_value = average_value
        self.total_value = total_value
        self.calculated_at = datetime.utcnow()
    
    def to_dict(self):
        """Преобразует объект в словарь для API"""
        return {
            'id': self.id,
            'habit_id': self.habit_id,
            'period_type': self.period_type,
            'period_start': self.period_start.isoformat(),
            'period_end': self.period_end.isoformat(),
            'completion_rate': self.completion_rate,
            'average_value': self.average_value,
            'total_value': self.total_value,
            'calculated_at': self.calculated_at.isoformat()
        }
