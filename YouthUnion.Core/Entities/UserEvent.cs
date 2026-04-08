using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace YouthUnion.Core.Entities;

public class UserEvent
{
    [ForeignKey(nameof(Event))]
    public Guid EventId { get; set; }
    [StringLength(450)]
    public string UserId { get; set; } = default!;
    public DateTime? CheckedInAt { get; set; }
    [StringLength(256)]
    public string? CheckedInBy { get; set; }

    public virtual Event? Event { get; set; }
}
