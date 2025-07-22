using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using THPCore.Infrastructures;

namespace YouthUnion.Entities;

public class EventRegistration : BaseEntity
{
    [ForeignKey(nameof(Event))]
    public Guid EventId { get; set; }
    [StringLength(256)]
    public string UserName { get; set; } = default!;
    public DateTime RegisterDate { get; set; }
    public EventRegistrationStatus Status { get; set; }
    public string? Note { get; set; }

    public virtual Event? Event { get; set; }
}

public enum EventRegistrationStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}
