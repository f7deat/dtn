using System.ComponentModel.DataAnnotations;
using THPCore.Infrastructures;
using YouthUnion.Entities;

namespace YouthUnion.Core.Entities;

public class Event : BaseEntity
{
    [StringLength(1024)]
    public string Title { get; set; } = default!;
    [StringLength(2048)]
    public string? Description { get; set; }
    public string? Content { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    [StringLength(2048)]
    public string? Thumbnail { get; set; }
    public EventType EventType { get; set; } = EventType.Limited;

    public virtual ICollection<EventRegistration>? EventRegistrations { get; set; }
    public virtual ICollection<UserEvent>? UserEvents { get; set; }
}

public enum EventType
{
    Limited = 0,
    Public = 1
}