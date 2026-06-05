using THPCore.Models;

namespace YouthUnion.Models.Filters;

public class LogFilterOptions : FilterOptions
{
    public string? UserName { get; set; }
    public string? Message { get; set; }
}
