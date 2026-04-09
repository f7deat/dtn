namespace YouthUnion.Core.Services.Events.Models;

public sealed record EventCheckInExportItem(
    string UserId,
    string? UserName,
    string? Name,
    bool? Gender,
    string? PhoneNumber,
    DateTime? DateOfBirth,
    string? ClassCode,
    string? DepartmentName,
    DateTime? CheckedInAt,
    string? CheckedInBy);
