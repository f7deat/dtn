namespace YouthUnion.Core.Services.Events.Models;

public sealed record EventCheckInImportItem(
    string UserName,
    DateOnly AttendanceDate,
    DateTime? CheckedInAt,
    string? CheckedInBy,
    DateTime? CheckedOutAt,
    string? CheckedOutBy);
