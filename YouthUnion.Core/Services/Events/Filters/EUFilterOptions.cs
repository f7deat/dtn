using THPCore.Models;

namespace YouthUnion.Core.Services.Events.Filters;

public class EUFilterOptions : FilterOptions
{
    public Guid? EventId { get; set; }
}
