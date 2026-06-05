using Microsoft.IdentityModel.Abstractions;
using System.ComponentModel.DataAnnotations;
using THPCore.Infrastructures;

namespace YouthUnion.Core.Entities;

public class ApplicationLog : BaseEntity
{
    [StringLength(256)]
    public string UserName { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
    public string Message { get; set; } = default!;
    public EventLogLevel LogLevel { get; set; }
}
