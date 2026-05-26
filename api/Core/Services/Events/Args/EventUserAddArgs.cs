namespace YouthUnion.Core.Services.Events.Args;

public class EventUserAddArgs
{
    public string UserName { get; set; } = default!;
    public Guid EventId { get; set; }
}
