from datetime import datetime
from src.models.user import db

class HabitLog(db.Model):
    """Модель записи о выполнении привычки для приложения Harmony"""
    __tablename__ = 'habit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    habit_id = db.Column(db.Integer, db.ForeignKey('habits.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    value = db.Column(db.Float)
    notes = db.Column(db.Text)
    completed = db.Column(db.Boolean, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def __init__(self, habit_id, date, completed, value=None, notes=None):
        self.habit_id = habit_id
        self.date = date
        self.value = value
        self.notes = notes
        self.completed = completed
        self.created_at = datetime.utcnow()
    
    def to_dict(self):
        """Преобразует объект в словарь для API"""
        return {
            'id': self.id,
            'habit_id': self.habit_id,
            'date': self.date.isoformat(),
            'value': self.value,
            'notes': self.notes,
            'completed': self.completed,
            'created_at': self.created_at.isoformat()
        }
