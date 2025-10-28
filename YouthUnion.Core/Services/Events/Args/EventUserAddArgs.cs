namespace YouthUnion.Core.Services.Events.Args;

public class EventUserAddArgs
{
    public string UserId { get; set; } = default!;
    public Guid EventId { get; set; }
}
