using YouthUnion.Core.Entities;

namespace YouthUnion.Core.Services.Events.Args;

public class EventCreateArgs
{
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int NumberOfDays { get; set; } = 1;
    public string? Content { get; set; }
    public string? Thumbnail { get; set; }
    public EventType EventType { get; set; } = EventType.Limited;
    public int? SemesterId { get; set; }
}
