using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace YouthUnion.Core.Entities;

public class UserEventAttendance
{
    [Key]
    public long Id { get; set; }

    [ForeignKey(nameof(Event))]
    public Guid EventId { get; set; }

    [StringLength(450)]
    public string UserId { get; set; } = default!;

    public DateOnly AttendanceDate { get; set; }
    public DateTime? CheckedInAt { get; set; }

    [StringLength(256)]
    public string? CheckedInBy { get; set; }

    public DateTime? CheckedOutAt { get; set; }

    [StringLength(256)]
    public string? CheckedOutBy { get; set; }

    public virtual Event? Event { get; set; }
    public virtual UserEvent? UserEvent { get; set; }
}
