namespace YouthUnion.Core.Services.Events.Args;

public class EventUserRemoveArgs
{
    public Guid EventId { get; set; }
    public string UserId { get; set; } = default!;
}
