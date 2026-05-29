using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
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
    public int NumberOfDays { get; set; } = 1;
    [StringLength(2048)]
    public string? Thumbnail { get; set; }
    public EventType EventType { get; set; } = EventType.Limited;
    [ForeignKey(nameof(Semester))]
    public int? SemesterId { get; set; }

    public virtual Semester? Semester { get; set; }
    public virtual ICollection<EventRegistration>? EventRegistrations { get; set; }
    public virtual ICollection<UserEvent>? UserEvents { get; set; }
    public virtual ICollection<UserEventAttendance>? UserEventAttendances { get; set; }
}

public enum EventType
{
    Limited = 0,
    Public = 1
}