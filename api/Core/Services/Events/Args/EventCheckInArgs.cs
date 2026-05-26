namespace YouthUnion.Core.Services.Events.Args;

public class EventCheckInArgs
{
    public Guid? EventId { get; set; }
    public string QrCode { get; set; } = default!;
    public string? Action { get; set; }
}