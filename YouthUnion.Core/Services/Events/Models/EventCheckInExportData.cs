namespace YouthUnion.Core.Services.Events.Models;

public sealed record EventCheckInExportData(
    string Title,
    DateOnly? StartDate,
    DateOnly? EndDate,
    IReadOnlyList<EventCheckInExportItem> Items);
