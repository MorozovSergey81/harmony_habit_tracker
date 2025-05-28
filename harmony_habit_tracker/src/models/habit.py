import json
from datetime import datetime
from src.models.user import db

class Habit(db.Model):
    """Модель привычки для приложения Harmony"""
    __tablename__ = 'habits'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(50))
    color = db.Column(db.String(20))
    frequency = db.Column(db.Text)  # JSON строка для хранения частоты
    target_value = db.Column(db.Float)
    unit = db.Column(db.String(20))
    reminder_time = db.Column(db.Time)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    streak_current = db.Column(db.Integer, default=0)
    streak_longest = db.Column(db.Integer, default=0)
    
    # Отношения
    logs = db.relationship('HabitLog', backref='habit', lazy=True, cascade='all, delete-orphan')
    statistics = db.relationship('Statistic', backref='habit', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, user_id, name, description=None, icon=None, color=None, 
                 frequency=None, target_value=None, unit=None, reminder_time=None):
        self.user_id = user_id
        self.name = name
        self.description = description
        self.icon = icon
        self.color = color
        self.frequency = json.dumps(frequency) if frequency else json.dumps({"type": "daily"})
        self.target_value = target_value
        self.unit = unit
        self.reminder_time = reminder_time
        self.created_at = datetime.utcnow()
        self.is_active = True
        self.streak_current = 0
        self.streak_longest = 0
    
    def get_frequency(self):
        """Получает частоту в виде объекта Python"""
        return json.loads(self.frequency)
    
    def set_frequency(self, frequency_obj):
        """Устанавливает частоту из объекта Python"""
        self.frequency = json.dumps(frequency_obj)
    
    def update_streak(self, completed):
        """Обновляет текущую и самую длинную серию выполнений"""
        if completed:
            self.streak_current += 1
            if self.streak_current > self.streak_longest:
                self.streak_longest = self.streak_current
        else:
            self.streak_current = 0
    
    def to_dict(self):
        """Преобразует объект в словарь для API"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'color': self.color,
            'frequency': self.get_frequency(),
            'target_value': self.target_value,
            'unit': self.unit,
            'reminder_time': str(self.reminder_time) if self.reminder_time else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_active': self.is_active,
            'streak_current': self.streak_current,
            'streak_longest': self.streak_longest
        }
