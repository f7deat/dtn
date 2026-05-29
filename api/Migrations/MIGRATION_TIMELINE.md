# Migration Timeline by Domain

This file documents the migration sequence currently used in production order.
Do not reorder existing migration ids after they are applied to any environment.

## Chronological Timeline

1. 20260527022927_InitialCreate
- Domain: Foundation
- Purpose: Initial schema for identity and core tables.

2. 20260527023753_AcademicYearTable
- Domain: AcademicYear
- Purpose: Add academic year support.

3. 20260529130010_UnkTableField1
- Domain: Semester + Event
- Implementation class: SemesterAndEventLink
- File stem: 20260529130010_SemesterAndEventLink
- Purpose: Add Semesters table and link Events -> Semester.

4. 20260529135954_EventAddNumberOfDaysRemoveAcademicYear
- Domain: Event
- Purpose: Remove Event.AcademicYearId and add Event.NumberOfDays.

5. 20260529143441_EventAttendanceByDay
- Domain: Attendance
- Purpose: Add daily attendance table for multi-day event check-in/check-out.

## Naming Guideline for Future Migrations

- Use format: yyyyMMddHHmmss_<Domain>_<Intent>
- Examples:
  - 20260601103000_Event_AddDailySummary
  - 20260601120000_Semester_AddStatus

## Safety Rules

- Never rename migration ids that are already applied.
- If class names are unclear, you may rename the C# class only, keeping the id string unchanged.
- If a migration was generated but never applied and is duplicated by another migration, remove it from source before commit.
