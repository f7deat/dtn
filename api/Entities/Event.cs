using System.ComponentModel.DataAnnotations;
using THPCore.Infrastructures;

namespace YouthUnion.Entities;

public class Event : AuditEntity
{
    [StringLength(1024)]
    public string Title { get; set; } = default!;
    [StringLength(2048)]
    public string Description { get; set; } = default!;
    public string? Content { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }

    public virtual ICollection<EventRegistration>? EventRegistrations { get; set; }
}
