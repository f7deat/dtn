namespace YouthUnion.Core.Services.Events.Models;

public sealed record EventCheckInExportItem(
    string UserId,
    string? UserName,
    string? Name,
    bool? Gender,
    string? PhoneNumber,
    DateTime? DateOfBirth,
    string? DepartmentName,
    DateOnly AttendanceDate,
    DateTime? CheckedInAt,
    string? CheckedInBy,
    DateTime? CheckedOutAt,
    string? CheckedOutBy);
