using THPCore.Models;

namespace YouthUnion.Core.Services.Events.Filters;

public class EUFilterOptions : FilterOptions
{
    public Guid? EventId { get; set; }
    public string? UserName { get; set; }
    public string? FullName { get; set; }
    public string? ClassCode { get; set; }
    public bool? IsCheckedIn { get; set; }
}
