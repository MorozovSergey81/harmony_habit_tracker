# Проектирование базы данных для приложения "Harmony"

## Основные сущности

### 1. Пользователи (Users)
- **id**: INTEGER PRIMARY KEY - уникальный идентификатор пользователя
- **username**: VARCHAR(50) NOT NULL UNIQUE - имя пользователя
- **email**: VARCHAR(100) NOT NULL UNIQUE - электронная почта
- **password_hash**: VARCHAR(255) NOT NULL - хэш пароля
- **created_at**: DATETIME NOT NULL - дата создания аккаунта
- **last_login**: DATETIME - дата последнего входа

### 2. Привычки (Habits)
- **id**: INTEGER PRIMARY KEY - уникальный идентификатор привычки
- **user_id**: INTEGER NOT NULL - внешний ключ к таблице пользователей
- **name**: VARCHAR(100) NOT NULL - название привычки
- **description**: TEXT - описание привычки
- **icon**: VARCHAR(50) - иконка привычки
- **color**: VARCHAR(20) - цвет для отображения привычки
- **frequency**: JSON - частота выполнения (ежедневно, по определенным дням недели и т.д.)
- **target_value**: FLOAT - целевое значение (если применимо)
- **unit**: VARCHAR(20) - единица измерения (если применимо)
- **reminder_time**: TIME - время напоминания
- **created_at**: DATETIME NOT NULL - дата создания привычки
- **updated_at**: DATETIME - дата последнего обновления
- **is_active**: BOOLEAN DEFAULT TRUE - активна ли привычка
- **streak_current**: INTEGER DEFAULT 0 - текущая серия выполнений
- **streak_longest**: INTEGER DEFAULT 0 - самая длинная серия выполнений

### 3. Записи о выполнении (HabitLogs)
- **id**: INTEGER PRIMARY KEY - уникальный идентификатор записи
- **habit_id**: INTEGER NOT NULL - внешний ключ к таблице привычек
- **date**: DATE NOT NULL - дата выполнения
- **value**: FLOAT - значение выполнения (если применимо)
- **notes**: TEXT - заметки о выполнении
- **completed**: BOOLEAN NOT NULL - выполнена ли привычка
- **created_at**: DATETIME NOT NULL - дата создания записи

### 4. Статистика (Statistics)
- **id**: INTEGER PRIMARY KEY - уникальный идентификатор статистики
- **habit_id**: INTEGER NOT NULL - внешний ключ к таблице привычек
- **period_type**: VARCHAR(20) NOT NULL - тип периода (день, неделя, месяц, год)
- **period_start**: DATE NOT NULL - начало периода
- **period_end**: DATE NOT NULL - конец периода
- **completion_rate**: FLOAT - процент выполнения
- **average_value**: FLOAT - среднее значение (если применимо)
- **total_value**: FLOAT - общее значение (если применимо)
- **calculated_at**: DATETIME NOT NULL - дата расчета статистики

## Связи между таблицами

1. **Users (1) → Habits (N)**: Один пользователь может иметь множество привычек
2. **Habits (1) → HabitLogs (N)**: Одна привычка может иметь множество записей о выполнении
3. **Habits (1) → Statistics (N)**: Одна привычка может иметь множество статистических записей

## Индексы

1. **Users**: индекс по email и username для быстрого поиска
2. **Habits**: индекс по user_id для быстрого получения привычек пользователя
3. **HabitLogs**: составной индекс по habit_id и date для быстрого получения записей за определенный период
4. **Statistics**: составной индекс по habit_id, period_type и period_start для быстрого получения статистики

## Триггеры и автоматизация

1. **Обновление streak_current и streak_longest**: При добавлении новой записи в HabitLogs автоматически обновлять текущую и самую длинную серию выполнений в таблице Habits
2. **Автоматический расчет статистики**: При добавлении новой записи в HabitLogs автоматически обновлять соответствующие записи в таблице Statistics

## Диаграмма базы данных (ER-диаграмма)

```
+----------------+       +----------------+       +----------------+
|     Users      |       |     Habits     |       |   HabitLogs    |
+----------------+       +----------------+       +----------------+
| id             |<----->| id             |<----->| id             |
| username       |       | user_id        |       | habit_id       |
| email          |       | name           |       | date           |
| password_hash  |       | description    |       | value          |
| created_at     |       | icon           |       | notes          |
| last_login     |       | color          |       | completed      |
+----------------+       | frequency      |       | created_at     |
                         | target_value   |       +----------------+
                         | unit           |
                         | reminder_time  |       +----------------+
                         | created_at     |       |   Statistics   |
                         | updated_at     |       +----------------+
                         | is_active      |<----->| id             |
                         | streak_current |       | habit_id       |
                         | streak_longest |       | period_type    |
                         +----------------+       | period_start   |
                                                  | period_end     |
                                                  | completion_rate|
                                                  | average_value  |
                                                  | total_value    |
                                                  | calculated_at  |
                                                  +----------------+
```

## Примечания по реализации

1. **JSON для frequency**: Позволяет гибко настраивать частоту выполнения привычки (например, `{"type": "weekly", "days": [1, 3, 5]}` для привычки, выполняемой по понедельникам, средам и пятницам)
2. **Расчет streak**: Требует логики на стороне сервера для правильного подсчета серий выполнений с учетом частоты привычки
3. **Статистика**: Может рассчитываться как в реальном времени, так и через фоновые задачи для оптимизации производительности
4. **Безопасность**: Обязательное хэширование паролей и проверка доступа к данным только для соответствующего пользователя
